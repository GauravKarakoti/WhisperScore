import React from 'react';
import { useMidnight } from '../hooks/useMidnight';

export const WalletConnect: React.FC = () => {
  const { address, error, connectWallet, disconnectWallet } = useMidnight();

  const isMissingWallet = error?.toLowerCase().includes('install') || error?.toLowerCase().includes('not found');

  return (
    <div className="p-8 flex flex-col h-full relative">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl font-bold text-white mb-1">Wallet Connection</h3>
          <div className={`p-2 rounded-xl border transition-colors duration-500 ${address ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-slate-800/50 border-slate-700'}`}>
            <svg className={`w-6 h-6 transition-colors duration-500 ${address ? 'text-indigo-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
        </div>
        <p className="text-slate-400 text-sm">Connect Lace to access Midnight Preprod</p>
      </div>
      
      {/* Error State */}
      {error && (
        <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <strong className="block text-red-300 text-sm mb-0.5">Connection Error</strong>
            <p className="text-red-400/80 text-sm">{isMissingWallet ? 'Lace wallet extension not detected.' : error}</p>
            {isMissingWallet && (
              <a 
                href="https://www.lace.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 inline-block px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold rounded-lg transition-colors border border-red-500/30"
              >
                Install Lace Wallet &rarr;
              </a>
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
                <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg text-lg group-hover:scale-110 transition-transform">🔒</div>
                <div>
                  <h4 className="text-slate-200 font-semibold mb-1 text-sm">Zero-Knowledge</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">Prove your score seamlessly without revealing your underlying transaction history.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:bg-slate-800/80 transition-colors group">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-lg group-hover:scale-110 transition-transform relative">
                  🛡️
                  <div className="absolute inset-0 border border-indigo-400/50 rounded-lg animate-ping opacity-20"></div>
                </div>
                <div>
                  <h4 className="text-slate-200 font-semibold mb-1 text-sm">Shielded State</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">Leverage Midnight's confidential smart contracts for absolute privacy.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:bg-slate-800/80 transition-colors group">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-lg group-hover:scale-110 transition-transform">⚡</div>
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
                <h4 className="text-slate-200 font-semibold text-lg mb-1 relative z-10">Connected Successfully</h4>
                <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-sm text-cyan-400 tracking-wider mb-4 relative z-10 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                  {address.slice(0, 12)}...{address.slice(-10)}
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
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
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
          <button onClick={connectWallet} className="action-btn">
            Connect Lace Wallet
          </button>
        ) : (
          <button 
            onClick={disconnectWallet} 
            className="w-full py-3.5 px-4 bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:border-red-500/50 hover:text-red-400 text-slate-300 rounded-xl font-semibold transition-all duration-300"
          >
            Disconnect Wallet
          </button>
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
    </div>
  );
};