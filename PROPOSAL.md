# Product Proposal

## What is the product, and who uses it?
WhisperScore is a decentralized eligibility gate. It allows users to cryptographically prove they meet a specific quantitative threshold (e.g., a credit score > 700, a minimum income level, or a required number of gym visits) to access a service, discount, or loan. 
* **Users (Provers):** Everyday consumers who want to protect their sensitive personal data from unnecessary exposure.
* **Verifiers:** Businesses (lenders, landlords, insurers, or gyms) who need verifiable proof of eligibility but want to avoid the liability and compliance risks of storing sensitive personal data.

## Why Midnight specifically?
If this were built on a standard transparent blockchain (like Ethereum or base Cardano), all inputs to the smart contract would be publicly visible. A user's exact credit score, salary, or health metrics would be broadcast to the entire world, which is a massive privacy violation. 

Midnight's data protection model allows the actual threshold comparison to happen locally on the user's device. The smart contract utilizes a zero-knowledge circuit to verify the math without ever seeing the underlying numbers. Midnight natively handles the complex cryptography, allowing businesses to trust the "yes/no" output without ever touching the user's private data.

## Data Model
| Data Point                   | Type            | Disclosed To                     |
|------------------------------|-----------------|----------------------------------|
| Required Threshold (e.g. 700)| Public ledger   | Everyone                         |
| Eligibility Result (True/False)| Public ledger | Everyone                         |
| User's Exact Score/Value     | Private witness | No one (stays on user's device)  |

## Mainnet Feasibility
Yes, this is highly realistic to reach Mainnet by Level 6. The core cryptographic logic (a zero-knowledge threshold comparison) is lightweight and already functioning. To make it a fully production-ready Mainnet product, the next phases would simply involve integrating with an Oracle or Decentralized Identity (DID) system. This would ensure that the private score the user inputs into their local witness is authenticated by a trusted issuer (like a credit bureau) rather than self-reported, creating a fully trustless end-to-end system.