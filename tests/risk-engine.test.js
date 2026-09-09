import test from "node:test";
import assert from "node:assert/strict";
import { computeRisk, evaluateIntervention, signReceipt, verifyReceipt } from "../lib/risk-engine.js";

const lowRisk = {
  session: { score: 12 },
  depthQuality: 90,
  eventRisk: 8,
  volatilityRisk: 12,
  orderNotional: 100,
  depthNotional: 20000,
  confidence: 55,
  evidenceQuality: 80
};

test("deterministic engine allows a low-risk intent", () => {
  const result = computeRisk(lowRisk);
  assert.equal(result.route, "ALLOW");
  assert.equal(result.authorization.executable, true);
  assert.equal(result.authorization.maxNotional, 100);
});

test("deterministic engine blocks a stressed intent", () => {
  const result = computeRisk({
    session: { score: 88 },
    depthQuality: 8,
    eventRisk: 95,
    volatilityRisk: 92,
    orderNotional: 12000,
    depthNotional: 3000,
    confidence: 98,
    evidenceQuality: 20
  });
  assert.equal(result.route, "BLOCK");
  assert.equal(result.authorization.executable, false);
  assert.equal(result.authorization.maxNotional, 0);
});

test("receipt verification detects mutation", () => {
  const receipt = { payload: { market: "rAAPLUSDT", decision: { route: "ALLOW" } } };
  receipt.signature = signReceipt(receipt.payload, "test-secret");
  assert.equal(verifyReceipt(receipt, "test-secret"), true);
  receipt.payload.decision.route = "BLOCK";
  assert.equal(verifyReceipt(receipt, "test-secret"), false);
});

test("Failure Memory classifies a prevented loss", () => {
  const evaluation = evaluateIntervention({
    market: { price: 100 },
    intent: { side: "buy" },
    decision: { route: "BLOCK" }
  }, { price: 96, observedAt: "2026-09-01T00:00:00.000Z" });
  assert.equal(evaluation.verdict, "CORRECT_INTERVENTION");
  assert.equal(evaluation.returnPct, -4);
});
