import { json, allowMethods } from "../lib/http.js";
import { getRealityMarket } from "../lib/reality-market.js";

const SYMBOL = /^r[A-Z0-9.]+USDT$/i;
export default async function handler(req, res) {
  if (!allowMethods(req, res, ["GET"])) return;
  const symbol = String(req.query?.symbol || "rAAPLUSDT");
  if (!SYMBOL.test(symbol)) return json(res, 400, { error: "A Reality symbol such as rAAPLUSDT is required." });
  try {
    return json(res, 200, { status: "REAL", stack: { agentHub: "REAL", utaV3: "REAL" }, market: await getRealityMarket(symbol) });
  } catch (error) {
    return json(res, 502, { status: "BLOCKED", error: error.message });
  }
}
