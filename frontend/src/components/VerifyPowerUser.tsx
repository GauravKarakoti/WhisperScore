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
    <div className="p-8 flex flex-col h-full">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <span className="text-2xl">🏆</span> Verify Power User
        </h3>
        <p className="text-slate-400">Your wallet balance is evaluated locally.</p>
      </div>
      
      <div className="flex flex-col gap-6">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Minimum Score Threshold
          </label>
          <input 
            type="number" 
            min="0" 
            max="1000" 
            value={thresholdInput}
            onChange={(e) => setThresholdInput(e.target.value)}
            disabled={proveState !== 'idle' || !providers}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-all shadow-inner"
            placeholder="e.g. 50"
          />
        </div>

        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4">
          <strong className="block text-sm text-slate-300 mb-3">Tier Classification</strong>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium">
            <div className="bg-slate-900 border border-slate-700/50 rounded-lg py-2 text-amber-600">Bronze: 1–49</div>
            <div className="bg-slate-900 border border-slate-700/50 rounded-lg py-2 text-slate-300">Silver: 50–99</div>
            <div className="bg-slate-900 border border-slate-700/50 rounded-lg py-2 text-amber-400">Gold: 100+</div>
          </div>
        </div>

        <button 
          onClick={handleVerify} 
          disabled={proveState !== 'idle' || !providers}
          className="action-btn mt-2"
        >
          {proveState !== 'idle' && (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {getButtonText()}
        </button>
      </div>

      {errorMsg && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <strong className="block text-red-300 mb-1">❌ Verification Failed</strong>
          <p>{errorMsg}</p>
        </div>
      )}

      {txResult && (
        <div className="mt-6 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
          <strong className="block text-emerald-300 text-lg mb-2">✅ Confirmed On-Chain!</strong>
          <p className="text-sm mb-4">Tx Hash: <span className="font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-200">{txResult.hash.slice(0,16)}...</span></p>
          
          <div 
            className={`relative bg-slate-950 border-2 rounded-xl p-6 text-center cursor-pointer overflow-hidden transition-all duration-300 ${isRevealed ? 'border-emerald-500/50' : 'border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-900'}`}
            onClick={() => setIsRevealed(true)}
          >
            {!isRevealed && (
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 font-semibold text-slate-300 pointer-events-none w-full">
                Click to Reveal Result
              </span>
            )}
            <div className={`font-mono text-2xl font-bold transition-all duration-500 ${isRevealed ? 'blur-0 opacity-100 text-emerald-400' : 'blur-md opacity-20 text-slate-500 select-none'}`}>
              Result: {txResult.result}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};