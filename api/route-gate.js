import { allowMethods, handleError, json, readJson } from "../lib/http.js";
import { inspectRouteGate } from "../lib/route-gate.js";
import { receiptSigningConfig } from "../lib/signing.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;
  try {
    const { receipt, order } = await readJson(req);
    const signing = receiptSigningConfig();
    const inspection = inspectRouteGate({ receipt, order, secret: signing.secret });
    if (!inspection.allowed) return json(res, 403, { status: "REAL", execution: "DENIED", inspection });
    return json(res, 200, {
      status: "REAL",
      execution: "SIMULATED",
      inspection,
      simulatedOrderId: `sim_${receipt.payload.receiptId}`,
      liveSubmission: "BLOCKED_UNTIL_SINGLE_USE_RECEIPT_STORE",
      note: "The machine gate is real. Exchange submission remains disarmed until receipts can be atomically consumed once."
    });
  } catch (error) {
    return handleError(res, error);
  }
}
