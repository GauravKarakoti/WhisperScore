import { WalletConnect } from './components/WalletConnect';
import { CircuitCall } from './components/CircuitCall';
import './App.css';

function App() {
  const PREPROD_CONTRACT_ADDRESS = "3b7b435c92ec21b29b0810c2715e724bba2f752cc33c1561c5ed05b11ba418c8";

  return (
    <>
      <header className="header">
        <h1>Midnight dApp</h1>
        <p>Level 2: Midnight Builder Challenge</p>
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
        <p>Proved locally, verified on Midnight Preprod.</p>
      </footer>
    </>
  );
}

export default App;