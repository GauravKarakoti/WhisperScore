import React, { useState } from 'react';
import { useMidnight } from '../hooks/useMidnight';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, Shield, Zap, Lock, AlertCircle, ExternalLink, CheckCircle2, Server, Copy, Check } from 'lucide-react';

export const WalletConnect: React.FC = () => {
  const { address, error, connectWallet, disconnectWallet } = useMidnight();
  const [copied, setCopied] = useState(false);

  const isMissingWallet = error?.toLowerCase().includes('install') || error?.toLowerCase().includes('not found');

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="p-8 flex flex-col h-full relative bg-zinc-900/60 border-zinc-700/50 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl font-bold text-white mb-1">Wallet Connection</h3>
          <div className={`p-2.5 rounded-xl border transition-colors duration-500 ${address ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-slate-800/50 border-slate-700'}`}>
            <Wallet className={`w-6 h-6 transition-colors duration-500 ${address ? 'text-indigo-400' : 'text-slate-500'}`} />
          </div>
        </div>
        <p className="text-slate-400 text-sm">Connect Lace to access Midnight Preprod</p>
      </div>
      
      {/* Error State */}
      {error && (
        <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block text-red-300 text-sm mb-0.5">Connection Error</strong>
            <p className="text-red-400/80 text-sm">{isMissingWallet ? 'Lace wallet extension not detected.' : error}</p>
            {isMissingWallet && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 bg-red-500/10 border-red-500/20 hover:bg-red-500/20 hover:text-red-300 text-red-400 h-8"
                asChild
              >
                <a href="https://www.lace.io/" target="_blank" rel="noopener noreferrer">
                  Install Lace Wallet <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area - Centered Vertically */}
      <div className="flex-1 flex flex-col">
        <div className="my-auto w-full">
          {!address ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:bg-slate-800/80 transition-colors group">
                <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-slate-200 font-semibold mb-1 text-sm">Zero-Knowledge</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">Prove your score seamlessly without revealing your underlying transaction history.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:bg-slate-800/80 transition-colors group">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:scale-110 transition-transform relative">
                  <Shield className="w-5 h-5" />
                  <div className="absolute inset-0 border border-indigo-400/50 rounded-lg animate-ping opacity-20"></div>
                </div>
                <div>
                  <h4 className="text-slate-200 font-semibold mb-1 text-sm">Shielded State</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">Leverage Midnight's confidential smart contracts for absolute privacy.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:bg-slate-800/80 transition-colors group">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-slate-200 font-semibold mb-1 text-sm">Local Execution</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">Cryptographic proofs are generated entirely on your device.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center justify-center p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-inner animate-in zoom-in-95 duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-shimmer-gradient animate-shimmer -translate-x-full"></div>
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3 opacity-80 relative z-10" />
                <h4 className="text-slate-200 font-semibold text-lg mb-1 relative z-10">Connected Successfully</h4>
                
                {/* Interactive Copyable Address */}
                <div 
                  onClick={handleCopyAddress}
                  className="group cursor-pointer flex items-center justify-between gap-3 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg mb-4 relative z-10 shadow-[0_0_10px_rgba(34,211,238,0.1)] hover:border-cyan-500/50 transition-colors"
                  title="Copy Wallet Address"
                >
                  <span className="font-mono text-sm text-cyan-400 tracking-wider">
                    {address.slice(0, 12)}...{address.slice(-10)}
                  </span>
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  )}
                </div>
                
                <div className="w-full flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 relative z-10">
                  <span className="text-slate-400 text-sm">Active Network</span>
                  <span className="flex items-center gap-2 text-slate-200 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    Preprod
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/20 border border-slate-800/50 rounded-2xl p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <h5 className="text-slate-300 font-semibold mb-4 flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-400" />
                  Shielded Data Vault
                </h5>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Node Sync Status</span>
                    <span className="text-emerald-400 flex items-center gap-1.5 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Synchronized</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Encryption Protocol</span>
                    <span className="text-slate-300 font-mono text-xs">Zero-Knowledge</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Local Proof Gen</span>
                    <span className="text-slate-300 font-mono text-xs">Enabled</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer / Actions - Anchored to bottom */}
      <div className="mt-8">
        {!address ? (
          <Button 
            onClick={connectWallet} 
            className="w-full py-6 text-base bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-300"
          >
            Connect Lace Wallet
          </Button>
        ) : (
          <Button 
            variant="outline"
            onClick={disconnectWallet} 
            className="w-full py-6 text-base bg-slate-900 border-slate-700 hover:bg-slate-800 hover:border-red-500/50 hover:text-red-400 text-slate-300 rounded-xl font-semibold transition-all duration-300"
          >
            Disconnect Wallet
          </Button>
        )}

        <div className="mt-6 pt-6 border-t border-slate-800/60 flex justify-between items-center text-sm">
          <span className="text-slate-500">Need test gas?</span>
          <a 
            href="https://faucet.preprod.midnight.network" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group text-cyan-400 hover:text-cyan-300 font-semibold transition-colors flex items-center gap-1"
          >
            Get Preprod tDUST 
            <span className="transform group-hover:translate-x-1 transition-transform" aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </Card>
  );
};