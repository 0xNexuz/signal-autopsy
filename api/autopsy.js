import { allowMethods, json, readJson } from "../lib/http.js";
import { computeRisk, receiptId, signReceipt } from "../lib/risk-engine.js";

const signingConfig = () => process.env.RECEIPT_SIGNING_SECRET
  ? { secret: process.env.RECEIPT_SIGNING_SECRET, status: "REAL" }
  : { secret: "SIGNAL_AUTOPSY_DEMO_SECRET", status: "DEMO" };

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;
  const input = await readJson(req);
  if (!input.market?.symbol || !input.intent?.side) return json(res, 400, { error: "market.symbol and intent.side are required" });
  const decision = computeRisk({ ...input.risk, observedAt: input.market.observedAt, session: input.market.session });
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + Math.max(decision.authorization.expiresInSeconds, 300) * 1000).toISOString();
  const payload = { schema: "signal-autopsy-receipt/v1", issuedAt, expiresAt, market: input.market, intent: input.intent, thesis: input.thesis, decision, examiner: input.examiner || null };
  payload.receiptId = receiptId(payload);
  const signing = signingConfig();
  return json(res, 200, { status: "REAL", receipt: { payload, signature: signReceipt(payload, signing.secret), signatureStatus: signing.status, algorithm: "HMAC-SHA256" } });
}
