import React, { useState } from 'react';

export const WalletConnect: React.FC = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      setError(null);
      // @ts-ignore - window.midnight is injected by Lace
      const laceConnector = window.midnight?.mnLace;
      
      if (!laceConnector) {
        throw new Error("Lace wallet is not installed or Midnight network is unsupported.");
      }

      // In v4, enable() is replaced by connect(networkId)
      const api = await laceConnector.connect('preprod');
      
      // Destructure the string from the returned object
      const { unshieldedAddress } = await api.getUnshieldedAddress();
      
      // Now you are passing a bare string to state
      setAddress(unshieldedAddress);
    } catch (err: any) {
      setError(err.message || "User rejected connection or network mismatch.");
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
  };

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