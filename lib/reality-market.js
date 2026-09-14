import { BitgetRestClient, buildTools, loadConfig, safeInvoke } from "@bitget-ai/bitget-agent-sdk";
import { bitgetRequest, hasBitgetCredentials } from "./bitget.js";
import { sessionRisk } from "./risk-engine.js";

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value, digits = 2) => Number(Number(value).toFixed(digits));
const rows = (value) => Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];
const firstRow = (value) => rows(value)[0] || value?.data || value || {};
const candleRows = (value) => Array.isArray(value) && Array.isArray(value[0]) ? value : rows(value);

function publicAgentHubConfig() {
  const keys = ["BITGET_API_KEY", "BITGET_SECRET_KEY", "BITGET_PASSPHRASE"];
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  keys.forEach((key) => delete process.env[key]);
  try {
    return loadConfig({ modules: "market", readOnly: true });
  } finally {
    keys.forEach((key) => {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    });
  }
}

function volatilityFromCandles(sourceRows) {
  const closes = sourceRows.map((row) => Number(row[4])).filter((value) => Number.isFinite(value) && value > 0).reverse();
  if (closes.length < 3) throw new Error("Bitget returned insufficient Reality candle history");
  const returns = closes.slice(1).map((close, index) => Math.log(close / closes[index]));
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return round(clamp(Math.sqrt(variance) * Math.sqrt(252) * 185), 1);
}

function depthMetrics(book, price, quoteVolume) {
  const asks = book?.asks || book?.a || [];
  const bids = book?.bids || book?.b || [];
  if (!asks.length || !bids.length) {
    const proxyNotional = Math.max(2500, Math.sqrt(Math.max(quoteVolume, 1)) * 18);
    return {
      quality: round(clamp(Math.log10(proxyNotional) * 14, 22, 74), 1),
      notional: round(proxyNotional),
      status: "SIMULATED",
      basis: "24h quote-volume proxy"
    };
  }
  const notional = [...asks.slice(0, 20), ...bids.slice(0, 20)].reduce((sum, [levelPrice, size]) => sum + Number(levelPrice) * Number(size), 0);
  const ask = Number(asks[0][0]);
  const bid = Number(bids[0][0]);
  const mid = (ask + bid) / 2 || price;
  const spreadBps = mid ? ((ask - bid) / mid) * 10000 : 30;
  return {
    quality: round(clamp(Math.log10(Math.max(notional, 1)) * 14 + 18 - spreadBps * 1.5, 5, 100), 1),
    notional: round(notional),
    status: "REAL",
    basis: "Authenticated Bitget Reality order book"
  };
}

function assertRealityInstrument(value, symbol) {
  const instruments = rows(value?.data ?? value);
  const instrument = instruments.find((item) => String(item.symbol || "").toUpperCase() === symbol.toUpperCase());
  if (!instrument) throw new Error("Bitget did not return the requested Reality instrument");
  const isReality = String(instrument.isReality ?? "").toLowerCase();
  if (!["yes", "true", "1"].includes(isReality)) throw new Error("Requested symbol is not marked as a Bitget Reality instrument");
}

export async function getRealityMarket(rawSymbol) {
  const inputSymbol = String(rawSymbol || "");
  if (!/^r[A-Z0-9]{1,20}USDT$/i.test(inputSymbol)) throw new Error("A valid Bitget Reality symbol is required");
  const symbol = inputSymbol ? "r" + inputSymbol.slice(1).toUpperCase() : "";

  const config = publicAgentHubConfig();
  const client = new BitgetRestClient(config);
  const tools = buildTools(config);
  const market = tools.find((tool) => tool.name === "market");
  if (!market) throw new Error("Agent Hub market intent is unavailable");

  const instrumentResult = await safeInvoke(market, { action: "instruments", category: "SPOT", symbol }, { config, client });
  if (!instrumentResult.ok) throw new Error(instrumentResult.error?.message || "Agent Hub instrument request failed");
  assertRealityInstrument(instrumentResult.data, symbol);

  const result = await safeInvoke(market, { action: "tickers", category: "SPOT", symbol }, { config, client });
  if (!result.ok) throw new Error(result.error?.message || "Agent Hub ticker request failed");
  const ticker = firstRow(result.data);
  const price = Number(ticker.lastPr || ticker.lastPrice || ticker.close || ticker.last || 0);
  if (!Number.isFinite(price) || price <= 0) throw new Error("Bitget returned no valid Reality price");
  const rawChange = Number(ticker.changeUtc24h ?? ticker.change24h ?? 0);
  const drift = Math.abs(rawChange) <= 1 ? rawChange * 100 : rawChange;
  const quoteVolume = Number(ticker.quoteVolume || ticker.usdtVolume || ticker.turnover24h || 0);

  const candles = await bitgetRequest("/api/v3/market/candles", {
    query: { category: "SPOT", interval: "1D", limit: "30", symbol, type: "market" }
  });
  const volatilityRisk = volatilityFromCandles(candleRows(candles.data));

  let book = {};
  if (hasBitgetCredentials()) {
    try {
      const response = await bitgetRequest("/api/v3/account/reality-orderbook", { query: { symbol } });
      book = response.data || {};
    } catch {
      book = {};
    }
  }
  const depth = depthMetrics(book, price, Number.isFinite(quoteVolume) ? quoteVolume : 0);
  const session = sessionRisk();

  return {
    symbol,
    observedAt: new Date().toISOString(),
    price: round(price, 4),
    drift24hPercent: round(Number.isFinite(drift) ? drift : 0),
    quoteVolume: round(Number.isFinite(quoteVolume) ? quoteVolume : 0),
    volatilityRisk,
    depthQuality: depth.quality,
    depthNotional: depth.notional,
    session,
    sources: {
      instrument: { status: "REAL", provider: "Bitget Agent Hub market intent / UTA v3", isReality: true },
      ticker: { status: "REAL", provider: "Bitget Agent Hub market intent / UTA v3" },
      candles: { status: "REAL", provider: "Bitget UTA v3", sampleSize: candleRows(candles.data).length },
      liquidity: { status: depth.status, provider: depth.basis },
      session: { status: "SIMULATED", provider: session.basis }
    }
  };
}
