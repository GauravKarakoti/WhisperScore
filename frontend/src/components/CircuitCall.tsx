import React, { useState } from 'react';
import * as whisperScoreContract from '../contracts/managed/whisper_score/contract/index.js';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { useMidnight } from '../hooks/useMidnight.tsx';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';

type ProveState = 'idle' | 'fetching' | 'proving' | 'submitting';

export const CircuitCall: React.FC<{ contractAddress: string }> = ({ contractAddress }) => {
  const [proveState, setProveState] = useState<ProveState>('idle');
  const [txResult, setTxResult] = useState<{ hash: string; result: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const { providers } = useMidnight();
  
  const executeCircuit = async () => {
    if (!providers) {
      setErrorMsg("Wallet disconnected. Please connect your Lace wallet to proceed.");
      return;
    }

    setProveState('fetching');
    setErrorMsg(null);
    setTxResult(null);
    setIsRevealed(false);

    try {
      // Cast providers to any to bypass strict WalletConnectedAPI TypeScript limits
      const api = providers as any;

      // 1. Fetch Midnight Providers Configuration
      const config = await api.getConfiguration();
      const shieldedState = await api.getShieldedAddresses();

      // 2. Safely extract the balance from the observable stream
      let nativeBalance = 0n;
      try {
        const stateObservable = typeof api.state === 'function' ? await api.state() : api.state;
        
        if (stateObservable && typeof stateObservable.subscribe === 'function') {
          await new Promise<void>((resolve) => {
            const subscription = stateObservable.subscribe((s: any) => {
              nativeBalance = s.balances?.unshielded ?? 0n;
              subscription.unsubscribe();
              resolve();
            });
          });
        } else {
          nativeBalance = stateObservable?.balances?.unshielded ?? 0n;
        }
      } catch (warn) {
        console.warn("Could not parse balance from wallet state, defaulting to 0", warn);
      }

      // 3. Initialize Midnight JS Tooling
      const publicDataProvider = indexerPublicDataProvider(config.indexerUri, config.indexerWsUri);
      const zkConfigProvider = new FetchZkConfigProvider(window.location.origin);
      const proofProvider = await api.getProvingProvider(zkConfigProvider);

      const inMemoryPrivateState: Record<string, any> = {};

      const contractProviders = {
        publicDataProvider,
        zkConfigProvider,
        proofProvider,
        walletProvider: {
          coinPublicKey: shieldedState.shieldedCoinPublicKey,
          encryptionPublicKey: shieldedState.shieldedEncryptionPublicKey,
          balanceTx: async (tx: any) => {
            const balanced = await api.balanceUnsealedTransaction(tx);
            return balanced.tx;
          }
        },
        midnightProvider: {
          submitTx: async (tx: any) => {
            await api.submitTransaction(tx);
          }
        },
        privateStateProvider: {
          setContractAddress: (_addr: string) => {},
          get: async (id: string) => inMemoryPrivateState[id] ?? undefined, 
          set: async (id: string, state: any) => { inMemoryPrivateState[id] = state; },
          remove: async (id: string) => { delete inMemoryPrivateState[id]; }
        },
        // Feed the authenticated wallet balance into the zero-knowledge circuit
        externalChainBalance: (witnessContext: any) => [
          witnessContext.currentPrivateState ?? undefined, 
          nativeBalance
        ],
        stateSignature: (witnessContext: any) => [
          witnessContext.currentPrivateState ?? undefined,
          new Uint8Array(32) 
        ]
      } as any; 

      setProveState('proving');
      const compiledContract = {
        contract: whisperScoreContract.Contract,
        ledger: whisperScoreContract.ledger,
        pureCircuits: whisperScoreContract.pureCircuits
      };

      const whisperScore = await findDeployedContract(contractProviders, {
        contractAddress: contractAddress,
        compiledContract: compiledContract as any,
      });

      setProveState('submitting');
      const tx = await whisperScore.callTx.checkEligibility();

      setTxResult({
        hash: tx.public.txHash,
        result: String(tx.private.result)
      });
      
    } catch (error: any) {
      console.error("Circuit execution failed:", error);
      setErrorMsg(error.message || "Cryptographic proof generation or network submission failed.");
    } finally {
      setProveState('idle');
    }
  };

  const getButtonText = () => {
    switch (proveState) {
      case 'fetching': return 'Fetching Wallet State...';
      case 'proving': return 'Generating ZK Proof...';
      case 'submitting': return 'Submitting to Midnight...';
      default: return 'Verify Eligibility Score';
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>🔗</span> Eligibility Verification
      </h3>
      <p style={{ color: 'var(--text)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
        Your connected wallet balance is evaluated via a Zero-Knowledge proof <strong>locally on your device</strong>.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <button 
          onClick={executeCircuit} 
          disabled={proveState !== 'idle' || !providers}
          className={`action-btn ${proveState !== 'idle' ? 'loading' : ''}`}
        >
          {proveState !== 'idle' && <span className="spinner"></span>}
          {getButtonText()}
        </button>
      </div>

      {errorMsg && (
        <div className="alert alert-error mt-4">
          <strong>❌ Verification Failed</strong>
          <p>{errorMsg}</p>
        </div>
      )}

      {txResult && (
        <div className="alert alert-success mt-4">
          <strong>🌐 On-Chain State Updated</strong>
          <p style={{ marginBottom: '0.5rem' }}>Tx Hash: <span style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem' }}>{txResult.hash}</span></p>
          
          <div 
            className={`privacy-reveal ${isRevealed ? 'revealed' : ''}`}
            onClick={() => setIsRevealed(true)}
          >
            {!isRevealed && <span className="reveal-prompt">Click to reveal eligibility score</span>}
            <div className="reveal-content">
              Eligibility Verified: {txResult.result}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};