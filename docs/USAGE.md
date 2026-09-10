# How to Use WhisperScore

Welcome to WhisperScore! This guide will walk you through verifying your "power user" status securely and privately without exposing your financial history.

## Getting Started on Preprod
Before you can interact with WhisperScore, you need to set up your wallet and grab some test tokens for network fees.
1. **Install Lace Wallet:** Download and install the Lace Wallet extension for your browser.
2. **Switch to Preprod:** Open Lace, go to settings, and ensure your network is set to "Preprod".
3. **Get tDUST (Gas):** You will need test DUST (tDUST) to cover transaction fees. Click the **"Get tDUST"** banner on our app's home page to visit the official Midnight faucet.

## Your First Transaction
1. **Connect Your Wallet:** Click the "Connect Lace Wallet" button on the WhisperScore homepage and approve the connection.
2. **Authorize Multi-Chain Data:** Connect your secondary wallets (e.g., Ethereum) to allow WhisperScore to locally read your balances/history.
3. **Enter Your Data:** Input your target threshold. *(Note: Our system will validate that you've entered a positive number to prevent processing errors).*
4. **Generate Proof:** Click "Verify Power User Status". You will see a **loading spinner** appear. Because we are generating a Zero-Knowledge (ZK) proof locally on your machine to protect your privacy, this step takes a few seconds. Please do not close the tab or double-click!
5. **Approve Transaction:** Lace will prompt you to approve the transaction to submit this proof to the Midnight Preprod network.
6. **View Your Tier:** Once confirmed on-chain, your score tier (Bronze, Silver, or Gold) will be revealed on screen according to our visual tier legend, and the network's total eligible count will increase.

## What Gets Proved (and What Stays Private)
* **What is Proved:** You successfully proved that your aggregated multi-chain balance meets or exceeds the required threshold for your specific tier.
* **What Stays Private:** Your actual exact balances, wallet addresses, and signatures are **never** uploaded to the blockchain. The math happens locally on your device.

## Troubleshooting
* **Wallet Connection Fails:** Ensure your Lace Wallet is unlocked and set to the Preprod network.
* **Proof Generation Fails:** Check that your combined balances actually meet the required threshold. The circuit will reject the proof locally if you are ineligible.