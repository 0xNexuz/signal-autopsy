import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import verifyHandler from "../api/verify-receipt.js";
import { signReceipt } from "../lib/risk-engine.js";

function responseCapture() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(value) { this.body = JSON.parse(value); }
  };
}

test("route API contains no exchange submission call", () => {
  const source = readFileSync(new URL("../api/route-gate.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /placeRealityOrder|place-reality-order/);
  assert.match(source, /BLOCKED_UNTIL_SINGLE_USE_RECEIPT_STORE/);
});

test("receipt verification requires both signature and unexpired authorization", async () => {
  const secret = "SIGNAL_AUTOPSY_DEMO_SECRET";
  const payload = { expiresAt: "2020-01-01T00:00:00.000Z", market: { symbol: "rAAPLUSDT" } };
  const req = { method: "POST", body: { payload, signature: signReceipt(payload, secret) } };
  const res = responseCapture();
  await verifyHandler(req, res);
  assert.equal(res.body.signatureValid, true);
  assert.equal(res.body.expiryValid, false);
  assert.equal(res.body.valid, false);
});
