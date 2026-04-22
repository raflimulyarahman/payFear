'use client';
import { useState } from 'react';
import { wallet as walletApi } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/common/UIAtoms';
import styles from './ConnectWallet.module.css';

/**
 * ConnectWallet — link/unlink a wallet address.
 * Uses window.ethereum (MetaMask/Coinbase Wallet/etc).
 */
export default function ConnectWallet({ onConnected }) {
  const [connecting, setConnecting] = useState(false);
  const [address, setAddress] = useState(null);
  const { addToast } = useToast();

  const connect = async () => {
    if (!window.ethereum) {
      addToast('Please install a wallet (MetaMask, Coinbase Wallet)', 'error');
      return;
    }

    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const addr = accounts[0];

      // Switch to Base Sepolia
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x14A34' }], // 84532 in hex
        });
      } catch (switchErr) {
        // Chain not added yet — add it
        if (switchErr.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x14A34',
              chainName: 'Base Sepolia',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org'],
            }],
          });
        }
      }

      // Link to backend
      await walletApi.link(addr, 84532);
      setAddress(addr);
      addToast('Wallet linked successfully!', 'success');
      onConnected?.(addr);
    } catch (err) {
      addToast(err.message || 'Failed to connect wallet', 'error');
    } finally {
      setConnecting(false);
    }
  };

  if (address) {
    return (
      <div className={styles.connected}>
        <span className="material-symbols-outlined" style={{ color: 'var(--success)' }}>check_circle</span>
        <span className={styles.address}>{address.slice(0, 6)}...{address.slice(-4)}</span>
        <a 
          href={`https://sepolia.basescan.org/address/${address}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.viewLink}
        >
          View ↗
        </a>
      </div>
    );
  }

  return (
    <Button
      variant="secondary"
      onClick={connect}
      disabled={connecting}
      className={styles.connectBtn}
    >
      <span className="material-symbols-outlined">account_balance_wallet</span>
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}
