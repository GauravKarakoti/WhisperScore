# How to Use WhisperScore

## What You Need
To interact with WhisperScore on the Midnight Preprod network, you will need:
* **Lace Wallet**: Installed in your browser with the Midnight Preprod network enabled.
* **Testnet tNIGHT**: A small amount of tNIGHT tokens to pay for transaction fees (available from the Midnight faucet).
* **Multi-chain Wallet (e.g., MetaMask)**: Containing the history/assets you want to aggregate and prove.

## Step-by-Step Guide
1. **Connect Your Wallet**: Open the WhisperScore application and click "Connect Lace Wallet".
2. **Authorize Multi-Chain Data**: Connect your secondary wallets (e.g., Ethereum) to allow WhisperScore to locally read your balances/history.
3. **Generate Proof**: Click "Verify Power User Status". Your browser will locally calculate your total balance and generate a Zero-Knowledge (ZK) proof. 
4. **Approve Transaction**: Lace will prompt you to approve the transaction to submit this proof to the Midnight Preprod network.
5. **View Status**: Once confirmed, the network will update your eligibility status on-chain, and the total `eligibleCount` will increase.

## What Gets Proved (and What Stays Private)
* **Proved**: You successfully proved that your aggregated multi-chain balance meets or exceeds the network's `requiredThreshold`.
* **Stays Private**: Your actual exact balances, wallet addresses, and signatures are **never** uploaded to the blockchain. The math happens locally on your device.

## Troubleshooting
* **Wallet Connection Fails**: Ensure your Lace Wallet is unlocked and set to the Preprod network.
* **Proof Generation Fails**: Check that your combined balances actually meet the `requiredThreshold`. The circuit will reject the proof locally if you are ineligible.