import { allowMethods, handleError, json, readJson } from "../lib/http.js";
import { getRealityMarket } from "../lib/reality-market.js";
import { evaluateIntervention, signReceipt, verifyReceipt } from "../lib/risk-engine.js";
import { receiptSigningConfig } from "../lib/signing.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;
  try {
    const { receipt } = await readJson(req);
    const signing = receiptSigningConfig();
    if (!verifyReceipt(receipt, signing.secret)) {
      return json(res, 403, { error: "INVALID_SIGNATURE", message: "Receipt signature is invalid." });
    }
    const market = await getRealityMarket(receipt.payload?.market?.symbol);
    const evaluation = {
      receiptId: receipt.payload.receiptId,
      ...evaluateIntervention(receipt.payload, { price: market.price, observedAt: market.observedAt }),
      outcomeEvidence: {
        status: "REAL",
        source: market.sources.ticker.provider,
        symbol: market.symbol,
        price: market.price,
        observedAt: market.observedAt
      }
    };
    return json(res, 200, {
      status: "REAL",
      evaluation,
      signature: signReceipt(evaluation, signing.secret),
      signatureStatus: signing.status
    });
  } catch (error) {
    return handleError(res, error);
  }
}
