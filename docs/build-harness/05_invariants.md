# Safety Invariants

1. Qwen never sets score, route, cap, expiry, or execution state.
2. A Qwen outage never opens or aborts the deterministic safety boundary.
3. Only finite, bounded values reach the risk engine.
4. Market identity, price, candles, liquidity evidence, session model, and volatility are server-owned.
5. A missing or invalid signature always denies routing.
6. An invalid or expired receipt always fails verification.
7. A symbol or side mismatch always denies routing.
8. Unknown routes and non-finite signed caps always deny routing.
9. BLOCK and PAPER_ONLY always deny routing.
10. Requested notional never exceeds the signed cap.
11. The route API contains no Bitget exchange submission call in this build.
12. Failure Memory obtains the later price on the server.
13. A configured receipt signing secret shorter than 32 characters is rejected.
14. REAL, DEMO, SIMULATED, and BLOCKED labels describe the path actually executed.
15. Private Bitget, RSA, Qwen, and receipt-signing material never enters browser code.

Automated tests directly cover invariants 3, 5 through 13. Browser verification covers the relevant visible labels and loading state. A tracked-file secret scan and deployment configuration review cover invariant 15.
