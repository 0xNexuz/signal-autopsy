# Test Plan

## Automated

| Area | Case | Expected |
| --- | --- | --- |
| Risk engine | Low-risk intent | ALLOW and full requested cap |
| Risk engine | Stressed intent | BLOCK and zero cap |
| Receipt | Payload mutation | Signature invalid |
| Gate | Matching signed request | Allowed |
| Gate | Above signed cap | Denied |
| Gate | BLOCK route | Denied |
| Gate | Wrong symbol or side | Denied |
| Gate | Expired receipt | Denied |
| Failure Memory | Prevented adverse move | Correct intervention |
| Benchmark | Repeated same fixture | Byte-equivalent result |

Latest local result: 9 tests passed, 0 failed on 2026-09-09.

## Deployment

1. Load each Reality instrument and verify REAL ticker/candle labels.
2. Run a pre-mortem and verify receipt with api/verify-receipt.
3. Submit a permitted simulated order and capture simulated order ID.
4. Alter symbol, side, cap, signature, and expiry; verify denial.
5. Run benchmark twice and compare dataset hash and metrics.
6. Configure Qwen and confirm REAL status while route output remains identical.

Public production Reality data and the fixed benchmark were verified on 2026-09-09. Mainnet order testing is intentionally excluded until static egress, key policy, and explicit operator approval exist.
