import React, { useMemo } from 'react';
import { useMidnight } from '../hooks/useMidnight.tsx';

export const WalletConnect: React.FC = () => {
  const { address, error, connectWallet, disconnectWallet } = useMidnight();

  const avatarGradient = useMemo(() => {
    if (!address) return '';
    const color1 = `#${address.slice(0, 6)}`;
    const color2 = `#${address.slice(6, 12)}`;
    return `linear-gradient(135deg, ${color1}, ${color2})`;
  }, [address]);

  return (
    <div className="card-body">
      <div className="card-header">
        <div>
          <h3>Lace Wallet</h3>
          <p>Connect to Midnight Preprod</p>
        </div>
        {address && (
          <div 
            style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '50%', 
              background: avatarGradient, 
              border: '2px solid var(--border)',
              boxShadow: 'var(--shadow-sm)'
            }} 
          />
        )}
      </div>
      
      {error && (
        <div className="alert alert-error mb-4">
          <strong>Connection Error</strong>
          <p>{error.includes('install') ? 'Lace wallet extension not found. Please install it to continue.' : error}</p>
        </div>
      )}
      
      {!address ? (
        <button onClick={connectWallet} className="action-btn">
          Connect Wallet
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="address-display">
            {address.slice(0, 12)}...{address.slice(-10)}
          </div>
          <button 
            onClick={disconnectWallet} 
            className="action-btn outline"
          >
            Disconnect
          </button>
        </div>
      )}

      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
        <span style={{ color: 'var(--text)' }}>Need test gas?</span>
        <a 
          href="https://faucet.preprod.midnight.network" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}
        >
          Get Preprod tDUST &rarr;
        </a>
      </div>
    </div>
  );
};