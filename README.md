# Signal Autopsy

Deterministic pre-trade safety for autonomous agents trading Bitget Reality tokenized US equities.

![Signal Autopsy logo](./logo.svg)

Signal Autopsy sits between an AI trading agent and the exchange route. It does not try to produce a better buy or sell signal. It asks whether the proposed order is safe to execute now, under the current session, liquidity, event, volatility, size, and confidence conditions.

Live site: https://signal-autopsy.vercel.app

## Why It Exists

An rToken agent can operate around the clock even when the underlying US equity market is closed. Continuous access does not guarantee continuous liquidity, fresh reference pricing, or low event risk. A persuasive language-model thesis is also not an execution policy.

Signal Autopsy separates those responsibilities:

- Bitget Agent Hub and UTA v3 provide Reality market evidence.
- Qwen challenges the thesis and exposes missing assumptions.
- A deterministic engine computes the risk score and route.
- A server-side gate enforces the signed result.
- Failure Memory later grades whether the intervention helped.

Qwen never controls the score, maximum notional, expiry, or execution authorization.

## Product Flow

1. An agent proposes a Reality instrument, side, strategy, confidence, and order notional.
2. The app loads the rToken ticker through the official Agent Hub market intent and daily candles through UTA v3.
3. Qwen returns an advisory countercase, hidden assumptions, and evidence requests.
4. The server calculates six deterministic risk components.
5. The route becomes ALLOW, CLAMP, PAPER_ONLY, or BLOCK.
6. The server signs a receipt containing the market snapshot, intent, score, route, cap, and expiry.
7. The execution gate verifies signature, expiry, symbol, side, route, and notional.
8. The signed receipt is retained in the browser ledger.
9. Failure Memory attaches a later Reality price and classifies the intervention.

## Deterministic Risk Model

The score is a weighted sum on a 0-100 scale:

| Component | Weight | Core question |
| --- | ---: | --- |
| Session | 14% | Is the underlying US market in regular, extended, overnight, or weekend phase? |
| Liquidity | 20% | Can current Reality depth support the route? |
| Event | 16% | Could scheduled or unscheduled company information dominate the thesis? |
| Volatility | 18% | Is recent realized movement elevated? |
| Size | 18% | How large is the request relative to observed depth? |
| Overconfidence | 14% | Is agent confidence ahead of evidence quality? |

Route thresholds:

| Score | Route | Enforcement |
| ---: | --- | --- |
| 0-37.9 | ALLOW | Requested notional may pass for a short window |
| 38-55.9 | CLAMP | Notional is capped at 35% of the request |
| 56-71.9 | PAPER_ONLY | Live execution denied |
| 72-100 | BLOCK | Execution denied |

These thresholds are a transparent safety policy, not financial advice.

## Signed Route Gate

The browser is treated as untrusted. The server recomputes the decision and signs the receipt with HMAC-SHA256. The final gate then independently verifies:

- receipt signature;
- authorization expiry;
- Reality symbol;
- order side;
- deterministic route;
- requested notional against the signed cap.

Changing any signed field invalidates the receipt. The audited route API contains no exchange submission path. A passing request returns a SIMULATED order ID after all real gate checks pass. Live submission remains blocked until a durable store can atomically consume each receipt once.

## Reality and Agent Hub

The market adapter uses the official @bitget-ai/bitget-agent-sdk package and its read-only market intent for Reality instrument checks and UTA v3 ticker data. UTA v3 candles supply volatility evidence. Authenticated Reality order-book reads support the user's RSA key through Bitget's documented RSA signature flow.

The official Agent Hub SDK currently supports HMAC for authenticated calls. Public Agent Hub reads and RSA-authenticated Reality depth reads are therefore deliberately separated.

## Qwen Examiner

When BITGET_QWEN_API_KEY is configured, the server calls qwen3.8-max through the S2 hackathon proxy's Responses endpoint. Standard DASHSCOPE_API_KEY configuration is also supported. The model is asked for strict JSON containing:

- strongestCountercase;
- hiddenAssumptions;
- evidenceRequests;
- confidenceChallenge.

Without a key, the examiner visibly reports DEMO and returns a deterministic fallback. In both cases it is advisory only.

## Failure Memory

Receipts are persisted in localStorage because this build intentionally has no database. A later evaluation:

1. verifies the original receipt;
2. obtains a later price;
3. calculates the side-adjusted move;
4. labels the intervention CORRECT_INTERVENTION, FALSE_POSITIVE, CORRECT_PASS, MISSED_RISK, or INCONCLUSIVE;
5. signs the evaluation.

Browser storage is persistent on that browser, but users can delete it. A shared server ledger remains a future database-backed step.

## Historical Benchmark

The benchmark uses a fixed 2026-09-01 cutoff and a fixed cohort of rAAPL, rNVDA, rTSLA, rMSFT, rSPY, and rQQQ daily Reality candles. Every fifth candle after a 20-candle lookback becomes a test intent. Direction follows trailing three-candle momentum, while risk context follows a documented deterministic matrix.

The comparison reports maximum drawdown for:

- agent alone at full exposure;
- agent plus Signal Autopsy, where ALLOW receives 100%, CLAMP 35%, and PAPER_ONLY/BLOCK 0%.

Market candles are REAL when Bitget responds. Agent intents and policy application are SIMULATED. The result is a risk-intervention benchmark, not a trading-profit claim.

## Status Labels

- REAL means the displayed path completed against a real service or real enforcement code.
- DEMO means a configured service was replaced by an explicit fallback.
- SIMULATED means real logic ran without submitting an exchange order.
- BLOCKED means a required service, credential, or safety condition was unavailable.

Detailed claim evidence lives in docs/build-harness.

## Local Setup

Requirements: Node.js 20 or newer.

~~~powershell
npm install
npx vercel dev
~~~

Copy .env.example to .env.local and fill only the services you need. See API_KEYS_SETUP.md for RSA, Qwen, and receipt signing.

## Verification

~~~powershell
npm run verify
npm run browser:verify
~~~

The automated suite covers deterministic decisions, non-finite inputs, server-owned evidence, receipt mutation and expiry, identity and size mismatches, disarmed exchange submission, signing policy, Failure Memory classification, and benchmark repeatability.

## Official Documentation

- Agent Hub: https://github.com/Bitget-AI/agent_hub
- UTA v3 quick start: https://www.bitget.com/docs/uta/quick-start
- Reality trading: https://www.bitget.com/docs/catalog/reality/trading
- Reality trading guide: https://www.bitget.com/api-doc/uta/reality/reality-trading-guide
- Qwen Model Studio: https://www.alibabacloud.com/help/en/model-studio/first-api-call-to-qwen

## Safety

Do not expose API keys, RSA private material, passphrases, Qwen keys, or the receipt signing secret. This build does not submit exchange orders. Live trading must not be added without an atomic single-use receipt store, an explicit operating policy, fixed server egress, monitored limits, and independent testing.
