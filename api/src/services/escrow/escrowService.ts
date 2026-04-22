/**
 * EscrowService — viem integration for PayFearEscrow contract.
 *
 * Backend acts as the relayer (owner) to release/refund escrow.
 * Requester funds directly from their wallet on the frontend.
 *
 * Key safety guarantees:
 *  - Idempotent: checks on-chain status before writing (double-click safe)
 *  - Returns 'already_settled' result instead of throwing on re-entry
 *  - Callers must wrap in DB transaction lock (see review/admin controllers)
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  toHex,
  formatEther,
  type Hash,
  type Address,
} from 'viem';
import { baseSepolia, hardhat } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

// ─── ABI ─────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const abi = JSON.parse(readFileSync(join(__dirname, 'PayFearEscrow.abi.json'), 'utf-8'));

// ─── Config ──────────────────────────────────────

const ESCROW_ADDRESS = (env.ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;
const RELAYER_KEY = env.RELAYER_PRIVATE_KEY as `0x${string}` | undefined;
const CHAIN = env.CHAIN_ID === '31337' ? hardhat : baseSepolia;
const RPC_URL = env.RPC_URL || (CHAIN === hardhat ? 'http://127.0.0.1:8545' : 'https://sepolia.base.org');

// ─── On-chain Status Enum (mirrors contract) ────

export const OnchainStatus = {
  EMPTY: 0,
  FUNDED: 1,
  RELEASED: 2,
  REFUNDED: 3,
} as const;

const STATUS_NAMES = ['EMPTY', 'FUNDED', 'RELEASED', 'REFUNDED'] as const;
export type OnchainStatusName = typeof STATUS_NAMES[number];

// ─── Settlement Result ──────────────────────────

export type SettlementResult = {
  /** 'confirmed' = tx mined, 'already_settled' = idempotent no-op, 'skipped' = no wallet */
  outcome: 'confirmed' | 'already_settled' | 'skipped';
  txHash: string | null;
  onchainStatus: OnchainStatusName;
};

// ─── Clients ─────────────────────────────────────

const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(RPC_URL),
});

function getWalletClient() {
  if (!RELAYER_KEY) {
    throw new Error('RELAYER_PRIVATE_KEY not configured — escrow operations disabled');
  }
  const account = privateKeyToAccount(RELAYER_KEY);
  return createWalletClient({
    account,
    chain: CHAIN,
    transport: http(RPC_URL),
  });
}

// ─── Helpers ─────────────────────────────────────

/** Convert a task UUID string to bytes32 for the contract */
export function taskIdToBytes32(taskId: string): `0x${string}` {
  return keccak256(toHex(taskId));
}

/** Read raw on-chain escrow status (0=EMPTY, 1=FUNDED, 2=RELEASED, 3=REFUNDED) */
async function readOnchainStatus(bytes32Id: `0x${string}`): Promise<number> {
  const raw = await publicClient.readContract({
    address: ESCROW_ADDRESS,
    abi,
    functionName: 'getStatus',
    args: [bytes32Id],
  });
  return Number(raw);
}

// ─── Read Functions ──────────────────────────────

export async function getEscrowStatus(taskId: string) {
  const bytes32Id = taskIdToBytes32(taskId);
  const escrow = await publicClient.readContract({
    address: ESCROW_ADDRESS,
    abi,
    functionName: 'getEscrow',
    args: [bytes32Id],
  }) as any;

  return {
    requester: escrow.requester as string,
    executor: escrow.executor as string,
    amount: formatEther(escrow.amount),
    platformFee: formatEther(escrow.platformFee),
    status: STATUS_NAMES[Number(escrow.status)] || 'UNKNOWN',
  };
}

export async function getContractStats() {
  const [totalEscrowed, totalReleased, feeBps] = await Promise.all([
    publicClient.readContract({ address: ESCROW_ADDRESS, abi, functionName: 'totalEscrowed' }),
    publicClient.readContract({ address: ESCROW_ADDRESS, abi, functionName: 'totalReleased' }),
    publicClient.readContract({ address: ESCROW_ADDRESS, abi, functionName: 'feeBps' }),
  ]);

  return {
    totalEscrowed: formatEther(totalEscrowed as bigint),
    totalReleased: formatEther(totalReleased as bigint),
    feeBps: Number(feeBps),
  };
}

// ─── Write Functions (Idempotent + Relayer) ──────

/**
 * Release escrowed funds to executor.
 * IDEMPOTENT: if on-chain status is already RELEASED, returns 'already_settled'.
 */
export async function releaseEscrow(
  taskId: string,
  executorAddress: string
): Promise<SettlementResult> {
  const bytes32Id = taskIdToBytes32(taskId);

  // ── Idempotency check: read on-chain first ──
  const currentStatus = await readOnchainStatus(bytes32Id);

  if (currentStatus === OnchainStatus.RELEASED) {
    logger.warn({ taskId }, 'releaseEscrow: already RELEASED on-chain — idempotent skip');
    return { outcome: 'already_settled', txHash: null, onchainStatus: 'RELEASED' };
  }

  if (currentStatus === OnchainStatus.REFUNDED) {
    logger.warn({ taskId }, 'releaseEscrow: already REFUNDED on-chain — cannot release');
    return { outcome: 'already_settled', txHash: null, onchainStatus: 'REFUNDED' };
  }

  if (currentStatus === OnchainStatus.EMPTY) {
    logger.warn({ taskId }, 'releaseEscrow: EMPTY on-chain — not funded yet');
    return { outcome: 'skipped', txHash: null, onchainStatus: 'EMPTY' };
  }

  // ── Status is FUNDED → proceed with release ──
  const client = getWalletClient();
  logger.info({ taskId, executorAddress }, 'Releasing escrow on-chain');

  const txHash = await client.writeContract({
    address: ESCROW_ADDRESS,
    abi,
    functionName: 'release',
    args: [bytes32Id, executorAddress as Address],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  logger.info({
    taskId, txHash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    status: receipt.status,
  }, 'Escrow released on-chain');

  if (receipt.status === 'reverted') {
    throw new Error(`Release tx reverted: ${txHash}`);
  }

  return { outcome: 'confirmed', txHash, onchainStatus: 'RELEASED' };
}

/**
 * Refund escrowed funds to requester.
 * IDEMPOTENT: if on-chain status is already REFUNDED, returns 'already_settled'.
 */
export async function refundEscrow(
  taskId: string
): Promise<SettlementResult> {
  const bytes32Id = taskIdToBytes32(taskId);

  // ── Idempotency check ──
  const currentStatus = await readOnchainStatus(bytes32Id);

  if (currentStatus === OnchainStatus.REFUNDED) {
    logger.warn({ taskId }, 'refundEscrow: already REFUNDED on-chain — idempotent skip');
    return { outcome: 'already_settled', txHash: null, onchainStatus: 'REFUNDED' };
  }

  if (currentStatus === OnchainStatus.RELEASED) {
    logger.warn({ taskId }, 'refundEscrow: already RELEASED on-chain — cannot refund');
    return { outcome: 'already_settled', txHash: null, onchainStatus: 'RELEASED' };
  }

  if (currentStatus === OnchainStatus.EMPTY) {
    logger.warn({ taskId }, 'refundEscrow: EMPTY on-chain — nothing to refund');
    return { outcome: 'skipped', txHash: null, onchainStatus: 'EMPTY' };
  }

  // ── Status is FUNDED → proceed with refund ──
  const client = getWalletClient();
  logger.info({ taskId }, 'Refunding escrow on-chain');

  const txHash = await client.writeContract({
    address: ESCROW_ADDRESS,
    abi,
    functionName: 'refund',
    args: [bytes32Id],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  logger.info({
    taskId, txHash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    status: receipt.status,
  }, 'Escrow refunded on-chain');

  if (receipt.status === 'reverted') {
    throw new Error(`Refund tx reverted: ${txHash}`);
  }

  return { outcome: 'confirmed', txHash, onchainStatus: 'REFUNDED' };
}

// ─── Service Status ──────────────────────────────

export function isEscrowEnabled(): boolean {
  return !!RELAYER_KEY && ESCROW_ADDRESS !== '0x0000000000000000000000000000000000000000';
}

export default {
  taskIdToBytes32,
  getEscrowStatus,
  getContractStats,
  releaseEscrow,
  refundEscrow,
  isEscrowEnabled,
};
