import test from "node:test";
import assert from "node:assert/strict";
import { serverOwnedRiskInput, validateAutopsyInput } from "../lib/autopsy-policy.js";

test("autopsy policy canonicalizes a Reality symbol and validates agent fields", () => {
  const result = validateAutopsyInput({
    market: { symbol: "RAAPLusdt" },
    intent: { side: "BUY", notional: 250, strategy: "Session handoff" },
    thesis: "A sufficiently detailed test thesis.",
    risk: { eventRisk: 20, confidence: 60, evidenceQuality: 70 }
  });
  assert.equal(result.symbol, "rAAPLUSDT");
  assert.equal(result.intent.side, "buy");
});

test("server-owned risk evidence overrides browser market fields", () => {
  const validated = validateAutopsyInput({
    market: { symbol: "rAAPLUSDT" },
    intent: { side: "buy", notional: 250, strategy: "Test" },
    thesis: "A sufficiently detailed test thesis.",
    risk: {
      eventRisk: 20,
      confidence: 60,
      evidenceQuality: 70,
      depthQuality: 100,
      volatilityRisk: 0
    }
  });
  const result = serverOwnedRiskInput(validated, {
    observedAt: "2026-09-10T00:00:00.000Z",
    session: { score: 72 },
    depthQuality: 20,
    depthNotional: 5000,
    volatilityRisk: 80
  });
  assert.equal(result.depthQuality, 20);
  assert.equal(result.volatilityRisk, 80);
  assert.equal(result.orderNotional, 250);
  assert.equal(result.eventRisk, 20);
});

test("autopsy policy rejects malformed and non-finite agent fields", () => {
  const base = {
    market: { symbol: "rAAPLUSDT" },
    intent: { side: "buy", notional: 250 },
    thesis: "A sufficiently detailed test thesis.",
    risk: { eventRisk: 20, confidence: 60, evidenceQuality: 70 }
  };
  assert.throws(() => validateAutopsyInput({ ...base, market: { symbol: "BTCUSDT" } }), /Reality symbol/);
  assert.throws(() => validateAutopsyInput({ ...base, risk: { ...base.risk, confidence: "NaN" } }), /confidence/);
});
