import React, { useState } from 'react';
import { ethers } from 'ethers';
import * as whisperScoreContract from '../contracts/managed/whisper_score/contract/index.js';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { useMidnight } from '../hooks/useMidnight.tsx';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';

export const CircuitCall: React.FC<{ contractAddress: string }> = ({ contractAddress }) => {
  const [isProving, setIsProving] = useState(false);
  const [txResult, setTxResult] = useState<string | null>(null);
  const [ethAddress, setEthAddress] = useState<string>(''); 

  const { providers } = useMidnight();
  
  const executeCircuit = async () => {
    if (!providers) {
      setTxResult("Error: Please connect your wallet first.");
      return;
    }
    if (!ethAddress || !ethers.isAddress(ethAddress)) {
      setTxResult("Error: Please enter a valid Ethereum address.");
      return;
    }

    setIsProving(true);
    setTxResult(null);

    try {
      // 1. Fetch Cross-Chain Data (Affect Stream Simulation)
      const ethProvider = new ethers.JsonRpcProvider('https://cloudflare-eth.com');
      const balanceWei = await ethProvider.getBalance(ethAddress);
      // Simplify balance to a whole number for the Uint32 circuit requirement
      const balanceEth = BigInt(Math.floor(Number(ethers.formatEther(balanceWei))));

      // 2. Midnight Providers Configuration
      const config = await providers.getConfiguration();
      const shieldedState = await providers.getShieldedAddresses();

      const publicDataProvider = indexerPublicDataProvider(config.indexerUri, config.indexerWsUri);
      const zkConfigProvider = new FetchZkConfigProvider(window.location.origin);
      const proofProvider = await providers.getProvingProvider(zkConfigProvider);

      const inMemoryPrivateState: Record<string, any> = {};

      const contractProviders = {
        publicDataProvider,
        zkConfigProvider,
        proofProvider,
        walletProvider: {
          coinPublicKey: shieldedState.shieldedCoinPublicKey,
          encryptionPublicKey: shieldedState.shieldedEncryptionPublicKey,
          balanceTx: async (tx: any) => {
            const balanced = await providers.balanceUnsealedTransaction(tx);
            return balanced.tx;
          }
        },
        midnightProvider: {
          submitTx: async (tx: any) => {
            await providers.submitTransaction(tx);
          }
        },
        privateStateProvider: {
          setContractAddress: (_addr: string) => {},
          get: async (id: string) => inMemoryPrivateState[id] ?? undefined, 
          set: async (id: string, state: any) => { inMemoryPrivateState[id] = state; },
          remove: async (id: string) => { delete inMemoryPrivateState[id]; }
        },
        // Feed the cross-chain data into the local circuit
        externalChainBalance: (witnessContext: any) => [
          witnessContext.currentPrivateState ?? undefined, 
          balanceEth
        ],
        stateSignature: (witnessContext: any) => [
          witnessContext.currentPrivateState ?? undefined,
          new Uint8Array(32) // Mock signature payload for Affect Stream
        ]
      } as any; 

      const compiledContract = {
        contract: whisperScoreContract.Contract,
        ledger: whisperScoreContract.ledger,
        pureCircuits: whisperScoreContract.pureCircuits
      };

      const whisperScore = await findDeployedContract(contractProviders, {
        contractAddress: contractAddress,
        compiledContract: compiledContract as any,
      });

      const tx = await whisperScore.callTx.checkEligibility();

      setTxResult(`Tx Hash: ${tx.public.txHash}\nEligibility Verified: ${tx.private.result}`);
      
    } catch (error: any) {
      console.error("Circuit execution failed:", error);
      setTxResult(`Error: ${error.message || "Unknown execution failure"}`);
    } finally {
      setIsProving(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <style>
        {`
          @keyframes spin { 100% { transform: rotate(360deg); } }
          .spinner { animation: spin 2s linear infinite; }
        `}
      </style>
      
      <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>🔗</span> Cross-Chain Eligibility
      </h3>
      <p style={{ color: 'var(--text)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
        Enter an Ethereum address. The balance is fetched and evaluated via a Zero-Knowledge proof <strong>locally on your device</strong>.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600 }}>Ethereum Address</label>
          <input 
            type="text" 
            placeholder="0x..." 
            value={ethAddress}
            onChange={(e) => setEthAddress(e.target.value)}
            disabled={isProving}
            style={{
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text-h)',
              fontFamily: 'var(--mono)',
              fontSize: '16px',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        <button 
          onClick={executeCircuit} 
          disabled={isProving || !providers || !ethAddress}
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '12px',
            cursor: (isProving || !providers || !ethAddress) ? 'not-allowed' : 'pointer',
            opacity: (isProving || !providers || !ethAddress) ? 0.6 : 1
          }}
        >
          {isProving ? (
            <>
              <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
              Fetching & Proving...
            </>
          ) : (
            "Verify Cross-Chain Balance"
          )}
        </button>
      </div>

      {txResult && (
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: txResult.startsWith('Error') ? 'rgba(255, 77, 79, 0.1)' : 'rgba(82, 196, 26, 0.1)', 
          border: `1px solid ${txResult.startsWith('Error') ? '#ff4d4f' : '#52c41a'}`, 
          borderRadius: '6px',
          whiteSpace: 'pre-line',
          textAlign: 'left'
        }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: txResult.startsWith('Error') ? '#ff4d4f' : '#52c41a' }}>
            {txResult.startsWith('Error') ? '❌ Verification Failed' : '🌐 On-Chain State Updated'}
          </strong>
          <p style={{ fontFamily: 'var(--mono)', wordBreak: 'break-all', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-h)' }}>
            {txResult}
          </p>
        </div>
      )}
    </div>
  );
};