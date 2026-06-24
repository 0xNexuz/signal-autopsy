# Signal Autopsy Demo Video Script

## 0:00 - 0:10 Opening

"Most AI trading tools try to answer one question: should the agent buy or sell?

Signal Autopsy asks a better question first: how can this trade fail before it reaches live execution?"

## 0:10 - 0:25 Product Setup

"Signal Autopsy is a pre-trade failure intelligence layer for AI trading agents.

It takes an agent's trade idea, inspects the market conditions around it, and turns that into a visible pre-mortem: a thesis, fragility score, route decision, guardrails, and an audit trail."

## 0:25 - 0:45 Replay Lab

"Here in the replay lab, I can choose a market and an agent strategy.

I'll start with BTCUSDT and a breakout continuation strategy.

As I adjust confidence, leverage, market drift, and depth quality, the thesis updates automatically. So the agent's reasoning is not static. It changes with the selected risk conditions."

## 0:45 - 1:05 Probing The Signal

"Now I click Run pre-mortem.

The system enters a probing state. It is replaying the thesis against execution pressure: confidence, leverage, drift, and depth.

The goal is not to produce a trading signal. The goal is to decide whether this signal is safe enough to route."

## 1:05 - 1:25 Verdict

"Signal Autopsy returns a fragility score and a route decision.

Low fragility can move to sandbox or a guarded micro-test.

Higher fragility gets pushed to paper trading or probe-only mode.

Severe fragility blocks live routing completely."

## 1:25 - 1:45 Stress Test

"Let me make the setup more dangerous.

I increase the agent's confidence, raise leverage, weaken depth, and push market drift harder.

The thesis changes, the system probes again, and now the verdict moves toward blocking live execution."

## 1:45 - 2:05 Guardrail Compiler

"The important part is that the output is not just a warning.

Signal Autopsy compiles the decision into a guardrail policy: max leverage, live-route permission, re-check timing, cancel conditions, and the current thesis.

This is the layer an agent runner or exchange connector could enforce before any order is allowed."

## 2:05 - 2:20 Audit Ledger

"Every intentional pre-mortem is written to the ledger.

Slider previews update the analysis, but they do not spam the audit trail. Only submitted decisions are recorded.

That gives teams a replayable history of what the agent believed and why it was allowed, limited, or blocked."

## 2:20 - 2:35 Footer And Docs

"At the bottom, there are direct links to the Bitget API docs and the build documentation.

The current version is static, but the next step is connecting live market data: tickers, order book depth, funding data, and account risk controls."

## 2:35 - 2:50 Closing

"Signal Autopsy is not another trading bot.

It is the safety layer before the bot.

Before capital, before leverage, before live execution, every AI trading agent should have a failure memory."

## Short 45-Second Version

"Signal Autopsy is pre-trade failure intelligence for AI trading agents.

Instead of only asking whether an agent should buy or sell, it asks how the trade could fail before it reaches live execution.

I choose a market, strategy, confidence, leverage, drift, and depth quality. The thesis updates automatically as these conditions change.

When I run a pre-mortem, the system probes the signal and returns a fragility score, route decision, failure findings, and an execution guardrail.

Low-risk setups can move to sandbox or guarded testing. High-risk setups are paper-only or blocked from live routing.

Every submitted pre-mortem is saved to the ledger, creating a replayable audit trail.

Signal Autopsy is not another trading bot. It is the safety layer before the bot."
