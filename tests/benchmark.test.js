import test from "node:test";
import assert from "node:assert/strict";
import { buildBenchmark } from "../lib/benchmark.js";

function candles(offset) {
  return Array.from({ length: 31 }, (_, index) => {
    const close = 100 + offset + index * 0.4 + (index % 4 === 0 ? -2 : 1);
    return [String(Date.UTC(2026, 0, index + 1)), String(close - 1), String(close + 2), String(close - 2), String(close), "1000", "100000"];
  });
}

test("frozen benchmark is deterministic and applies no more exposure than agent-alone", () => {
  const input = { rAAPLUSDT: candles(0), rNVDAUSDT: candles(20) };
  const first = buildBenchmark(input, "2026-09-01T00:00:00.000Z");
  const second = buildBenchmark(input, "2026-09-01T00:00:00.000Z");
  assert.deepEqual(first, second);
  assert.ok(first.scenarios > 0);
  first.cases.forEach((scenario) => assert.ok(Math.abs(scenario.harnessReturnPercent) <= Math.abs(scenario.agentReturnPercent)));
});
