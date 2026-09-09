import { allowMethods, json, readJson } from "../lib/http.js";
import { evaluateIntervention, signReceipt, verifyReceipt } from "../lib/risk-engine.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;
  const { receipt, outcome } = await readJson(req);
  const secret = process.env.RECEIPT_SIGNING_SECRET || "SIGNAL_AUTOPSY_DEMO_SECRET";
  if (!verifyReceipt(receipt, secret)) return json(res, 403, { error: "Receipt signature is invalid" });
  try {
    const evaluation = { receiptId: receipt.payload.receiptId, ...evaluateIntervention(receipt.payload, outcome) };
    return json(res, 200, { status: "REAL", evaluation, signature: signReceipt(evaluation, secret), signatureStatus: process.env.RECEIPT_SIGNING_SECRET ? "REAL" : "DEMO" });
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
}
