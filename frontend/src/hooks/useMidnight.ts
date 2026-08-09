import { useState, useCallback } from 'react';
import type { WalletConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

export const useMidnight = () => {
  const [providers, setProviders] = useState<WalletConnectedAPI | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    try {
      setError(null);
      // Lace injects mnLace into the window.midnight object
      const laceConnector = (window as any).midnight?.mnLace;
      
      if (!laceConnector) {
        throw new Error("Lace wallet is not installed or Midnight network is unsupported.");
      }

      // Enable the connection to get the DApp API provider
      const api = await laceConnector.enable();
      setProviders(api);
      
      // Fetch the currently selected address
      const state = await api.state();
      setAddress(state.address);
    } catch (err: any) {
      console.error("Wallet connection failed:", err);
      setError(err.message || "User rejected connection or network mismatch.");
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setProviders(null);
    setAddress(null);
  }, []);

  return { providers, address, error, connectWallet, disconnectWallet };
};