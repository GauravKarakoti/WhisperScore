import React, { useState } from 'react';
import * as whisperScoreContract from '../contracts/managed/whisper_score/contract/index.js';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { useMidnight } from '../hooks/useMidnight';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';

type ProveState = 'idle' | 'fetching' | 'proving' | 'submitting';

export const VerifyPowerUser: React.FC<{ contractAddress: string }> = ({ contractAddress }) => {
  const [proveState, setProveState] = useState<ProveState>('idle');
  const [txResult, setTxResult] = useState<{ hash: string; result: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [thresholdInput, setThresholdInput] = useState<string>('50'); // Added threshold state

  const { providers } = useMidnight();
  
  const handleVerify = async () => {
    if (!providers) {
      setErrorMsg("Wallet disconnected. Please connect your Lace wallet to proceed.");
      return;
    }

    // Input Validation: Reject negative, decimal, or excessive values before circuit execution
    const parsedThreshold = Number(thresholdInput);
    if (isNaN(parsedThreshold) || parsedThreshold < 0 || !Number.isInteger(parsedThreshold)) {
      setErrorMsg("Please enter a valid positive integer for the score threshold.");
      return;
    }
    if (parsedThreshold > 1000) {
      setErrorMsg("Score threshold cannot exceed maximum range (1000).");
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
      // If your contract accepts the threshold parameter, pass `parsedThreshold` here
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
      default: return 'Verify Power User Status';
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>🏆</span> Verify Power User Status
      </h3>
      <p style={{ color: 'var(--text)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
        Prove your aggregated wallet history without doxxing your addresses. Your connected wallet balance is evaluated via a Zero-Knowledge proof <strong>locally on your device</strong>.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        
        {/* Score Threshold Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Minimum Score Threshold
          </label>
          <input 
            type="number" 
            min="0" 
            max="1000" 
            value={thresholdInput}
            onChange={(e) => setThresholdInput(e.target.value)}
            disabled={proveState !== 'idle' || !providers}
            style={{ 
              padding: '0.8rem', 
              borderRadius: '8px', 
              border: '1px solid var(--border)', 
              background: 'transparent', 
              color: 'var(--text)',
              fontSize: '1rem'
            }}
            placeholder="e.g. 50"
          />
        </div>

        {/* Tier Legend */}
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text)' }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Tier Legend:</strong>
          <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', gap: '0.5rem' }}>
            <div style={{ flex: 1, padding: '0.3rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>Bronze: 1–49</div>
            <div style={{ flex: 1, padding: '0.3rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>Silver: 50–99</div>
            <div style={{ flex: 1, padding: '0.3rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>Gold: 100+</div>
          </div>
        </div>

        <button 
          onClick={handleVerify} 
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
          <strong>✅ Successfully verified on-chain!</strong>
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