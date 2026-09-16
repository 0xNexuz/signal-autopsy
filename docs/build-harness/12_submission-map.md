# Product Claim Map

| Product claim | Implementation | Evidence | Allowed wording |
| --- | --- | --- | --- |
| Safety harness for 24/7 rToken agents | app.js and server APIs | browser verification | Implemented and locally verified |
| Official Agent Hub and UTA v3 stack | lib/reality-market.js | installed SDK contract; 2026-09-16 production smoke | Implemented and production smoke verified |
| Qwen adversarial examiner | api/examine-thesis.js | local DEMO fallback | Advisory integration implemented; live status must match UI |
| Deterministic six-factor risk | lib/risk-engine.js | automated tests | Locally verified |
| Server-owned market evidence | api/autopsy.js and lib/autopsy-policy.js | ownership regression test | Locally verified |
| Machine-enforceable route gate | lib/route-gate.js and api/route-gate.js | boundary tests | Locally verified for simulated routing |
| Signed autopsy receipts | api/autopsy.js and lib/signing.js | mutation and secret-policy tests | Locally verified |
| Failure Memory | api/evaluate-memory.js | classifier and server-owned outcome code | Implemented; live evaluation workflow remains a demo step |
| Frozen historical comparison | data/benchmark-report.json | deterministic benchmark test | Frozen real dataset with simulated intents |
| Real Reality order submission | none in route API | source regression test | Not supported in this build |

## Submission Readiness

The product is suitable for review and demo. It must not be described as live-trading ready. The precise unresolved engineering requirement is an atomic, durable, single-use receipt store followed by controlled order-route testing.
