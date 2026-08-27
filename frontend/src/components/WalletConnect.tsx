import React from 'react';
import { useMidnight } from '../hooks/useMidnight.tsx';

export const WalletConnect: React.FC = () => {
  const { address, error, connectWallet, disconnectWallet } = useMidnight();

  return (
    <div style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>Lace Wallet</h3>
      <p style={{ color: 'var(--text)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
        Connect your Lace wallet (Preprod network) to interact with the circuit.
      </p>
      
      {error && (
        <div style={{ marginBottom: '1rem', padding: '0.8rem', color: '#ff4d4f', background: 'rgba(255, 77, 79, 0.1)', border: '1px solid #ff4d4f', borderRadius: '6px', fontSize: '0.9rem' }}>
          <strong>Connection Error:</strong><br/>{error}
        </div>
      )}
      
      {!address ? (
        <button onClick={connectWallet} style={{ width: '100%', padding: '12px' }}>
          Connect Wallet
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ 
            padding: '12px', 
            background: 'var(--code-bg)', 
            borderRadius: '6px', 
            border: '1px solid var(--border)',
            fontFamily: 'var(--mono)',
            fontSize: '15px',
            color: 'var(--text-h)',
            textAlign: 'center',
            wordBreak: 'break-all'
          }}>
            {address.slice(0, 12)}...{address.slice(-10)}
          </div>
          <button 
            onClick={disconnectWallet} 
            style={{ 
              background: 'transparent', 
              color: '#ff4d4f', 
              border: '1px solid #ff4d4f',
              padding: '12px'
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};