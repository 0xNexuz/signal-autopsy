# Safety Invariants

1. Qwen output never directly sets score, route, cap, or expiry.
2. The server recomputes every risk component from submitted evidence.
3. A missing or invalid signature always denies execution.
4. An expired receipt always denies execution.
5. A symbol or side mismatch always denies execution.
6. BLOCK and PAPER_ONLY never reach the Reality order function.
7. Requested notional may not exceed the signed cap.
8. Live submission requires both BITGET_EXECUTION_MODE=live and BITGET_LIVE_ACK=I_UNDERSTAND_REAL_ORDERS.
9. A DEMO-signed receipt can never reach live submission.
10. Private exchange and Qwen credentials never enter browser JavaScript.
11. Failure Memory evaluates the original signed payload rather than mutable UI state.
12. Status labels must describe the actual path being shown.

Tests cover invariants 3 through 7 and receipt mutation. Deployment configuration review covers 8 through 10.
