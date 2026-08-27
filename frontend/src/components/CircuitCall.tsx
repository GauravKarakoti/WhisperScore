import React, { useState } from 'react';
import * as whisperScoreContract from '../contracts/whisper_score/contract/index.js';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { useMidnight } from '../hooks/useMidnight.tsx';

import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';

export const CircuitCall: React.FC<{ contractAddress: string }> = ({ contractAddress }) => {
  const [isProving, setIsProving] = useState(false);
  const [txResult, setTxResult] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState<string>(''); // Captures user's private value

  const { providers } = useMidnight();
  
  const executeCircuit = async () => {
    if (!providers) {
      console.error("Midnight providers are not initialized.");
      setTxResult("Error: Please connect your wallet first.");
      return;
    }

    if (!scoreInput || isNaN(Number(scoreInput))) {
      setTxResult("Error: Please enter a valid numeric score.");
      return;
    }

    setIsProving(true);
    setTxResult(null);

    try {
      // Cast the string input to the bigint required by the Compact witness
      const userPrivateScore = BigInt(scoreInput); 

      const config = await providers.getConfiguration();
      const shieldedState = await providers.getShieldedAddresses();

      const publicDataProvider = indexerPublicDataProvider(config.indexerUri, config.indexerWsUri);
      const zkConfigProvider = new FetchZkConfigProvider(window.location.origin);
      const proofProvider = await providers.getProvingProvider(zkConfigProvider);

      const inMemoryPrivateState: Record<string, any> = {};

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
          setContractAddress: (_addr: string) => {},
          get: async (id: string) => inMemoryPrivateState[id] ?? undefined, 
          set: async (id: string, state: any) => { inMemoryPrivateState[id] = state; },
          remove: async (id: string) => { delete inMemoryPrivateState[id]; }
        },
        privateUserValue: (witnessContext: any) => [
          witnessContext.currentPrivateState ?? undefined, 
          userPrivateScore // Injected locally into the ZK proof generation
        ],
      } as any; 

      const compiledContract = {
        contract: whisperScoreContract.Contract,
        ledger: whisperScoreContract.ledger,
        pureCircuits: whisperScoreContract.pureCircuits
      };

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
    <div style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>Verify Eligibility</h3>
      <p style={{ color: 'var(--text)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        Enter your score. It remains encrypted on your device and is never broadcast to the ledger.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input 
          type="number" 
          placeholder="Enter private value (e.g. 750)" 
          value={scoreInput}
          onChange={(e) => setScoreInput(e.target.value)}
          style={{
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text-h)',
            fontFamily: 'var(--mono)',
            fontSize: '16px',
            width: '100%',
            boxSizing: 'border-box'
          }}
        />
        
        <button 
          onClick={executeCircuit} 
          disabled={isProving || !providers || !scoreInput}
        >
          {isProving ? "Generating ZK Proof Locally..." : "Generate Proof & Submit"}
        </button>
      </div>

      {txResult && (
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: txResult.startsWith('Error') ? 'rgba(255, 77, 79, 0.1)' : 'var(--code-bg)', 
          border: `1px solid ${txResult.startsWith('Error') ? '#ff4d4f' : 'var(--border)'}`, 
          borderRadius: '6px',
          whiteSpace: 'pre-line',
          textAlign: 'left'
        }}>
          <strong style={{ color: txResult.startsWith('Error') ? '#ff4d4f' : 'var(--text-h)' }}>
            {txResult.startsWith('Error') ? 'Execution Failed' : 'Transaction Successful!'}
          </strong>
          <p style={{ fontFamily: 'var(--mono)', wordBreak: 'break-all', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            {txResult}
          </p>
        </div>
      )}
    </div>
  );
};