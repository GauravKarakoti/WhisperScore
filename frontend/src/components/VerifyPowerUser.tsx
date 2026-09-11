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
  const [thresholdInput, setThresholdInput] = useState<string>('50');

  const { providers } = useMidnight();
  
  const handleVerify = async () => {
    if (!providers) {
      setErrorMsg("Wallet disconnected. Please connect your Lace wallet to proceed.");
      return;
    }

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
      const api = providers as any;
      const config = await api.getConfiguration();
      const shieldedState = await api.getShieldedAddresses();

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
      case 'fetching': return 'Fetching State...';
      case 'proving': return 'Generating ZK Proof...';
      case 'submitting': return 'Submitting Tx...';
      default: return 'Verify Score Locally';
    }
  };

  return (
    <div className="card-body">
      <div className="card-header">
        <div>
          <h3>🏆 Verify Power User</h3>
          <p style={{ marginTop: '0.5rem' }}>Your wallet balance is evaluated locally.</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div>
          <label className="input-label">Minimum Score Threshold</label>
          <input 
            type="number" 
            min="0" 
            max="1000" 
            value={thresholdInput}
            onChange={(e) => setThresholdInput(e.target.value)}
            disabled={proveState !== 'idle' || !providers}
            className="input-field"
            placeholder="e.g. 50"
          />
        </div>

        <div className="tier-legend">
          <strong>Tier Classification</strong>
          <div className="tier-row">
            <div className="tier-badge">Bronze: 1–49</div>
            <div className="tier-badge">Silver: 50–99</div>
            <div className="tier-badge">Gold: 100+</div>
          </div>
        </div>

        <button 
          onClick={handleVerify} 
          disabled={proveState !== 'idle' || !providers}
          className="action-btn"
        >
          {proveState !== 'idle' && <span className="spinner"></span>}
          {getButtonText()}
        </button>
      </div>

      {errorMsg && (
        <div className="alert alert-error">
          <strong>❌ Verification Failed</strong>
          <p>{errorMsg}</p>
        </div>
      )}

      {txResult && (
        <div className="alert alert-success">
          <strong>✅ Confirmed On-Chain!</strong>
          <p>Tx Hash: <span style={{ fontFamily: 'var(--mono)' }}>{txResult.hash.slice(0,16)}...</span></p>
          
          <div 
            className={`privacy-reveal ${isRevealed ? 'revealed' : ''}`}
            onClick={() => setIsRevealed(true)}
          >
            {!isRevealed && <span className="reveal-prompt">Click to Reveal Result</span>}
            <div className="reveal-content">
              Result: {txResult.result}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};