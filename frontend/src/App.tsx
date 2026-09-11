import { WalletConnect } from './components/WalletConnect';
import { VerifyPowerUser } from './components/VerifyPowerUser';
import heroImage from './assets/hero.png';
import './App.css';

function App() {
  const PREPROD_CONTRACT_ADDRESS = "63f6806d5ebdcf5b1f18fea225fe993ebd956df5979d21d071a53e6813e3192e";

  return (
    <>
      <nav className="navbar">
        <div className="logo-container">
          <img src="/logo.png" alt="WhisperScore Logo" className="logo" />
          <div className="logo-text">WhisperScore</div>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-text">
          <h1>Programmable Selective Disclosure on Midnight</h1>
          <p>Generate zero-knowledge proofs of your on-chain reputation. Your data never leaves your device.</p>
        </div>
        <div className="hero-image-container">
          <img src={heroImage} alt="Abstract Representation of ZK Proofs" className="hero-image" />
        </div>
      </header>

      <section id="center">
        <div className="card-container">
          <WalletConnect />
        </div>
        
        <div className="card-container">
          <VerifyPowerUser contractAddress={PREPROD_CONTRACT_ADDRESS} />
        </div>
      </section>

      <footer id="spacer">
        <p>Proved locally. Verified on-chain.</p>
        <p>Built for the Midnight Network.</p>
      </footer>
    </>
  );
}

export default App;