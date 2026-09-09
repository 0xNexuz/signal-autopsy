import { allowMethods, json, readJson } from "../lib/http.js";
import { placeRealityOrder } from "../lib/bitget.js";
import { inspectRouteGate } from "../lib/route-gate.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;
  const { receipt, order } = await readJson(req);
  const secret = process.env.RECEIPT_SIGNING_SECRET || "SIGNAL_AUTOPSY_DEMO_SECRET";
  const inspection = inspectRouteGate({ receipt, order, secret });
  if (!inspection.allowed) return json(res, 403, { status: "REAL", execution: "DENIED", inspection });
  const liveArmed = process.env.BITGET_EXECUTION_MODE === "live" && process.env.BITGET_LIVE_ACK === "I_UNDERSTAND_REAL_ORDERS";
  if (!liveArmed) return json(res, 200, { status: "REAL", execution: "SIMULATED", inspection, simulatedOrderId: `sim_${receipt.payload.receiptId}` });
  if (receipt.signatureStatus !== "REAL") return json(res, 403, { status: "REAL", execution: "DENIED", inspection: { allowed: false, code: "DEMO_SIGNATURE", reason: "Live execution requires a server-secret signed receipt." } });
  try {
    const qty = order.side === "buy" ? Number(order.notional) : Number(order.notional) / Number(receipt.payload.market.price);
    const result = await placeRealityOrder({ category: "SPOT", symbol: order.symbol, side: order.side, orderType: order.orderType || "market", qty: String(qty), clientOid: `sa_${receipt.payload.receiptId}` });
    return json(res, 200, { status: "REAL", execution: "REAL", inspection, bitget: result.data });
  } catch (error) {
    return json(res, 502, { status: "REAL", execution: "BLOCKED", error: error.message, inspection });
  }
}
