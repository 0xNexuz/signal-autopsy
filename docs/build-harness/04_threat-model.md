# Threat Model

| Threat | Control | Residual risk |
| --- | --- | --- |
| Browser changes route or cap | HMAC signature verified server-side | Signing secret must remain server-only |
| Receipt replay after market changes | Short expiry enforced before route checks | A valid receipt can still age inside its short window |
| Order swaps symbol or side | Exact identity checks | Instrument aliases must remain normalized |
| Oversized order | Signed maximum-notional check | Market sell conversion uses receipt price |
| LLM authorizes a trade | Qwen output excluded from deterministic authorization logic | Operators may still over-trust prose |
| Missing market data | Market route returns BLOCKED; UI labels fallback SIMULATED | Users can still inspect a simulated preview |
| Stolen Bitget key | Environment-only secrets and Bitget permission/IP controls | Hosting egress and key rotation remain operational duties |
| Accidental mainnet order | Two-variable arming plus receipt requirements | Mainnet path is not yet independently exercised |
| Local ledger tampering | Server verifies receipt signature | Browser can delete history because no database is used |

The dominant unresolved risk is operational key management for live execution. Current deployment intent is simulated execution.
