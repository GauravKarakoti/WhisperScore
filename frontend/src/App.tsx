import { WalletConnect } from './components/WalletConnect';
import { CircuitCall } from './components/CircuitCall';
import './App.css';

function App() {
  // Utilizing the Preprod address
  const PREPROD_CONTRACT_ADDRESS = "41f548ae05b97a25646c374de0094b02f0a9f26bb17de8317eafebdb66c0f0e3";

  return (
    <>
      <header className="header">
        <h1>WhisperScore</h1>
        <p>Programmable Selective Disclosure on Midnight</p>
      </header>

      <section id="center">
        <div className="card-container">
          <WalletConnect />
        </div>
        
        <div className="card-container">
          <CircuitCall contractAddress={PREPROD_CONTRACT_ADDRESS} />
        </div>
      </section>

      <div className="ticks"></div>

      <footer id="spacer">
        <p>Proved locally. Verified on-chain. Your data never leaves your device.</p>
      </footer>
    </>
  );
}

export default App;