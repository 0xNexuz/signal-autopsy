import { allowMethods, handleError, json, readJson } from "../lib/http.js";
import { validateAutopsyInput, sanitizeExaminer, serverOwnedRiskInput } from "../lib/autopsy-policy.js";
import { getRealityMarket } from "../lib/reality-market.js";
import { computeRisk, receiptId, signReceipt } from "../lib/risk-engine.js";
import { receiptSigningConfig } from "../lib/signing.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;
  try {
    const input = await readJson(req);
    const validated = validateAutopsyInput(input);
    const market = await getRealityMarket(validated.symbol);
    const decision = computeRisk(serverOwnedRiskInput(validated, market));
    const issuedAt = new Date().toISOString();
    const ttl = decision.authorization.expiresInSeconds || 300;
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    const payload = {
      schema: "signal-autopsy-receipt/v1",
      issuedAt,
      expiresAt,
      market,
      intent: validated.intent,
      thesis: validated.thesis,
      decision,
      examiner: sanitizeExaminer(input.examiner),
      evidenceOwnership: {
        market: "SERVER_FETCHED",
        agentDeclared: ["eventRisk", "confidence", "evidenceQuality", "strategy", "thesis"]
      }
    };
    payload.receiptId = receiptId(payload);
    const signing = receiptSigningConfig();
    return json(res, 200, {
      status: "REAL",
      receipt: {
        payload,
        signature: signReceipt(payload, signing.secret),
        signatureStatus: signing.status,
        algorithm: "HMAC-SHA256"
      }
    });
  } catch (error) {
    return handleError(res, error);
  }
}
