import { verifyReceipt } from "./risk-engine.js";

const REALITY_SYMBOL = /^R[A-Z0-9]{1,20}USDT$/;
const ROUTES = new Set(["ALLOW", "CLAMP", "PAPER_ONLY", "BLOCK"]);
const deny = (code, reason) => ({ allowed: false, code, reason });
const money = (value) => Math.round(Number(value) * 100) / 100;

export function inspectRouteGate({ receipt, order, secret, now = Date.now() } = {}) {
  if (!verifyReceipt(receipt, secret)) return deny("INVALID_SIGNATURE", "Receipt signature could not be verified.");
  const payload = receipt.payload;
  const expiresAt = Date.parse(payload?.expiresAt);
  if (!Number.isFinite(expiresAt)) return deny("INVALID_EXPIRY", "Receipt expiry is missing or invalid.");
  if (expiresAt <= now) return deny("EXPIRED_RECEIPT", "The authorization window has expired.");

  const receiptSymbol = String(payload?.market?.symbol || "").toUpperCase();
  const orderSymbol = String(order?.symbol || "").toUpperCase();
  if (!REALITY_SYMBOL.test(receiptSymbol) || !REALITY_SYMBOL.test(orderSymbol)) return deny("INVALID_SYMBOL", "A valid Bitget Reality symbol is required.");
  if (receiptSymbol !== orderSymbol) return deny("SYMBOL_MISMATCH", "Order symbol does not match the autopsy.");

  const receiptSide = String(payload?.intent?.side || "").toLowerCase();
  const orderSide = String(order?.side || "").toLowerCase();
  if (!["buy", "sell"].includes(receiptSide) || !["buy", "sell"].includes(orderSide)) return deny("INVALID_SIDE", "Order side must be buy or sell.");
  if (receiptSide !== orderSide) return deny("SIDE_MISMATCH", "Order side does not match the examined intent.");

  const route = payload?.decision?.route;
  if (!ROUTES.has(route)) return deny("INVALID_ROUTE", "Receipt contains an unknown route.");
  const requestedNotional = money(order?.notional);
  const authorizedNotional = money(payload?.decision?.authorization?.maxNotional);
  if (!Number.isFinite(requestedNotional) || requestedNotional <= 0) return deny("INVALID_SIZE", "Order notional must be positive.");
  if (!Number.isFinite(authorizedNotional) || authorizedNotional < 0) return deny("INVALID_AUTHORIZATION", "Signed notional cap is invalid.");
  if (["BLOCK", "PAPER_ONLY"].includes(route)) return deny(route, "The deterministic route decision denies execution.");
  if (requestedNotional > authorizedNotional) return deny("SIZE_EXCEEDS_AUTHORIZATION", `Requested ${requestedNotional} USDT exceeds the signed cap of ${authorizedNotional} USDT.`);

  return {
    allowed: true,
    code: route,
    reason: "Signature, expiry, symbol, side, route, and notional checks passed.",
    authorizedNotional
  };
}
