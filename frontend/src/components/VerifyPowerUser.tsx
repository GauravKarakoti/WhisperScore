import React, { useState } from 'react';
import * as whisperScoreContract from '../contracts/managed/whisper_score/contract/index.js';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { useMidnight } from '../hooks/useMidnight';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import * as ed from '@noble/ed25519';

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
      /* --- LOGIC REMAINS EXACTLY THE SAME --- */
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
      
      const MOCK_ORACLE_PRIV = new Uint8Array(32).fill(1);
      const msg = new Uint8Array(4);
      new DataView(msg.buffer).setUint32(0, Number(nativeBalance), false); 
      const mockSignature = await ed.signAsync(msg, MOCK_ORACLE_PRIV);

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
          mockSignature 
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
      case 'fetching': return 'Syncing Shielded State...';
      case 'proving': return 'Computing ZK Proof...';
      case 'submitting': return 'Awaiting Confirmation...';
      default: return 'Generate & Verify ZK Proof';
    }
  };

  return (
    <div className="p-8 flex flex-col h-full relative">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white">Prove Reputation</h3>
        </div>
        <p className="text-slate-400 text-sm">Verify your Power User status without exposing your exact wallet balance to the public.</p>
      </div>
      
      <div className="flex flex-col gap-6 flex-1">
        {/* Input Section */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Target Score Threshold
          </label>
          <div className="relative">
            <input 
              type="number" 
              min="0" 
              max="1000" 
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              disabled={proveState !== 'idle' || !providers}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-5 pr-16 py-3.5 text-slate-100 font-mono text-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 transition-all shadow-inner"
              placeholder="50"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">
              PTS
            </div>
          </div>
        </div>

        {/* Tiers */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
          <strong className="block text-xs uppercase tracking-wider text-slate-400 mb-3">Score Tiers</strong>
          <div className="grid grid-cols-3 gap-3 text-center text-xs font-semibold">
            <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg py-2.5">
              Bronze <span className="block mt-0.5 opacity-70 font-mono">1–49</span>
            </div>
            <div className="bg-slate-500/10 border border-slate-500/20 text-slate-300 rounded-lg py-2.5">
              Silver <span className="block mt-0.5 opacity-70 font-mono">50–99</span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg py-2.5">
              Gold <span className="block mt-0.5 opacity-70 font-mono">100+</span>
            </div>
          </div>
        </div>

        {/* Dynamic State Rendering */}
        <div className="mt-auto">
          {errorMsg && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <strong className="block text-red-300 mb-1">Verification Failed</strong>
              <p>{errorMsg}</p>
            </div>
          )}

          {txResult ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-emerald-400">✅</span>
                  <strong className="text-emerald-300 text-sm">On-Chain Confirmation</strong>
                </div>
                <p className="text-xs text-slate-400 flex items-center justify-between">
                  Hash: 
                  <a href={`#`} className="font-mono text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-2 py-1 rounded">
                    {txResult.hash.slice(0, 12)}...{txResult.hash.slice(-8)}
                  </a>
                </p>
              </div>
              
              {/* Scratch-off Reveal UI */}
              <div 
                className={`relative w-full h-16 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden ${
                  isRevealed 
                    ? 'bg-emerald-950/50 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                    : 'bg-slate-800 border border-slate-600 hover:bg-slate-700'
                }`}
                onClick={() => setIsRevealed(true)}
              >
                {!isRevealed ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.03)_10px,rgba(255,255,255,0.03)_20px)]">
                    <span className="font-bold text-slate-300 tracking-wide text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      Click to Reveal ZK Result
                    </span>
                  </div>
                ) : (
                  <div className="animate-in zoom-in duration-300 font-mono text-xl font-bold text-emerald-400 flex items-center gap-3">
                    Result: <span className="text-white bg-emerald-500/20 px-3 py-1 rounded-lg">{txResult.result}</span>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => { setTxResult(null); setIsRevealed(false); }}
                className="mt-4 w-full py-3 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Verify another score
              </button>
            </div>
          ) : (
            <button 
              onClick={handleVerify} 
              disabled={proveState !== 'idle' || !providers}
              className="action-btn"
            >
              {proveState !== 'idle' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {getButtonText()}
                </>
              ) : (
                getButtonText()
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};