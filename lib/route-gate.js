import { verifyReceipt } from "./risk-engine.js";

const money = (value) => Math.round(Number(value) * 100) / 100;

export function inspectRouteGate({ receipt, order, secret, now = Date.now() }) {
  if (!verifyReceipt(receipt, secret)) return { allowed: false, code: "INVALID_SIGNATURE", reason: "Receipt signature could not be verified." };
  const payload = receipt.payload;
  if (Date.parse(payload.expiresAt) <= now) return { allowed: false, code: "EXPIRED_RECEIPT", reason: "The authorization window has expired." };
  if (payload.market.symbol.toUpperCase() !== String(order.symbol || "").toUpperCase()) return { allowed: false, code: "SYMBOL_MISMATCH", reason: "Order symbol does not match the autopsy." };
  if (payload.intent.side !== order.side) return { allowed: false, code: "SIDE_MISMATCH", reason: "Order side does not match the examined intent." };
  const requestedNotional = money(order.notional);
  const authorizedNotional = money(payload.decision.authorization.maxNotional);
  if (!Number.isFinite(requestedNotional) || requestedNotional <= 0) return { allowed: false, code: "INVALID_SIZE", reason: "Order notional must be positive." };
  if (["BLOCK", "PAPER_ONLY"].includes(payload.decision.route)) return { allowed: false, code: payload.decision.route, reason: "The deterministic route decision denies execution." };
  if (requestedNotional > authorizedNotional) return { allowed: false, code: "SIZE_EXCEEDS_AUTHORIZATION", reason: `Requested ${requestedNotional} USDT exceeds the signed cap of ${authorizedNotional} USDT.` };
  return { allowed: true, code: payload.decision.route, reason: "Signature, expiry, symbol, side, and size checks passed.", authorizedNotional };
}
