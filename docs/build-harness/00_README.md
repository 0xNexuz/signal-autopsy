# Signal Autopsy Build Harness

Audit date: 2026-09-11
Audit branch: codex/audit-hardening
Readiness score: 88/100
Decision: READY FOR REVIEW AND DEMO, NOT READY FOR LIVE ORDER SUBMISSION

## Scope

This harness audits Signal Autopsy as a safety boundary for 24/7 Bitget Reality/rToken agents. It covers market-evidence ownership, deterministic scoring, Qwen isolation, receipt integrity, route enforcement, Failure Memory, benchmark reproducibility, browser behavior, dependency exposure, and claim accuracy.

## Priority Ledger

| Priority | Finding | Resolution |
| --- | --- | --- |
| P0 | Non-finite risk values could produce NaN and fall through to ALLOW | FIXED; finite and range validation now fails closed |
| P0 | Browser could supply market, liquidity, volatility, and session evidence | FIXED; autopsy endpoint now fetches and signs server-owned Bitget evidence |
| P0 | A valid receipt could be replayed into the live exchange path | FIXED FOR THIS BUILD; live submission removed until an atomic single-use store exists |
| P0 | Failure Memory trusted a browser-supplied outcome price | FIXED; outcome market data is fetched by the server |
| P0 | Qwen failure aborted the deterministic autopsy | FIXED; advisory fallback is labeled and deterministic authorization continues |
| P1 | Session heuristic was labeled REAL | FIXED; session is explicitly SIMULATED with its limitations |
| P1 | Receipt verification ignored expiry | FIXED; signature and expiry are reported separately and both are required |
| P1 | JSON bodies were unbounded and malformed input leaked generic failures | FIXED; bounded object-only parsing and structured errors |
| P1 | Weak configured receipt secrets were accepted | FIXED; configured secrets require at least 32 characters |
| P1 | Production dependency audit was unverified | FIXED; npm audit reports 0 vulnerabilities using the system CA |
| P2 | No atomic server-side receipt-consumption ledger | OPEN; live order submission remains disarmed |
| P2 | Current commit has not been re-verified against Bitget mainnet | OPEN; local DNS blocked the live call |
| P3 | Browser receipts are limited to localStorage | ACCEPTED FOR HACKATHON DEMO; not a shared durable ledger |

## Verification Snapshot

- Repository-wide syntax: 25 JavaScript files passed.
- Automated tests: 20 passed, 0 failed.
- Browser verification: desktop and mobile passed; loading state, thesis reactivity, console errors, and horizontal overflow checked.
- Production dependencies: 0 known vulnerabilities.
- Live order call in route API: absent and regression-tested.
- Production smoke verification: passed on 2026-09-16 for the deployed commit; Qwen is labeled DEMO because no provider key is configured.

## Exact Next Action

Provision a durable atomic receipt-consumption store and independently review the live-order policy before adding any exchange submission path. Until then, keep the deployed SIMULATED-ONLY boundary.
