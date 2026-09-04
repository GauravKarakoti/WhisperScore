import React, { useMemo } from 'react';
import { useMidnight } from '../hooks/useMidnight.tsx';

export const WalletConnect: React.FC = () => {
  const { address, error, connectWallet, disconnectWallet } = useMidnight();

  // Generate a deterministic gradient avatar based on the address
  const avatarGradient = useMemo(() => {
    if (!address) return '';
    const color1 = `#${address.slice(0, 6)}`;
    const color2 = `#${address.slice(6, 12)}`;
    return `linear-gradient(135deg, ${color1}, ${color2})`;
  }, [address]);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ marginBottom: '0.3rem' }}>Lace Wallet</h3>
          <p style={{ color: 'var(--text)', fontSize: '0.9rem', margin: 0 }}>
            Connect to Midnight Preprod
          </p>
        </div>
        {address && (
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: avatarGradient, border: '2px solid var(--border)' }} />
        )}
      </div>
      
      {error && (
        <div className="alert alert-error mb-4">
          <strong>Connection Error</strong>
          <p>{error.includes('install') ? 'Lace wallet extension not found. Please install it to continue.' : error}</p>
        </div>
      )}
      
      {!address ? (
        <button onClick={connectWallet} className="action-btn w-100">
          Connect Wallet
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div className="address-display">
            {address.slice(0, 10)}...{address.slice(-8)}
          </div>
          <button 
            onClick={disconnectWallet} 
            className="action-btn outline w-100"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};