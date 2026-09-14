import React, { useMemo } from 'react';
import { useMidnight } from '../hooks/useMidnight';

export const WalletConnect: React.FC = () => {
  const { address, error, connectWallet, disconnectWallet } = useMidnight();

  const avatarGradient = useMemo(() => {
    if (!address) return '';
    const color1 = `#${address.slice(0, 6)}`;
    const color2 = `#${address.slice(6, 12)}`;
    return `linear-gradient(135deg, ${color1}, ${color2})`;
  }, [address]);

  return (
    <div className="p-8 flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Lace Wallet</h3>
          <p className="text-slate-400">Connect to Midnight Preprod</p>
        </div>
        {address && (
          <div 
            className="w-12 h-12 rounded-full border-2 border-slate-700 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
            style={{ background: avatarGradient }} 
          />
        )}
      </div>
      
      {/* Error State */}
      {error && (
        <div className="p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <strong className="block text-red-300 mb-1">Connection Error</strong>
          <p>{error.includes('install') ? 'Lace wallet extension not found. Please install it to continue.' : error}</p>
        </div>
      )}

      {/* Dynamic Filler Content (Balances the UI height) */}
      <div className="flex-1 flex flex-col justify-center py-4 mb-6">
        {!address ? (
          <div className="space-y-3">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
              <div className="text-2xl">🔒</div>
              <div>
                <h4 className="text-slate-200 font-semibold text-sm">Zero-Knowledge</h4>
                <p className="text-slate-500 text-xs mt-1">Prove your score without revealing underlying data.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
              <div className="text-2xl">🛡️</div>
              <div>
                <h4 className="text-slate-200 font-semibold text-sm">Shielded State</h4>
                <p className="text-slate-500 text-xs mt-1">Leverage Midnight's confidential smart contracts.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-5 shadow-inner">
            <div className="flex justify-between items-center border-slate-800">
              <span className="text-slate-400 text-sm">Network</span>
              <span className="text-cyan-400 font-mono text-sm">Preprod</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer / Actions */}
      <div className="mt-auto">
        {!address ? (
          <button onClick={connectWallet} className="action-btn">
            Connect Wallet
          </button>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-slate-300 text-center tracking-wider shadow-inner">
              {address.slice(0, 12)}...{address.slice(-10)}
            </div>
            <button 
              onClick={disconnectWallet} 
              className="w-full py-3 px-4 bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 rounded-xl font-semibold transition-all"
            >
              Disconnect
            </button>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-slate-800/60 flex justify-between items-center text-sm">
          <span className="text-slate-500">Need test gas?</span>
          <a 
            href="https://faucet.preprod.midnight.network" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors flex items-center gap-1"
          >
            Get Preprod tDUST <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
};