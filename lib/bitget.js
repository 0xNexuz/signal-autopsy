import crypto from "node:crypto";

const BASE_URL = process.env.BITGET_BASE_URL || "https://api.bitget.com";

function privateKey() {
  return (process.env.BITGET_RSA_PRIVATE_KEY || "").replace(/\\n/g, "\n");
}

function passphrase() {
  return process.env.BITGET_PASSPHRASE || process.env.BITGET_API_PASSPHRASE || "";
}

function signature(prehash) {
  const rsaKey = privateKey();
  if (rsaKey) return crypto.sign("RSA-SHA256", Buffer.from(prehash), rsaKey).toString("base64");
  if (!process.env.BITGET_SECRET_KEY && !process.env.BITGET_API_SECRET) throw new Error("Bitget signing key is not configured");
  return crypto.createHmac("sha256", process.env.BITGET_SECRET_KEY || process.env.BITGET_API_SECRET).update(prehash).digest("base64");
}

export async function bitgetRequest(path, { method = "GET", query = {}, body } = {}) {
  const queryString = new URLSearchParams(
    Object.entries(query)
      .filter(([, value]) => value !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
  ).toString();
  const requestPath = queryString ? `${path}?${queryString}` : path;
  const bodyText = body ? JSON.stringify(body) : "";
  const headers = { "Content-Type": "application/json", locale: "en-US" };
  const authenticated = Boolean(process.env.BITGET_API_KEY && passphrase() && (privateKey() || process.env.BITGET_SECRET_KEY || process.env.BITGET_API_SECRET));
  if (authenticated) {
    const timestamp = Date.now().toString();
    headers["ACCESS-KEY"] = process.env.BITGET_API_KEY;
    headers["ACCESS-PASSPHRASE"] = passphrase();
    headers["ACCESS-TIMESTAMP"] = timestamp;
    headers["ACCESS-SIGN"] = signature(timestamp + method.toUpperCase() + requestPath + bodyText);
  }
  const response = await fetch(BASE_URL + requestPath, { method, headers, body: bodyText || undefined, signal: AbortSignal.timeout(12000) });
  const data = await response.json();
  if (!response.ok || data.code !== "00000") throw new Error(data.msg || `Bitget request failed (${response.status})`);
  return { data: data.data, authenticated };
}

export async function placeRealityOrder(order) {
  if (!process.env.BITGET_API_KEY) throw new Error("Bitget credentials are not configured");
  return bitgetRequest("/api/v3/trade/place-reality-order", { method: "POST", body: order });
}

export function hasBitgetCredentials() {
  return Boolean(process.env.BITGET_API_KEY && passphrase() && (privateKey() || process.env.BITGET_SECRET_KEY || process.env.BITGET_API_SECRET));
}
