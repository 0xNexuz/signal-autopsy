# Real Versus Simulated

| Visible claim | Status | Meaning |
| --- | --- | --- |
| UTA v3 ticker | REAL when response succeeds | Bitget data arrives through Agent Hub market intent |
| Reality candles | REAL when response succeeds | Public UTA v3 historical market data |
| Liquidity | REAL or SIMULATED | Authenticated Reality depth when available; volume proxy otherwise |
| Risk score | REAL - LOCAL | Deterministic production code, not an LLM score |
| Qwen examiner | REAL or DEMO | Real only when a valid Model Studio key succeeds |
| Receipt signature | REAL or DEMO | Real only when a server signing secret is configured |
| Route gate | REAL - LOCAL | Server-side enforcement executes on every request |
| Order execution | SIMULATED by default | No exchange order is submitted |
| Live Reality order | BLOCKED | Code exists but has not been mainnet exercised |
| Failure Memory | REAL - LOCAL | Uses later market price and original signed receipt |
| Benchmark market data | REAL when endpoint succeeds | Fixed-as-of Bitget Reality candles |
| Benchmark intents/policy | SIMULATED | Fixed deterministic scenario matrix |

No result in this build is financial advice or a profitability guarantee.
