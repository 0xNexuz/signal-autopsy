# Threat Model

## Assets

- Receipt signing secret
- Bitget credentials and RSA private key
- Qwen API key
- Route decision, notional cap, and expiry
- Market evidence and Failure Memory outcomes
- Accuracy of REAL, DEMO, SIMULATED, and BLOCKED labels

## Threats And Controls

| Threat | Control | Verification | Residual risk |
| --- | --- | --- | --- |
| NaN or Infinity causes fail-open routing | Finite, bounded numeric parsing | risk-engine tests | New fields must use the same validator |
| Browser forges low-risk market evidence | Server re-fetches Reality evidence in api/autopsy | autopsy-policy tests | Public market provider remains an external dependency |
| Receipt payload is edited | HMAC-SHA256 over canonical payload | mutation test | Secret rotation strategy is not implemented |
| Receipt is stale | Expiry checked by verifier and route gate | expiry tests | Valid receipt can still be reused inside its window |
| Receipt is replayed into a real order | Exchange submission path removed | source regression test | Atomic consumption store is still required before live trading |
| Symbol, side, route, or cap is malformed | Canonical validation and explicit deny codes | route-gate tests | Instrument aliases remain intentionally unsupported |
| Browser forges later price | Server fetches outcome market | code inspection | Evaluation timing is user-triggered |
| Prompt injection asks Qwen to authorize | System instruction plus advisory-only architecture | code inspection | Model prose can still influence a human |
| Qwen is unavailable | Labeled fallback; deterministic path continues | local API check | No live Qwen response verified on this commit |
| Holiday is treated as regular session | Session status is SIMULATED and names limitation | session test | Calendar endpoint integration is pending |
| Secret is weak or leaked | 32-character minimum; server-only environment | signing tests and tracked-file scan | Operational rotation remains manual |
| Oversized request body consumes resources | 12 KB or 32 KB limits | code inspection | Platform-level limits are still recommended |

## Security Decision

No real exchange order can be submitted by this build. This is intentional until each signed authorization can be atomically consumed once and recorded in a durable server ledger.
