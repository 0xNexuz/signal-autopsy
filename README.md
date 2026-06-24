# Signal Autopsy

Pre-trade failure intelligence for AI trading agents.

Signal Autopsy is a static product prototype that turns an AI trading agent's proposed trade into a replayable pre-mortem. Instead of asking only whether a signal might win, it asks how the signal could fail before live routing is allowed.

Live site: https://signal-autopsy.vercel.app

## What It Does

Signal Autopsy helps operators inspect a trading-agent decision before capital, leverage, or live execution is approved. The product turns a proposed trade setup into:

- a dynamic agent thesis
- a fragility score
- a route decision
- a visible probing/loading sequence
- failure findings
- a compiled guardrail policy
- an audit ledger entry

The current build is browser-only and does not place trades. It is designed as a product and interaction prototype for an agent-risk layer that could sit between an AI trading strategy and an exchange execution system.

## Why It Exists

Most AI trading demos focus on signal generation: buy, sell, hold, predict, repeat.

Signal Autopsy focuses on the layer before execution:

- Is the agent too confident for the current market state?
- Is requested leverage too high for the depth profile?
- Is the trade thesis contradicted by drift or liquidity?
- Should the route be live, guarded, paper-only, or blocked?
- Can the decision be replayed later as an audit event?

The goal is to make agent risk inspectable before it becomes performance.

## Core Workflow

1. Select a market and agent strategy.
2. Adjust confidence, leverage, 24h drift, and depth quality.
3. Signal Autopsy generates a thesis that changes with those inputs.
4. Run a pre-mortem to trigger the probing state.
5. The app calculates fragility and returns a route decision.
6. The guardrail compiler creates an execution policy.
7. Intentional pre-mortem runs are written to the ledger.

Slider previews update the analysis but do not write audit rows. The ledger only records deliberate submitted pre-mortems.

## Route Decisions

Signal Autopsy maps the fragility score into four execution routes:

| Score | Route | Meaning |
| --- | --- | --- |
| 0-37 | Sandbox allow | Low-fragility setup suitable for controlled sandbox routing. |
| 38-54 | Guarded micro-test | The signal can move forward with tight invalidation and small sizing. |
| 55-71 | Paper / probe only | The signal needs observation before live execution. |
| 72+ | Block live routing | The setup is too fragile for live routing. |

## Fragility Model

The prototype uses a synthetic scoring model:

```text
fragility = 24
  + abs(24h_drift) * 4.2
  + max(0, confidence - 58) * 0.45
  + leverage * 1.72
  + max(0, 58 - depth_quality) * 0.48
```

This is not financial advice or a production risk model. It is an interaction model that shows how agent confidence, leverage, liquidity, and market drift can be converted into pre-execution guardrails.

## Key Features

- Dynamic thesis generation based on market, strategy, confidence, leverage, drift, and depth.
- Probing/loading state that makes the pre-mortem feel like an inspection process.
- Guardrail compiler with max leverage, live-route permission, re-check timing, and cancel conditions.
- Audit ledger that records intentional pre-mortem submissions.
- Product documentation page at `docs.html`.
- Footer links to the official Bitget API docs and the build documentation.
- Static deployment with no backend required.

## Project Structure

```text
.
├── index.html                  # Main product page
├── docs.html                   # Build documentation
├── outputs/
│   ├── signal-autopsy.html     # Local Codex output copy
│   └── docs.html               # Local Codex output docs copy
├── vercel.json                 # Vercel static deployment config
├── README.md
└── .gitignore
```

## Run Locally

Open `index.html` directly in a browser.


## GitHub

Repository:

```text
https://github.com/0xNexuz/signal-autopsy
```

Main branch:

```text
main
```

## Bitget Integration Path

The current version is static. A production version could integrate with Bitget APIs for:

- market tickers
- order book depth
- funding data
- volatility snapshots
- account risk settings
- paper or live route enforcement

Official Bitget API docs:

```text
https://www.bitget.com/api-doc/common/intro
```

## Next Steps

- Replace synthetic scoring with live market data inputs.
- Add authenticated paper-trading mode.
- Store pre-mortem ledger events in a database.
- Export guardrails as JSON policies.
- Add strategy-specific thresholds.
- Connect Bitget API data for depth, funding, and tickers.

## Disclaimer

Signal Autopsy is a product prototype. It does not execute trades and should not be treated as financial advice, investment advice, or a production trading-risk system.
