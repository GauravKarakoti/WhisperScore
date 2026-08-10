import React from 'react';
import { useMidnight } from '../hooks/useMidnight.tsx'; // Pull from the shared context

export const WalletConnect: React.FC = () => {
  // Grab the shared state and functions from the context provider
  const { address, error, connectWallet, disconnectWallet } = useMidnight();

  return (
    <div className="wallet-container" style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>Lace Wallet</h3>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {!address ? (
        <button onClick={connectWallet} style={{ cursor: 'pointer', padding: '0.5rem 1rem' }}>
          Connect Wallet
        </button>
      ) : (
        <div>
          <p><strong>Connected Address:</strong> {address.slice(0, 10)}...{address.slice(-8)}</p>
          <button onClick={disconnectWallet} style={{ cursor: 'pointer', padding: '0.5rem 1rem', background: '#ff4d4f', color: 'white', border: 'none' }}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};