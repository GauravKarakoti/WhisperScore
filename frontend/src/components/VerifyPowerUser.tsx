import React, { useState } from 'react';
import { useMidnight } from '@/hooks/useMidnight';
import { useWhisperProof } from '@/hooks/useWhisperScore';
import { Card } from './ui/card';
import { CheckCircle2, Eye, Loader2, RotateCcw, ShieldCheck, Lock } from 'lucide-react';
import { Button } from './ui/button';

const PROVE_STEPS = [
  { id: 'fetching', label: 'Syncing Shielded State', detail: 'Retrieving confidential UTXOs' },
  { id: 'proving', label: 'Generating ZK Proof', detail: 'Computing circuit parameters locally' },
  { id: 'submitting', label: 'Verifying On-Chain', detail: 'Submitting proof to Midnight Network' }
];

export const VerifyPowerUser: React.FC<{ contractAddress: string }> = ({ contractAddress }) => {
  const { providers } = useMidnight();
  const { generateProof, resetProof, proveState, txResult, errorMsg } = useWhisperProof(contractAddress);
  
  const [isRevealed, setIsRevealed] = useState(false);
  const [thresholdInput, setThresholdInput] = useState<string>('50');

  const parsedThreshold = parseInt(thresholdInput, 10);
  const isInvalid = isNaN(parsedThreshold) || parsedThreshold < 0 || parsedThreshold > 1000;

  const handleVerify = async () => {
    if (isInvalid) return;
    setIsRevealed(false);
    await generateProof(parsedThreshold);
  };

  const handleReset = () => {
    setIsRevealed(false);
    resetProof();
  };

  const setTier = (val: string) => {
    if (proveState === 'idle' && providers) {
      setThresholdInput(val);
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
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {!providers && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/60 backdrop-blur-[2px] rounded-xl border border-zinc-800/50 animate-in fade-in duration-300">
            <div className="bg-zinc-900 p-4 rounded-full mb-4 border border-zinc-800 shadow-xl">
              <Lock className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-slate-200 font-semibold mb-2 text-lg">Verification Locked</h4>
            <p className="text-sm text-slate-400 text-center px-8 max-w-sm leading-relaxed">
              Connect your Lace wallet in the adjacent panel to enable zero-knowledge proof generation.
            </p>
          </div>
        )}

        <div className={`my-auto w-full space-y-6 transition-opacity duration-300 ${(!providers || (proveState !== 'idle' && !txResult)) ? 'opacity-20 pointer-events-none' : ''}`}>
          
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
                className={`w-full bg-slate-950/80 border rounded-xl pl-5 pr-16 py-3.5 text-slate-100 font-mono text-lg focus:outline-none transition-all shadow-inner ${
                  isInvalid && thresholdInput !== '' 
                    ? 'border-red-500/50 focus:ring-red-500 focus:border-red-500' 
                    : 'border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                }`}
                placeholder="50"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm pointer-events-none">
                PTS
              </div>
            </div>
            {isInvalid && thresholdInput !== '' && (
              <p className="text-red-400 text-xs mt-2 font-medium">Please enter a valid threshold between 0 and 1000.</p>
            )}
          </div>

          {/* Interactive Tiers Context Box */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <strong className="block text-xs uppercase tracking-wider text-slate-400">Quick Select Tiers</strong>
              <span className="text-[10px] text-slate-500 uppercase">Click to set</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-xs font-semibold">
              <button 
                onClick={() => setTier('49')}
                disabled={proveState !== 'idle' || !providers}
                className="bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg py-2.5 hover:bg-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                Bronze <span className="block mt-0.5 opacity-70 font-mono">1–49</span>
              </button>
              <button 
                onClick={() => setTier('99')}
                disabled={proveState !== 'idle' || !providers}
                className="bg-slate-500/10 border border-slate-500/20 text-slate-300 rounded-lg py-2.5 hover:bg-slate-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                Silver <span className="block mt-0.5 opacity-70 font-mono">50–99</span>
              </button>
              <button 
                onClick={() => setTier('150')}
                disabled={proveState !== 'idle' || !providers}
                className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg py-2.5 hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                Gold <span className="block mt-0.5 opacity-70 font-mono">100+</span>
              </button>
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
      </div>

      {/* Dynamic State Rendering */}
      <div className="mt-8 min-h-[170px] flex flex-col justify-end z-10">
        {errorMsg && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-in fade-in zoom-in-95">
            <strong className="block text-red-300 mb-1">Verification Failed</strong>
            <p>{errorMsg}</p>
          </div>
        )}

        {proveState !== 'idle' && !txResult && (
          <div className="flex flex-col gap-4 p-6 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl mb-4 animate-in fade-in slide-in-from-bottom-4 h-full justify-center shadow-xl">
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
                <a href={`https://explorer.preprod.midnight.network/transactions/${txResult.hash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-2 py-1 rounded">
                  {txResult.hash.slice(0, 12)}...{txResult.hash.slice(-8)}
                </a>
              </p>
            </div>
            
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
              onClick={handleReset}
              className="mt-6 w-full py-6 text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Verify another threshold
            </Button>
          </div>
        ) : (
          <Button 
            onClick={!providers ? undefined : handleVerify} 
            disabled={proveState !== 'idle' || isInvalid}
            className={`w-full py-6 text-base rounded-xl font-semibold transition-all duration-300 ${
              !providers 
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed hover:bg-slate-800 hover:text-slate-500'
                : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/20'
            } ${proveState !== 'idle' ? 'hidden' : ''}`}
          >
            {!providers ? 'Wallet Connection Required' : 'Generate & Verify ZK Proof'}
          </Button>
        )}
      </div>
    </Card>
  );
};