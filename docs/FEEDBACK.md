# User Feedback — Level 5

## Feedback Collection Method
Direct outreach via Discord channels, Telegram developer groups, and Twitter (X) replies following the Preprod release link.

## Raw Feedback Log
| # | User | Feedback Summary | Date |
|---|------|-----------------|------|
| 1 | @0x_builder | Getting tDUST from the faucet was not obvious. Tried to execute transactions without gas tokens. | 2026-09-08 |
| 2 | TG: AlexM | Lace connection disconnected when switching tabs during local ZK proof generation. | 2026-09-08 |
| 3 | @zk_fanatic | WhisperScore verification takes 3-5 seconds locally; without visual feedback, it caused accidental double clicks. | 2026-09-09 |
| 4 | TG: cryptodave | Received an unhandled circuit runtime error when entering negative numbers in the threshold input. | 2026-09-10 |
| 5 | @dev_sarah | On-chain verification works well, but users requested a score tier legend to understand threshold metrics. | 2026-09-11 |

## What We Heard (Themes)
* **Onboarding Friction:** New users need clear instructions and faucet links to acquire Preprod tDUST before interacting.
* **Prover Latency & UI Locking:** Local Compact circuit execution requires an explicit spinner and disabled button state to prevent duplicate calls.
* **Input Sanitization & Context:** The client must reject non-positive values before executing proof circuits, and tier classifications need visual context.

## What We Changed
| Change | Reason | Commit |
|--------|--------|--------|
| Added faucet banner and Preprod tDUST guidance link in `WalletConnect.tsx` | Eliminates failed zero-gas transactions for first-time testers | `9bf1d2a` |
| Added loading spinner and disabled state during proof generation in `VerifyPowerUser.tsx` | Prevents duplicated prover computations and stabilizes wallet state | `8727bb4` |
| Implemented client-side input validation and added score tier legend | Eliminates raw circuit panic errors and provides scoring context | `8727bb4` |