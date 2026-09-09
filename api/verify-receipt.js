import { allowMethods, json, readJson } from "../lib/http.js";
import { verifyReceipt } from "../lib/risk-engine.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;
  const receipt = await readJson(req);
  const secret = process.env.RECEIPT_SIGNING_SECRET || "SIGNAL_AUTOPSY_DEMO_SECRET";
  return json(res, 200, { valid: verifyReceipt(receipt, secret), signatureStatus: process.env.RECEIPT_SIGNING_SECRET ? "REAL" : "DEMO" });
}
