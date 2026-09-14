import test from "node:test";
import assert from "node:assert/strict";
import { receiptSigningConfig } from "../lib/signing.js";

test("signing config labels the built-in key as DEMO", () => {
  const saved = process.env.RECEIPT_SIGNING_SECRET;
  delete process.env.RECEIPT_SIGNING_SECRET;
  try {
    assert.equal(receiptSigningConfig().status, "DEMO");
  } finally {
    if (saved === undefined) delete process.env.RECEIPT_SIGNING_SECRET;
    else process.env.RECEIPT_SIGNING_SECRET = saved;
  }
});

test("signing config rejects weak configured secrets", () => {
  const saved = process.env.RECEIPT_SIGNING_SECRET;
  process.env.RECEIPT_SIGNING_SECRET = "too-short";
  try {
    assert.throws(() => receiptSigningConfig(), /at least 32/);
  } finally {
    if (saved === undefined) delete process.env.RECEIPT_SIGNING_SECRET;
    else process.env.RECEIPT_SIGNING_SECRET = saved;
  }
});
