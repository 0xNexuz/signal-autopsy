# Problem

Tokenized US equities can be accessible beyond the underlying US market session. An autonomous agent may therefore keep proposing orders while reference-market liquidity, event information, and token liquidity change in ways its thesis did not model.

Signal generation alone does not answer whether an order should be allowed to reach execution. Operators need a separate, deterministic authorization boundary that can reject stale, overconfident, oversized, or context-blind intents and preserve the reason for later review.

Signal Autopsy is that boundary. It converts a proposed rToken order into six risk components, a route, a maximum notional, an expiry, and a signed receipt. Later prices are attached to the receipt so the system can learn whether intervention was correct without allowing a language model to rewrite the policy.

Success means:

1. No route opens without a valid receipt.
2. Qwen may challenge a thesis but cannot authorize capital.
3. Every intervention can be replayed and scored later.
4. Evidence labels distinguish market data, simulated execution, and unverified integrations.
