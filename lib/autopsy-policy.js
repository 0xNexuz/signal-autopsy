import { HttpError } from "./http.js";

const REALITY_SYMBOL = /^r[A-Z0-9]{1,20}USDT$/i;
const text = (value, max) => String(value || "").trim().slice(0, max);

function number(value, name, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new HttpError(400, "INVALID_AUTOPSY_INPUT", `${name} must be between ${min} and ${max}.`);
  }
  return parsed;
}

export function validateAutopsyInput(input) {
  const rawSymbol = text(input.market?.symbol, 32);
  if (!REALITY_SYMBOL.test(rawSymbol)) throw new HttpError(400, "INVALID_REALITY_SYMBOL", "A Bitget Reality symbol such as rAAPLUSDT is required.");
  const symbol = rawSymbol ? "r" + rawSymbol.slice(1).toUpperCase() : "";
  const side = text(input.intent?.side, 8).toLowerCase();
  if (!["buy", "sell"].includes(side)) throw new HttpError(400, "INVALID_SIDE", "intent.side must be buy or sell.");
  const thesis = text(input.thesis, 2000);
  if (thesis.length < 12) throw new HttpError(400, "INVALID_THESIS", "Thesis must contain at least 12 characters.");
  return {
    symbol,
    intent: {
      side,
      notional: number(input.intent?.notional, "intent.notional", 0.01, 1_000_000),
      strategy: text(input.intent?.strategy, 120) || "Unspecified"
    },
    thesis,
    risk: {
      eventRisk: number(input.risk?.eventRisk, "risk.eventRisk", 0, 100),
      confidence: number(input.risk?.confidence, "risk.confidence", 0, 100),
      evidenceQuality: number(input.risk?.evidenceQuality, "risk.evidenceQuality", 0, 100)
    }
  };
}

export function serverOwnedRiskInput(validated, market) {
  return {
    observedAt: market.observedAt,
    session: market.session,
    depthQuality: market.depthQuality,
    depthNotional: market.depthNotional,
    volatilityRisk: market.volatilityRisk,
    orderNotional: validated.intent.notional,
    ...validated.risk
  };
}

function stringList(value) {
  return Array.isArray(value) ? value.slice(0, 4).map((item) => text(item, 300)).filter(Boolean) : [];
}

export function sanitizeExaminer(examiner) {
  if (!examiner || typeof examiner !== "object") return null;
  const examination = examiner.examination || {};
  return {
    status: ["REAL", "DEMO", "BLOCKED"].includes(examiner.status) ? examiner.status : "BLOCKED",
    provider: text(examiner.provider, 100) || "Unavailable",
    advisoryOnly: true,
    examination: {
      strongestCountercase: text(examination.strongestCountercase, 800),
      hiddenAssumptions: stringList(examination.hiddenAssumptions),
      evidenceRequests: stringList(examination.evidenceRequests),
      confidenceChallenge: Number.isFinite(Number(examination.confidenceChallenge))
        ? Math.max(0, Math.min(100, Number(examination.confidenceChallenge)))
        : 50
    }
  };
}
