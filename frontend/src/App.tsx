import { WalletConnect } from './components/WalletConnect';
import { CircuitCall } from './components/CircuitCall';
import './App.css';

function App() {
  const PREPROD_CONTRACT_ADDRESS = "PASTE_YOUR_CONTRACT_ADDRESS_HERE";

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