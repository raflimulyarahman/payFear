'use client';
import styles from './SettlementBadge.module.css';

/**
 * settlementState values from the API:
 *   not_configured | not_funded | funded | pending | confirmed | failed | refunded
 */
const STATES = {
  not_configured: {
    icon: 'cloud_off',
    label: 'Off-chain Only',
    color: 'neutral',
    description: 'This task is settled off-chain (escrow contract not configured)',
  },
  not_funded: {
    icon: 'account_balance_wallet',
    label: 'Not Funded',
    color: 'neutral',
    description: 'No on-chain escrow deposit found for this task',
  },
  funded: {
    icon: 'lock',
    label: 'Funds Locked',
    color: 'amber',
    description: 'ETH is locked in the escrow contract. Waiting for completion.',
  },
  pending: {
    icon: 'hourglass_top',
    label: 'Settlement Pending',
    color: 'amber',
    description: 'Task approved off-chain. On-chain settlement is processing...',
    animate: true,
  },
  confirmed: {
    icon: 'check_circle',
    label: 'Settled On-chain',
    color: 'green',
    description: 'Payment released on-chain and confirmed.',
  },
  failed: {
    icon: 'error',
    label: 'Settlement Failed',
    color: 'red',
    description: 'On-chain settlement failed. Contact support for resolution.',
  },
  refunded: {
    icon: 'undo',
    label: 'Refunded On-chain',
    color: 'blue',
    description: 'Funds have been refunded to the requester on-chain.',
  },
};

export default function SettlementBadge({ settlementState, txHash, compact = false }) {
  const state = STATES[settlementState] || STATES.not_configured;

  return (
    <div className={`${styles.badge} ${styles[state.color]} ${state.animate ? styles.animate : ''}`}>
      <span className={`material-symbols-outlined ${styles.icon}`}>
        {state.icon}
      </span>
      <div className={styles.content}>
        <span className={styles.label}>{state.label}</span>
        {!compact && <p className={styles.description}>{state.description}</p>}
        {txHash && (
          <a
            href={`https://sepolia.basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.txLink}
          >
            View on BaseScan ↗
          </a>
        )}
      </div>
    </div>
  );
}
