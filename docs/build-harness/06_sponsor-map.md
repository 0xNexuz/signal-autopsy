# Integration Map

| Product surface | Signal Autopsy use | Current commit status |
| --- | --- | --- |
| Bitget Agent Hub SDK | Read-only market intent for instruments and tickers | REAL - LOCAL CODE; MAINNET RECHECK BLOCKED |
| Bitget UTA v3 | Reality instruments, candles, and authenticated Reality depth | REAL - LOCAL CODE; MAINNET RECHECK BLOCKED |
| Bitget Reality/rTokens | rAAPL, rNVDA, rTSLA, rMSFT, rSPY, and rQQQ workflows | PARTIAL; symbols and adapters implemented |
| Reality order API | Not called by the audited route API | BLOCKED BY DESIGN |
| Qwen | Adversarial thesis examination only | DEMO locally; production recheck pending |
| Frozen benchmark | Fixed Reality candle dataset with deterministic intents | REAL DATASET; SIMULATED policy comparison |

The installed official Agent SDK exposes the market actions used here, including instruments and tickers. RSA signing remains available for authenticated Reality depth in lib/bitget.js. The route API deliberately does not import the order adapter.
