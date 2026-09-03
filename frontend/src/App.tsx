import { WalletConnect } from './components/WalletConnect';
import { CircuitCall } from './components/CircuitCall';
import './App.css';

function App() {
  // Utilizing the Preprod address
  const PREPROD_CONTRACT_ADDRESS = "63f6806d5ebdcf5b1f18fea225fe993ebd956df5979d21d071a53e6813e3192e";

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