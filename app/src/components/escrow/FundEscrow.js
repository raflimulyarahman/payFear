'use client';
import { useState } from 'react';
import { Button } from '@/components/common/UIAtoms';
import { useToast } from '@/context/ToastContext';
import styles from './FundEscrow.module.css';

/**
 * FundEscrow — user clicks "Fund in Escrow" → signs a tx via their wallet.
 * Calls PayFearEscrow.fund(taskIdBytes32) with ETH value.
 * Props:
 *   contractAddress: string
 *   taskIdBytes32: string (from /v1/escrow/:taskId response)
 *   amountEth: string (e.g. "0.05")
 *   onFunded: (txHash) => void
 */
export default function FundEscrow({ contractAddress, taskIdBytes32, amountEth, onFunded, disabled }) {
  const [funding, setFunding] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const { addToast } = useToast();

  const handleFund = async () => {
    if (!window.ethereum) {
      addToast('Please install a wallet extension', 'error');
      return;
    }

    setFunding(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Encode function call: fund(bytes32 taskId)
      // function selector: keccak256("fund(bytes32)") = first 4 bytes
      const functionSelector = '0xb60d4288'; // keccak256("fund(bytes32)") = b60d428887...
      const encodedTaskId = taskIdBytes32.slice(2).padStart(64, '0');
      const data = functionSelector + encodedTaskId;

      // Convert ETH to wei hex
      const weiValue = BigInt(Math.round(parseFloat(amountEth) * 1e18));
      const valueHex = '0x' + weiValue.toString(16);

      const hash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: contractAddress,
          value: valueHex,
          data,
        }],
      });

      setTxHash(hash);
      addToast('Transaction sent! Waiting for confirmation...', 'info');

      // Poll for receipt
      const pollReceipt = async () => {
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const receipt = await window.ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [hash],
          });
          if (receipt) {
            if (receipt.status === '0x1') {
              addToast('Escrow funded on-chain! ✓', 'success');
              onFunded?.(hash);
            } else {
              addToast('Transaction reverted. Please try again.', 'error');
            }
            return;
          }
        }
        addToast('Transaction is still pending. Check BaseScan.', 'info');
      };

      pollReceipt();
    } catch (err) {
      if (err.code === 4001) {
        addToast('Transaction rejected by user', 'info');
      } else {
        addToast(err.message || 'Transaction failed', 'error');
      }
    } finally {
      setFunding(false);
    }
  };

  if (txHash) {
    return (
      <div className={styles.funded}>
        <span className="material-symbols-outlined" style={{ color: 'var(--amber-400)' }}>hourglass_top</span>
        <div>
          <p className={styles.fundedLabel}>Transaction Sent</p>
          <a
            href={`https://sepolia.basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.txLink}
          >
            View on BaseScan ↗
          </a>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      onClick={handleFund}
      disabled={funding || disabled}
      className={styles.fundBtn}
    >
      <span className="material-symbols-outlined">lock</span>
      {funding ? 'Signing...' : `Fund ${amountEth} ETH in Escrow`}
    </Button>
  );
}
