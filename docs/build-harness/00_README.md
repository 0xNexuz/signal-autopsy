# Signal Autopsy Build Harness

This directory is the evidence-backed readiness record for Signal Autopsy 2.0.

## Status Language

- REAL - LOCAL: implemented and verified locally.
- REAL - TESTNET: exercised against a non-production exchange environment.
- REAL - MAINNET: exercised against production infrastructure.
- SIMULATED: real code running with synthetic intent or execution.
- MOCKED: controlled test double.
- PARTIAL: implemented but not fully verified in the target environment.
- BLOCKED: verification cannot proceed without an external dependency or credential.
- PLANNED: not implemented.

## Current Readiness

| Capability | Status | Evidence |
| --- | --- | --- |
| Six-component deterministic risk engine | REAL - LOCAL | tests/risk-engine.test.js |
| Signed autopsy receipts | REAL - LOCAL | receipt mutation test |
| Machine-enforceable route gate | REAL - LOCAL | tests/route-gate.test.js |
| Browser persistence | REAL - LOCAL | localStorage receipt ledger |
| Bitget Agent Hub market intent | REAL - MAINNET | production rAAPL response verified |
| UTA v3 Reality candles | REAL - MAINNET | production candle and benchmark responses verified |
| Authenticated Reality depth with RSA | PARTIAL | signer implemented; private credential call not exercised |
| Qwen examiner | PARTIAL | live path implemented; DEMO fallback without key |
| Failure Memory | REAL - LOCAL | deterministic outcome classifier and signed evaluation |
| Historical comparison | REAL - MAINNET | 84 scenarios pinned with dataset hash |
| Real order submission | BLOCKED | deliberately disarmed and not mainnet-tested |

See the remaining documents for architecture, claims, tests, threats, and demo boundaries.
