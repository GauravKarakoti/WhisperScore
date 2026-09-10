# Product Proposal

## What is the product, and who uses it?
WhisperScore is a decentralized omni-chain reputation and Sybil resistance oracle. It allows users to cryptographically prove their cumulative "power user" status across multiple fragmented Web3 wallets without doxxing their transaction history or exposing themselves to graph-based wallet surveillance.
* **Users (Provers):** Web3 power users who want to leverage their hard-earned cross-chain reputation (for premium airdrops, undercollateralized loans, or DAO voting weight) without linking their cold storage to their daily-use hot wallets publicly.
* **Verifiers:** dApps, DAOs, and DeFi lending protocols that need highly reliable, Sybil-resistant identity credentials to allocate resources securely, but want to avoid the friction and privacy concerns of demanding fully doxxed financial histories.

## Why Midnight specifically?
If this were built on a standard transparent blockchain (like Ethereum or base Cardano), users would be forced to publish cryptographic links connecting all their wallet addresses to a central identity smart contract. This permanently destroys their financial privacy, mapping their entire net worth and exposing them to on-chain surveillance or targeted attacks.

Midnight's data protection model allows the aggregation and threshold comparison of multiple wallet states to happen entirely locally on the user's device. The smart contract utilizes a zero-knowledge circuit to verify the aggregated metrics (e.g., total trading volume, cumulative account age) without ever seeing the underlying addresses, balances, or the links between them. Midnight natively handles the complex cryptography, allowing DeFi protocols to trust the final boolean credential while the user's wallet graph remains strictly confidential.

## Data Model
| Data Point                   | Type            | Disclosed To                     |
|------------------------------|-----------------|----------------------------------|
| Required Threshold (e.g., > $10,000 cumulative volume)| Public ledger   | Everyone                         |
| Eligibility Result (Verified Power User: True/False)| Public ledger | Everyone                         |
| User's Wallet Addresses, Balances, & Tx History     | Private witness | No one (stays on user's device)  |

## Mainnet Feasibility
Yes, this is highly realistic to reach Mainnet by Level 6. The core cryptographic logic (a zero-knowledge threshold comparison of aggregated state) is lightweight and already functioning. To make it a fully production-ready Mainnet product, the next phases will involve integrating cross-chain storage proofs or an authenticated state oracle. This ensures that the private wallet histories the user inputs into their local witness are cryptographically verified against their native chains (e.g., proving an Ethereum state root inside the local circuit) rather than self-reported, creating a fully trustless, omni-chain identity system.