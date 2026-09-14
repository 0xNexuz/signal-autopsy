import { allowMethods, handleError, json, readJson } from "../lib/http.js";
import { verifyReceipt } from "../lib/risk-engine.js";
import { receiptSigningConfig } from "../lib/signing.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;
  try {
    const receipt = await readJson(req);
    const signing = receiptSigningConfig();
    const signatureValid = verifyReceipt(receipt, signing.secret);
    const expiresAt = Date.parse(receipt?.payload?.expiresAt);
    const expiryValid = Number.isFinite(expiresAt) && expiresAt > Date.now();
    return json(res, 200, {
      valid: signatureValid && expiryValid,
      signatureValid,
      expiryValid,
      signatureStatus: signing.status
    });
  } catch (error) {
    return handleError(res, error);
  }
}
