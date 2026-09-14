# Test Plan

## Automated Result

Command: npm run verify
Date: 2026-09-11
Result: 20 passed, 0 failed
Syntax coverage: 25 JavaScript files

| Area | Cases |
| --- | --- |
| Risk engine | Low risk, stressed risk, NaN, Infinity, out-of-range confidence |
| Session model | Explicit SIMULATED status and limitation |
| Receipt | Valid signature and payload mutation |
| Input policy | Symbol canonicalization, malformed symbol, non-finite input |
| Evidence ownership | Server values override browser depth and volatility |
| Gate | Match, cap, BLOCK, identity mismatch, expiry, mutation, unknown route, invalid cap, malformed symbol and side |
| Execution boundary | Route API contains no exchange order call |
| Verify endpoint | Valid signature plus expired receipt returns invalid |
| Failure Memory | Prevented loss classification |
| Signing | Demo label and weak configured-secret rejection |
| Benchmark | Deterministic output and no greater exposure than agent-alone |

## Browser Result

Command: npm run browser:verify
Result: passed locally at 1440x1000 and 390x844.

Checks: loading overlay visible during probing, capability labels accurate, thesis changes with strategy selection, no page errors, and no horizontal overflow. Screenshots are outputs/audit-desktop.png and outputs/audit-mobile.png.

## External Checks

- npm audit --omit=dev: 0 vulnerabilities.
- Qwen local configuration: DEMO fallback returned successfully.
- Invalid numeric autopsy request: rejected with INVALID_AUTOPSY_INPUT.
- Live Bitget request: BLOCKED by local DNS and must be rerun after preview deployment.
- Real order submission: intentionally excluded.
