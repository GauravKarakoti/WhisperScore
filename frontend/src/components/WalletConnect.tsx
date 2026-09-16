import React from 'react';
import { useMidnight } from '../hooks/useMidnight';

export const WalletConnect: React.FC = () => {
  const { address, error, connectWallet, disconnectWallet } = useMidnight();

  return (
    <div className="p-8 flex flex-col h-full relative">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Wallet Connection</h3>
          <p className="text-slate-400 text-sm">Connect Lace to access Midnight Preprod</p>
        </div>
        <div className={`p-2 rounded-xl border ${address ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
           <svg className={`w-6 h-6 ${address ? 'text-indigo-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
           </svg>
        </div>
      </div>
      
      {/* Error State */}
      {error && (
        <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <strong className="block text-red-300 mb-0.5">Connection Error</strong>
            <p>{error.includes('install') ? 'Lace wallet extension not found. Please install it to continue.' : error}</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center py-2 mb-8">
        {!address ? (
          <div className="grid gap-4">
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:bg-slate-800/50 transition-colors">
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg text-xl">🔒</div>
              <div>
                <h4 className="text-slate-200 font-semibold mb-1">Zero-Knowledge</h4>
                <p className="text-slate-400 text-sm leading-relaxed">Prove your score seamlessly without revealing your underlying transaction history.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:bg-slate-800/50 transition-colors">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg text-xl">🛡️</div>
              <div>
                <h4 className="text-slate-200 font-semibold mb-1">Shielded State</h4>
                <p className="text-slate-400 text-sm leading-relaxed">Leverage Midnight's confidential smart contracts for absolute privacy.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-inner">
            <h4 className="text-slate-200 font-semibold text-lg mb-1">Connected Successfully</h4>
            <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-sm text-cyan-400 tracking-wider mb-6">
              {address.slice(0, 12)}...{address.slice(-10)}
            </div>
            
            <div className="w-full flex justify-between items-center p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
              <span className="text-slate-400 text-sm">Active Network</span>
              <span className="flex items-center gap-2 text-slate-200 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Preprod
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer / Actions */}
      <div className="mt-auto">
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