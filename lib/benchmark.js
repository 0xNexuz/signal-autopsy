import { computeRisk } from "./risk-engine.js";

const round = (value, digits = 2) => Number(Number(value).toFixed(digits));

function maxDrawdown(returns) {
  var equity = 100;
  var peak = 100;
  var drawdown = 0;
  for (const value of returns) {
    equity *= 1 + value / 100;
    peak = Math.max(peak, equity);
    drawdown = Math.max(drawdown, ((peak - equity) / peak) * 100);
  }
  return round(drawdown);
}

export function buildBenchmark(candleSets, asOf) {
  const scenarios = [];
  Object.entries(candleSets).forEach(([symbol, rawRows], symbolIndex) => {
    const rows = rawRows.slice().sort((left, right) => Number(left[0]) - Number(right[0]));
    for (let index = 20; index < rows.length; index += 5) {
      const history = rows.slice(index - 20, index);
      const entry = Number(rows[index - 1][4]);
      const exit = Number(rows[index][4]);
      const momentum = entry - Number(rows[index - 4][4]);
      const side = momentum >= 0 ? "buy" : "sell";
      const signedReturn = ((exit - entry) / entry) * 100 * (side === "buy" ? 1 : -1);
      const logReturns = history.slice(1).map((row, historyIndex) => Math.log(Number(row[4]) / Number(history[historyIndex][4])));
      const mean = logReturns.reduce((sum, value) => sum + value, 0) / logReturns.length;
      const variance = logReturns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / logReturns.length;
      const volatilityRisk = Math.min(100, Math.sqrt(variance) * Math.sqrt(252) * 185);
      const sequence = scenarios.length + symbolIndex;
      const orderNotional = [400, 1000, 2400][sequence % 3];
      const depthNotional = [6000, 12000, 20000][(sequence + 1) % 3];
      const decision = computeRisk({
        session: { score: [12, 45, 72, 88][sequence % 4] },
        depthQuality: [38, 55, 72][sequence % 3],
        eventRisk: [20, 45, 70][(sequence + 1) % 3],
        volatilityRisk,
        orderNotional,
        depthNotional,
        confidence: [58, 76, 91][sequence % 3],
        evidenceQuality: [48, 62, 74][(sequence + 2) % 3]
      });
      const exposure = decision.route === "ALLOW" ? 1 : decision.route === "CLAMP" ? 0.35 : 0;
      scenarios.push({ symbol, observedAt: new Date(Number(rows[index][0])).toISOString(), side, entry: round(entry, 4), exit: round(exit, 4), agentReturnPercent: round(signedReturn, 4), harnessReturnPercent: round(signedReturn * exposure, 4), route: decision.route, riskScore: decision.score });
    }
  });
  scenarios.sort((left, right) => left.observedAt.localeCompare(right.observedAt) || left.symbol.localeCompare(right.symbol));
  const aloneDrawdown = maxDrawdown(scenarios.map((scenario) => scenario.agentReturnPercent));
  const harnessDrawdown = maxDrawdown(scenarios.map((scenario) => scenario.harnessReturnPercent));
  return {
    schema: "signal-autopsy-benchmark/v1",
    status: "SIMULATED",
    marketDataStatus: "REAL",
    frozenAsOf: asOf,
    method: "Every fifth daily Reality candle after a 20-candle lookback. Agent direction is trailing three-candle momentum. Risk context follows a fixed deterministic matrix; BLOCK and PAPER_ONLY take zero exposure, CLAMP takes 35%, and ALLOW takes 100%.",
    scenarios: scenarios.length,
    metrics: { agentAloneDrawdownPercent: aloneDrawdown, harnessDrawdownPercent: harnessDrawdown, drawdownReductionPoints: round(aloneDrawdown - harnessDrawdown) },
    routes: scenarios.reduce((counts, scenario) => ({ ...counts, [scenario.route]: (counts[scenario.route] || 0) + 1 }), {}),
    cases: scenarios
  };
}
