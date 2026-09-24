import React, { useState } from 'react';
import * as whisperScoreContract from '../contracts/managed/whisper_score/contract/index.js';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { useMidnight } from '../hooks/useMidnight';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import * as ed from '@noble/ed25519';
import { Card } from './ui/card.js';
import { CheckCircle2, Eye, Loader2, RotateCcw, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button.js';

type ProveState = 'idle' | 'fetching' | 'proving' | 'submitting';

const PROVE_STEPS = [
  { id: 'fetching', label: 'Syncing Shielded State', detail: 'Retrieving confidential UTXOs' },
  { id: 'proving', label: 'Generating ZK Proof', detail: 'Computing circuit parameters locally' },
  { id: 'submitting', label: 'Verifying On-Chain', detail: 'Submitting proof to Midnight Network' }
];

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

  const getStepStatus = (stepId: string) => {
    const currentIndex = PROVE_STEPS.findIndex(s => s.id === proveState);
    const stepIndex = PROVE_STEPS.findIndex(s => s.id === stepId);
    
    if (proveState === 'idle') return 'pending';
    if (stepIndex < currentIndex || (txResult && stepIndex <= currentIndex)) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <Card className="p-8 flex flex-col h-full relative bg-zinc-900/60 border-zinc-700/50 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-white">Prove Reputation</h3>
        </div>
        <p className="text-slate-400 text-sm">Verify your Power User status without exposing your exact wallet balance to the public.</p>
      </div>
      
      {/* Main Content Area - Centered Vertically */}
      <div className="flex-1 flex flex-col">
        <div className={`my-auto w-full space-y-6 transition-opacity duration-300 ${proveState !== 'idle' && !txResult ? 'opacity-40 pointer-events-none' : ''}`}>
          
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

          {/* Tiers Context Box */}
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

          {/* Verification Details */}
          <div className="bg-slate-900/20 border border-slate-800/50 rounded-xl p-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-slate-500">Proof Protocol</span>
              <span className="text-slate-300 font-mono text-xs">ZK-SNARK</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Data Exposure</span>
              <span className="text-emerald-400 font-mono text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero
              </span>
            </div>
          </div>

        </div>

        {/* Dynamic State Rendering - Anchored to bottom */}
        <div className="mt-8 min-h-[170px] flex flex-col justify-end">
          {errorMsg && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-in fade-in zoom-in-95">
              <strong className="block text-red-300 mb-1">Verification Failed</strong>
              <p>{errorMsg}</p>
            </div>
          )}

          {proveState !== 'idle' && !txResult && (
            <div className="flex flex-col gap-4 p-6 bg-slate-900/60 border border-slate-800 rounded-xl mb-4 animate-in fade-in slide-in-from-bottom-4 h-full justify-center">
              {PROVE_STEPS.map((step) => {
                const status = getStepStatus(step.id);
                return (
                  <div key={step.id} className={`flex items-center gap-4 transition-opacity duration-500 ${status === 'pending' ? 'opacity-40' : 'opacity-100'}`}>
                    <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                      {status === 'complete' ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : status === 'active' ? (
                        <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                      )}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${status === 'active' ? 'text-cyan-400' : 'text-slate-300'}`}>{step.label}</div>
                      {status === 'active' && <div className="text-xs text-slate-500 mt-0.5">{step.detail}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {txResult ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <strong className="text-emerald-300 text-sm">On-Chain Confirmation</strong>
                </div>
                <p className="text-xs text-slate-400 flex items-center justify-between">
                  Hash: 
                  <a href={`#`} className="font-mono text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-2 py-1 rounded">
                    {txResult.hash.slice(0, 12)}...{txResult.hash.slice(-8)}
                  </a>
                </p>
              </div>
              
              {/* Encrypted Reveal UI */}
              <div 
                className={`relative w-full h-16 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden ${
                  isRevealed 
                    ? 'bg-emerald-950/50 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                    : 'bg-slate-900 border border-slate-700 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] group'
                }`}
                onClick={() => setIsRevealed(true)}
              >
                {!isRevealed ? (
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[linear-gradient(0deg,transparent_24%,rgba(34,211,238,0.3)_25%,rgba(34,211,238,0.3)_26%,transparent_27%,transparent_74%,rgba(34,211,238,0.3)_75%,rgba(34,211,238,0.3)_76%,transparent_77%,transparent)] bg-[length:100%_4px] animate-scan"></div>
                    <span className="font-mono font-bold text-cyan-400 tracking-wider text-sm flex items-center gap-2 group-hover:scale-105 transition-transform z-10">
                      <Eye className="w-4 h-4" />
                      DECRYPT ZK RESULT
                    </span>
                  </div>
                ) : (
                  <div className="animate-in zoom-in duration-300 font-mono text-xl font-bold text-emerald-400 flex items-center gap-3">
                    Result: <span className="text-white bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">{txResult.result}</span>
                  </div>
                )}
              </div>
              
              <Button 
                variant="ghost"
                onClick={() => { setTxResult(null); setIsRevealed(false); }}
                className="mt-6 w-full py-6 text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Verify another threshold
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleVerify} 
              disabled={proveState !== 'idle' || !providers}
              className={`w-full py-6 text-base bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-300 ${proveState !== 'idle' ? 'hidden' : ''}`}
            >
              Generate & Verify ZK Proof
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};