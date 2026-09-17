import { WalletConnect } from './components/WalletConnect';
import { VerifyPowerUser } from './components/VerifyPowerUser';
import heroImage from './assets/hero.png';

function App() {
  const PREPROD_CONTRACT_ADDRESS = "32587300f95d1620fecbeb4914ef1be44b95e7a3cbd659e661d38ba83827871d";

  return (
    <div className="min-h-screen relative bg-slate-950 flex flex-col overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>
      <div className="absolute inset-0 bg-grid-pattern bg-[size:32px_32px] pointer-events-none"></div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="WhisperScore Logo" className="h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.2)]" />
            <div className="text-2xl font-extrabold tracking-tight">
              Whisper<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Score</span>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-mono font-semibold tracking-wider">
            PREPROD
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-16 w-full z-10">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 mb-6 text-sm text-cyan-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Zero-Knowledge Reputation
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-slate-50">
            Programmable <br className="hidden md:block" /> Selective Disclosure <br className="hidden md:block" /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">on Midnight</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto md:mx-0 font-light leading-relaxed">
            Generate mathematical proofs of your on-chain reputation. Verify your status to dApps without your raw data ever leaving your device.
          </p>
        </div>
        
        <div className="flex-1 w-full flex justify-center md:justify-end">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-2xl opacity-20 group-hover:opacity-40 blur-2xl transition duration-700"></div>
            <img 
              src={heroImage} 
              alt="Abstract Representation of ZK Proofs" 
              className="relative rounded-2xl shadow-2xl border border-slate-700/50 max-w-full h-auto object-cover transform group-hover:-translate-y-2 transition duration-500" 
            />
          </div>
        </div>
      </header>

      {/* Main App Section */}
      <section className="relative max-w-7xl mx-auto px-6 pb-24 w-full grid grid-cols-1 lg:grid-cols-2 gap-8 z-10">
        <div className="glass-panel group">
          <WalletConnect />
        </div>
        <div className="glass-panel group">
          <VerifyPowerUser contractAddress={PREPROD_CONTRACT_ADDRESS} />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-md py-8 z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
          <p>Proved locally. Verified on-chain.</p>
          <p className="flex items-center gap-1">Built for the <span className="font-semibold text-slate-300">Midnight Network</span></p>
        </div>
      </footer>
    </div>
  );
}

export default App;