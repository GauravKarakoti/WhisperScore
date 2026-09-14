import { WalletConnect } from './components/WalletConnect';
import { VerifyPowerUser } from './components/VerifyPowerUser';
import heroImage from './assets/hero.png';

function App() {
  const PREPROD_CONTRACT_ADDRESS = "63f6806d5ebdcf5b1f18fea225fe993ebd956df5979d21d071a53e6813e3192e";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 flex flex-col">
      <nav className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="WhisperScore Logo" className="h-20 w-auto" />
            <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              WhisperScore
            </div>
          </div>
        </div>
      </nav>

      <header className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-12 w-full">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6 text-slate-100">
            Programmable Selective <br className="hidden md:block" />
            Disclosure on <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Midnight</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto md:mx-0">
            Generate zero-knowledge proofs of your on-chain reputation. Your data never leaves your device.
          </p>
        </div>
        <div className="flex-1 w-full flex justify-center md:justify-end">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-2xl opacity-30 blur-xl"></div>
            <img 
              src={heroImage} 
              alt="Abstract Representation of ZK Proofs" 
              className="relative rounded-2xl shadow-2xl border border-slate-700/50 max-w-full h-auto object-cover" 
            />
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 pb-20 w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-20 transition duration-500 blur"></div>
          <div className="relative h-full">
            <WalletConnect />
          </div>
        </div>
        
        <div className="glass-panel group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-20 transition duration-500 blur"></div>
          <div className="relative h-full">
            <VerifyPowerUser contractAddress={PREPROD_CONTRACT_ADDRESS} />
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-slate-800/60 bg-slate-950/50 py-8 text-center text-slate-500 text-sm">
        <p className="mb-1">Proved locally. Verified on-chain.</p>
        <p>Built for the Midnight Network.</p>
      </footer>
    </div>
  );
}

export default App;