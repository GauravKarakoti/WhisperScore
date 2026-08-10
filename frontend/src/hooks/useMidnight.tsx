import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { WalletConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

// 1. Define the shared state shape
interface MidnightContextType {
  providers: WalletConnectedAPI | null;
  address: string | null;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const MidnightContext = createContext<MidnightContextType | null>(null);

// 2. Create the Provider component that will wrap your app
export const MidnightProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [providers, setProviders] = useState<WalletConnectedAPI | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    try {
      setError(null);
      
      const injectedWallets = (window as any).midnight ? Object.values((window as any).midnight) : [];
      const laceConnector: any = injectedWallets.find(
        (wallet: any) => wallet.rdns === 'io.lace.wallet' || wallet.name === 'lace'
      );
      
      if (!laceConnector) {
        throw new Error("Lace wallet is not installed or Midnight network is unsupported.");
      }

      const api = await laceConnector.connect('preprod');
      setProviders(api);
      
      const { unshieldedAddress } = await api.getUnshieldedAddress();
      setAddress(unshieldedAddress);
    } catch (err: any) {
      console.error("Wallet connection failed:", err);
      setError(err.message || "User rejected connection or network mismatch.");
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setProviders(null);
    setAddress(null);
  }, []);

  return (
    <MidnightContext.Provider value={{ providers, address, error, connectWallet, disconnectWallet }}>
      {children}
    </MidnightContext.Provider>
  );
};

// 3. Export the hook so components can consume the shared context
export const useMidnight = () => {
  const context = useContext(MidnightContext);
  if (!context) {
    throw new Error("useMidnight must be used within a MidnightProvider");
  }
  return context;
};