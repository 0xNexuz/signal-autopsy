# Architecture

~~~text
Agent intent
  -> Replay Lab
  -> Bitget Agent Hub market intent
  -> UTA v3 Reality ticker and candles
  -> Qwen adversarial examiner (advisory)
  -> deterministic six-factor engine
  -> signed autopsy receipt
  -> server route gate
       -> DENIED
       -> SIMULATED execution (default)
       -> Reality order API (explicitly armed only)
  -> local receipt ledger
  -> Failure Memory evaluation
~~~

## Components

- app.js: product workflow, labels, local receipt persistence, and user controls.
- lib/reality-market.js: official Agent Hub ticker intent plus UTA v3 candles and optional Reality depth.
- lib/risk-engine.js: deterministic score, route, signing, verification, and outcome classification.
- lib/route-gate.js: signature, expiry, identity, route, and notional enforcement.
- api/route-gate.js: server chokepoint; simulated by default and capable of Reality order submission only when explicitly armed.
- api/examine-thesis.js: Qwen integration with a labeled fallback.
- api/benchmark.js: fixed-as-of Reality candle cohort and deterministic comparison.

Trust boundary: browser inputs are untrusted. The server recomputes risk, signs receipts, and verifies them again at the execution boundary.
