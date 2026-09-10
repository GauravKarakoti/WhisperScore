# User Feedback — Level 5

## Feedback Collection Method
Direct messages via Discord, Telegram developer groups, and Twitter (X) replies following the public testnet deployment link.

## Raw Feedback Log
| # | User | Feedback Summary | Date |
|---|------|-----------------|------|
| 1 | @0x_builder | Getting tDUST from the faucet wasn't intuitive. I tried interacting with the contract but it failed until I realized I needed test tokens first. | 2026-09-08 |
| 2 | TG: AlexM | Lace wallet connection dropped when I switched tabs during the zero-knowledge proof generation. Had to restart the transaction. | 2026-09-08 |
| 3 | @zk_fanatic | The WhisperScore calculation takes a few seconds to run the Compact circuit locally. Needs a loading spinner so users don't double-click. | 2026-09-09 |
| 4 | TG: cryptodave | I got a raw "circuit execution failed" error when I inputted a negative value. The frontend should catch this before it hits the prover. | 2026-09-10 |
| 5 | @dev_sarah | The privacy features work flawlessly on-chain! But the final output score lacked context—a legend explaining the scoring tiers would be great. | 2026-09-11 |

## What We Heard (Themes)
*   **Onboarding Friction:** Users arriving without tDUST are hitting immediate transaction failures without clear guidance on how to fund their Lace wallets.
*   **UX/State Management:** Generating ZK proofs takes time, leading to confusion, double-clicks, and interrupted wallet states if there is no visual feedback.
*   **Input Validation:** Passing bad data directly to the ZK circuit results in unhelpful, low-level error messages rather than clean frontend warnings.

## What We Changed
| Change | Reason | Commit |
|--------|--------|--------|
| Added a tooltip and link to the Midnight tDUST faucet on the Connect Wallet screen. | To ensure users have the required testnet gas before attempting to interact with the contract. | `a1b2c3d` |
| Implemented a loading spinner and disabled the submit button during `checkEligibility.prover` execution. | To prevent multiple simultaneous circuit executions and provide visual feedback during the delay. | `e4f5g6h` |
| Added frontend input validation to reject negative numbers and invalid data formats. | To fail fast on the client side and provide readable error messages instead of raw circuit failures. | `i7j8k9l` |