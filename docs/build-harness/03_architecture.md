# Architecture

~~~text
Untrusted browser intent
  -> bounded input validation
  -> server-owned Bitget Reality instrument, ticker, candles, and optional depth
  -> Qwen adversarial examiner (advisory only, outage-tolerant)
  -> deterministic six-factor engine
  -> HMAC-signed receipt with identity, cap, and expiry
  -> server route gate
       -> DENIED
       -> SIMULATED order result
       -> no exchange submission path in this build
  -> browser receipt ledger
  -> server-fetched later Reality price
  -> signed Failure Memory evaluation
~~~

## Components

| Component | Responsibility | Trust |
| --- | --- | --- |
| app.js | Existing UI workflow, local receipt ledger, status labels | Untrusted client |
| lib/autopsy-policy.js | Canonical symbols and bounded agent-declared inputs | Server boundary |
| lib/reality-market.js | Agent Hub market intent, UTA v3 candles, optional authenticated Reality depth | Server evidence |
| lib/risk-engine.js | Pure deterministic scoring, receipt cryptography, outcome classification | Trusted deterministic core |
| lib/signing.js | Strong configured-secret policy and labeled demo fallback | Server secret boundary |
| lib/route-gate.js | Signature, expiry, identity, route, and notional checks | Enforcement core |
| api/autopsy.js | Re-fetches market evidence, computes, and signs | Server chokepoint |
| api/route-gate.js | Enforces receipt and returns simulated execution only | Server chokepoint |
| api/evaluate-memory.js | Verifies receipt and fetches the later price | Server evidence |
| api/examine-thesis.js | Bounded Qwen adapter with labeled fallback | Advisory only |

## Data Ownership

The browser owns thesis, strategy, side, notional, confidence, evidence quality, and event-risk declaration. The server owns instrument identity confirmation, price, candles, session model output, liquidity evidence, volatility, score, route, cap, expiry, receipt signature, and Failure Memory outcome price.
