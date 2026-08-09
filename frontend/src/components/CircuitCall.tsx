import React, { useState } from 'react';
// 1. IMPORT YOUR COMPILED CONTRACT AS A FULL MODULE
// findDeployedContract expects the full module, not just the Contract class
import * as whisperScoreContract from '../../../contracts/managed/whisper_score/contract'; 

// 2. IMPORT MIDNIGHT JS HELPERS
// Updated to use findDeployedContract
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';

// 3. IMPORT YOUR PROVIDERS HOOK
import { useMidnight } from '../hooks/useMidnight';

export const CircuitCall: React.FC<{ contractAddress: string }> = ({ contractAddress }) => {
  const [isProving, setIsProving] = useState(false);
  const [txResult, setTxResult] = useState<string | null>(null);

  const { providers } = useMidnight();

  const executeCircuit = async () => {
    if (!providers) {
      console.error("Midnight providers are not initialized.");
      setTxResult("Error: Please connect your wallet first.");
      return;
    }

    setIsProving(true);
    setTxResult(null);

    try {
      const userPrivateScore = 800n; // Using BigInt for Uint<32>

      // 4. MAP WITNESSES TO COMPILER EXPECTATIONS
      // Midnight 0.16.x expects witnesses to be directly on the provider object
      const contractProviders = {
        ...providers,
        privateUserValue: (witnessContext: any) => [
          witnessContext.currentPrivateState, 
          userPrivateScore
        ],
      } as any; // Cast as 'any' to satisfy strict ContractProviders type if using a minimal provider stack

      // 5. CONNECT TO THE PREPROD CONTRACT
      // Provide the contractAddress and the compiled module
      const whisperScore = await findDeployedContract(contractProviders, {
        contractAddress: contractAddress as any,
        compiledContract: whisperScoreContract as any,
      });

      // 6. EXECUTE THE CIRCUIT
      // Circuits are now nested under the callTx object
      const tx = await whisperScore.callTx.checkEligibility();

      // 7. HANDLE THE ON-CHAIN RESULT
      // The transaction hash is public, but the returned boolean result is strictly private
      setTxResult(`Tx Hash: ${tx.public.txHash}\nEligibility Verified: ${tx.private.result}`);
      
    } catch (error: any) {
      console.error("Circuit execution failed:", error);
      setTxResult(`Error: ${error.message || "Unknown execution failure"}`);
    } finally {
      setIsProving(false);
    }
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', marginTop: '1rem' }}>
      <h3>Execute Midnight Circuit</h3>
      <p style={{ fontStyle: 'italic', color: '#555' }}>
        Proved without revealing your input
      </p>
      
      <button 
        onClick={executeCircuit} 
        disabled={isProving || !providers}
        style={{ cursor: isProving || !providers ? 'not-allowed' : 'pointer', padding: '0.5rem 1rem' }}
      >
        {isProving ? "Generating ZK Proof Locally..." : "Call Circuit"}
      </button>

      {txResult && (
        <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#e6ffe6', border: '1px solid #b3ffb3', whiteSpace: 'pre-line' }}>
          <strong>Transaction Submitted!</strong>
          <p style={{ fontFamily: 'monospace', wordBreak: 'break-all', marginTop: '0.5rem' }}>
            {txResult}
          </p>
        </div>
      )}
    </div>
  );
};