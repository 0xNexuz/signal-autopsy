import crypto from "node:crypto";
import fs from "node:fs/promises";
import { bitgetRequest } from "../lib/bitget.js";
import { buildBenchmark } from "../lib/benchmark.js";

const symbols = ["rAAPLUSDT", "rNVDAUSDT", "rTSLAUSDT", "rMSFTUSDT", "rSPYUSDT", "rQQQUSDT"];
const frozenAsOf = "2026-09-01T00:00:00.000Z";
const pairs = [];

for (const symbol of symbols) {
  let response;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      response = await bitgetRequest("/api/v3/market/history-candles", { query: { category: "SPOT", endTime: String(Date.parse(frozenAsOf)), interval: "1D", limit: "100", symbol, type: "market" } });
      break;
    } catch (error) {
      if (!/too many requests/i.test(error.message) || attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  pairs.push([symbol, response.data || []]);
  await new Promise((resolve) => setTimeout(resolve, 250));
}

const report = buildBenchmark(Object.fromEntries(pairs), frozenAsOf);
report.datasetHash = crypto.createHash("sha256").update(JSON.stringify(pairs)).digest("hex");
await fs.mkdir(new URL("../data/", import.meta.url), { recursive: true });
await fs.writeFile(new URL("../data/benchmark-report.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ scenarios: report.scenarios, metrics: report.metrics, datasetHash: report.datasetHash }, null, 2));
