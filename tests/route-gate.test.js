import test from "node:test";
import assert from "node:assert/strict";
import { inspectRouteGate } from "../lib/route-gate.js";
import { signReceipt } from "../lib/risk-engine.js";

const secret = "route-test-secret";

function receipt(route = "ALLOW", maxNotional = 1000, expiresAt = "2030-01-01T00:00:00.000Z") {
  const payload = {
    expiresAt,
    market: { symbol: "rAAPLUSDT" },
    intent: { side: "buy" },
    decision: { route, authorization: { maxNotional } }
  };
  return { payload, signature: signReceipt(payload, secret) };
}

test("gate accepts a matching signed order inside the cap", () => {
  const result = inspectRouteGate({ receipt: receipt(), order: { symbol: "rAAPLUSDT", side: "buy", notional: 900 }, secret, now: Date.parse("2029-01-01") });
  assert.equal(result.allowed, true);
});
test("gate rejects an oversized order", () => {
  const result = inspectRouteGate({ receipt: receipt("CLAMP", 350), order: { symbol: "rAAPLUSDT", side: "buy", notional: 351 }, secret, now: Date.parse("2029-01-01") });
  assert.equal(result.code, "SIZE_EXCEEDS_AUTHORIZATION");
});

test("gate rejects route and identity mismatches", () => {
  assert.equal(inspectRouteGate({ receipt: receipt("BLOCK", 0), order: { symbol: "rAAPLUSDT", side: "buy", notional: 10 }, secret, now: Date.parse("2029-01-01") }).code, "BLOCK");
  assert.equal(inspectRouteGate({ receipt: receipt(), order: { symbol: "rNVDAUSDT", side: "buy", notional: 10 }, secret, now: Date.parse("2029-01-01") }).code, "SYMBOL_MISMATCH");
  assert.equal(inspectRouteGate({ receipt: receipt(), order: { symbol: "rAAPLUSDT", side: "sell", notional: 10 }, secret, now: Date.parse("2029-01-01") }).code, "SIDE_MISMATCH");
});

test("gate rejects expired, invalid-expiry, and mutated receipts", () => {
  assert.equal(inspectRouteGate({ receipt: receipt(), order: { symbol: "rAAPLUSDT", side: "buy", notional: 10 }, secret, now: Date.parse("2031-01-01") }).code, "EXPIRED_RECEIPT");
  assert.equal(inspectRouteGate({ receipt: receipt("ALLOW", 1000, "never"), order: { symbol: "rAAPLUSDT", side: "buy", notional: 10 }, secret }).code, "INVALID_EXPIRY");
  const changed = receipt();
  changed.payload.decision.authorization.maxNotional = 2000;
  assert.equal(inspectRouteGate({ receipt: changed, order: { symbol: "rAAPLUSDT", side: "buy", notional: 10 }, secret, now: Date.parse("2029-01-01") }).code, "INVALID_SIGNATURE");
});

test("gate rejects unknown routes and non-finite signed caps", () => {
  assert.equal(inspectRouteGate({ receipt: receipt("MAYBE", 1000), order: { symbol: "rAAPLUSDT", side: "buy", notional: 10 }, secret, now: Date.parse("2029-01-01") }).code, "INVALID_ROUTE");
  assert.equal(inspectRouteGate({ receipt: receipt("ALLOW", "NaN"), order: { symbol: "rAAPLUSDT", side: "buy", notional: 10 }, secret, now: Date.parse("2029-01-01") }).code, "INVALID_AUTHORIZATION");
});

test("gate rejects malformed Reality symbols and sides", () => {
  assert.equal(inspectRouteGate({ receipt: receipt(), order: { symbol: "AAPLUSDT", side: "buy", notional: 10 }, secret, now: Date.parse("2029-01-01") }).code, "INVALID_SYMBOL");
  assert.equal(inspectRouteGate({ receipt: receipt(), order: { symbol: "rAAPLUSDT", side: "hold", notional: 10 }, secret, now: Date.parse("2029-01-01") }).code, "INVALID_SIDE");
});
