# WhisperScore
[![Midnight dApp CI](https://github.com/GauravKarakoti/WhisperScore/actions/workflows/ci.yml/badge.svg)](https://github.com/GauravKarakoti/WhisperScore/actions/workflows/ci.yml)
> A decentralized identity and reputation protocol that allows users to cryptographically prove their cumulative "power user" status without exposing their financial history.

## Live Demo
[https://whisper-score-steel.vercel.app/](https://whisper-score-steel.vercel.app/)

## Contract Address
| Network  | Address                                                              |
|----------|----------------------------------------------------------------------|
| Preview  | `16be13f4d0aa666121fc6be71836e99d88cdbb1ce25e2438c559304d7a9cf10f`   |
| Preprod  | `63f6806d5ebdcf5b1f18fea225fe993ebd956df5979d21d071a53e6813e3192e`   |

## What This Product Does
WhisperScore acts as an omni-chain reputation and Sybil resistance oracle. Currently, to prove "power user" status for premium airdrops, DAO voting weight, or undercollateralized loans, users are forced to publicly link their scattered Web3 wallets (exposing cold storage vaults to hot wallets). 

WhisperScore replaces this with programmable selective disclosure. A user can locally aggregate their transaction history and prove "my total accumulated volume across all my wallets > $10,000" or "my wallets are older than 1 year" without ever publishing those addresses on-chain. The verifying protocol receives only a cryptographic "yes/no" proof.

## Privacy Model
- **What is PUBLIC (on-chain, anyone can see):** The required threshold (e.g., cumulative volume > $10,000), the total global `eligibleCount`, and the final boolean attestation (Verified Power User / Not Verified).
- **What is PRIVATE (private witness, never on-chain):** The user's actual wallet addresses, exact `externalChainBalance`, raw transaction histories, and the `stateSignature` linking their fragmented accounts.
- **What the user PROVES without revealing:** That the aggregated metrics of their privately controlled wallets meet or exceed the public threshold, computed securely using a local zero-knowledge circuit, entirely protecting them from graph-based wallet surveillance.

## Privacy Claim
On-chain observers can see that an identity attestation was executed and verified against the Compact circuit, but they cannot deduce the specific private wallet addresses or financial data used by the user to generate the proof locally. This protects the user entirely from graph-based wallet surveillance while still allowing them to leverage their reputation.

## Tech Stack
* **Smart Contract:** Midnight Compact
* **Frontend:** React, TypeScript, Vite, Midnight.js SDK
* **Wallet Integration:** Lace Wallet API
* **Testing:** Jest

## Prerequisites
* [Node.js v22+](https://nodejs.org/)
* Docker daemon running
* [Lace Wallet](https://www.lace.io/) (Configured for Midnight Preprod)

## Setup & Run Locally
1. Clone the repository: `git clone https://github.com/GauravKarakoti/WhisperScore.git`
2. Navigate to the project directory: `cd WhisperScore`
3. Install dependencies: `npm install`
4. Start the local proof server: `docker run -d -p 6300:6300 midnightnetwork/proof-server`
5. Compile the contract: `npm run compile` (or `compact compile`)
6. Start the frontend development server: `npm run dev`

## Run Tests
Run `npm test` to execute the test suite covering circuit logic, cross-chain state aggregation, and privacy constraints.

## CI/CD
This project uses GitHub Actions for Continuous Integration. On every push to the `main` branch, the pipeline automatically checks out the code, sets up Node v22, installs the Compact CLI, compiles the contract, and runs the test suite.

## [Product Proposal](./Proposal.md)

## Usage Guide
See [docs/USAGE.md](./docs/USAGE.md)

## [Product X Thread](https://x.com/GauravKara_koti/status/2098110310922199453?s=20)

## The Core Concept
WhisperScore is a decentralized omni-chain reputation protocol built on the Midnight Network that allows users to cryptographically prove their cumulative "power user" status across multiple fragmented Web3 wallets without doxxing their transaction history or exposing themselves to graph-based wallet surveillance. By aggregating state data from various addresses locally, WhisperScore utilizes a Midnight Compact circuit to verify that the user's combined metrics meet a specific smart contract threshold, subsequently emitting a shielded binary attestation to the public ledger. This provides dApps, DAOs, and lending platforms with a highly reliable, Sybil-resistant credential while empowering users to leverage their hard-earned cross-chain reputation without sacrificing their financial privacy.

## Demo Video & Screenshots
![Test Screenshot](./test.png)
**Demo Video:** [PLACEHOLDER — Add the link after recording]