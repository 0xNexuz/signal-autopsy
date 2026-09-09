import crypto from "node:crypto";
import { allowMethods, json } from "../lib/http.js";
import { bitgetRequest } from "../lib/bitget.js";
import { buildBenchmark } from "../lib/benchmark.js";

const SYMBOLS = ["rAAPLUSDT", "rNVDAUSDT", "rTSLAUSDT", "rMSFTUSDT", "rSPYUSDT", "rQQQUSDT"];
const FROZEN_AS_OF = "2026-09-01T00:00:00.000Z";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["GET"])) return;
  try {
    const endTime = String(Date.parse(FROZEN_AS_OF));
    const pairs = [];
    for (const symbol of SYMBOLS) {
      let response;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          response = await bitgetRequest("/api/v3/market/history-candles", { query: { category: "SPOT", endTime, interval: "1D", limit: "100", symbol, type: "market" } });
          break;
        } catch (error) {
          if (!/too many requests/i.test(error.message) || attempt === 2) throw error;
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        }
      }
      pairs.push([symbol, response.data || []]);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    const report = buildBenchmark(Object.fromEntries(pairs), FROZEN_AS_OF);
    const datasetHash = crypto.createHash("sha256").update(JSON.stringify(pairs)).digest("hex");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
    return json(res, 200, { ...report, datasetHash });
  } catch (error) {
    return json(res, 502, { status: "BLOCKED", marketDataStatus: "BLOCKED", frozenAsOf: FROZEN_AS_OF, error: error.message });
  }
}
