import React, { useState } from 'react';
import * as whisperScoreContract from '../../../contracts/managed/whisper_score/contract/index.js'; 
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
      const userPrivateScore = 800n; 

      const config = await providers.getConfiguration();
      const shieldedState = await providers.getShieldedAddresses();

      const publicDataProvider = indexerPublicDataProvider(config.indexerUri, config.indexerWsUri);
      const zkConfigProvider = new FetchZkConfigProvider(window.location.origin);
      const proofProvider = await providers.getProvingProvider(zkConfigProvider);

      const inMemoryPrivateState: Record<string, any> = {};

      // 1. PROVIDERS + WITNESSES
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
          get: async (id: string) => inMemoryPrivateState[id] ?? undefined, 
          set: async (id: string, state: any) => { inMemoryPrivateState[id] = state; },
          remove: async (id: string) => { delete inMemoryPrivateState[id]; }
        },
        // Witnesses belong right here in the providers!
        privateUserValue: (witnessContext: any) => [
          witnessContext.currentPrivateState ?? undefined, 
          userPrivateScore
        ],
      } as any; 

      // 2. MAP THE COMPILED CONTRACT CORRECTLY
      // We manually map your module's exports to the exact shape the SDK demands
      const compiledContract = {
        contract: whisperScoreContract.Contract, // Maps uppercase 'C' to lowercase 'c'
        ledger: whisperScoreContract.ledger,
        pureCircuits: whisperScoreContract.pureCircuits
      };

      // 3. FIND AND EXECUTE
      const whisperScore = await findDeployedContract(contractProviders, {
        contractAddress: contractAddress,
        compiledContract: compiledContract as any,
      });

      const tx = await whisperScore.callTx.checkEligibility();

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