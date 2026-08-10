import React, { useState } from 'react';
import * as whisperScoreContract from '../../../contracts/managed/whisper_score/contract'; 
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { useMidnight } from '../hooks/useMidnight.tsx';

import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';

export const CircuitCall: React.FC<{ contractAddress: string }> = ({ contractAddress }) => {
  const [isProving, setIsProving] = useState(false);
  const [txResult, setTxResult] = useState<string | null>(null);

  const { providers } = useMidnight();
  
  const executeCircuit = async () => {
    if (!providers) {
      console.error("Midnight providers are not initialized.");
      setTxResult("Error: Please connect your wallet first.");
      return;
    }

    setIsProving(true);
    setTxResult(null);

    try {
      const userPrivateScore = 800n; // Your private witness value

      // 1. Fetch Lace network config and shielded keys
      const config = await providers.getConfiguration();
      const shieldedState = await providers.getShieldedAddresses();

      // 2. Initialize the heavy lifters
      const publicDataProvider = indexerPublicDataProvider(config.indexerUri, config.indexerWsUri);
      const zkConfigProvider = new FetchZkConfigProvider(window.location.origin);
      const proofProvider = await providers.getProvingProvider(zkConfigProvider);

      // 3. Assemble the provider stack and map Lace's transaction methods
      const contractProviders = {
        publicDataProvider,
        zkConfigProvider,
        proofProvider,
        walletProvider: {
          coinPublicKey: shieldedState.shieldedCoinPublicKey,
          encryptionPublicKey: shieldedState.shieldedEncryptionPublicKey,
          balanceTx: async (tx: any) => {
            const balanced = await providers.balanceUnsealedTransaction(tx);
            return balanced.tx;
          }
        },
        midnightProvider: {
          submitTx: async (tx: any) => {
            await providers.submitTransaction(tx);
          }
        },
        privateStateProvider: {
          setContractAddress: (addr: string) => {},
          get: async (id: string) => null,
          set: async (id: string, state: any) => {},
          remove: async (id: string) => {}
        },
        privateUserValue: (witnessContext: any) => [
          witnessContext.currentPrivateState ?? {}, 
          userPrivateScore
        ],
      } as any; 

      // 4. Connect to the smart contract
      const whisperScore = await findDeployedContract(contractProviders, {
        contractAddress: contractAddress as any,
        compiledContract: whisperScoreContract as any,
      });

      // 5. Execute the zero-knowledge proof locally
      const tx = await whisperScore.callTx.checkEligibility();

      // 6. Output the successful result
      setTxResult(`Tx Hash: ${tx.public.txHash}\nEligibility Verified: ${tx.private.result}`);
      
    } catch (error: any) {
      console.error("Circuit execution failed:", error);
      setTxResult(`Error: ${error.message || "Unknown execution failure"}`);
    } finally {
      setIsProving(false);
    }
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>Execute Midnight Circuit</h3>
      <p style={{ fontStyle: 'italic', color: '#555' }}>
        Proved without revealing your input
      </p>
      
      <button 
        onClick={executeCircuit} 
        disabled={isProving || !providers}
        style={{ cursor: isProving || !providers ? 'not-allowed' : 'pointer', padding: '0.5rem 1rem' }}
      >
        {isProving ? "Generating ZK Proof Locally..." : "Call Circuit"}
      </button>

      {txResult && (
        <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#e6ffe6', border: '1px solid #b3ffb3', whiteSpace: 'pre-line' }}>
          <strong>Transaction Submitted!</strong>
          <p style={{ fontFamily: 'monospace', wordBreak: 'break-all', marginTop: '0.5rem' }}>
            {txResult}
          </p>
        </div>
      )}
    </div>
  );
};