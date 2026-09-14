import crypto from "node:crypto";

export const ENGINE_VERSION = "s2-rwa-1.1.0";

const round = (value) => Math.round(value * 10) / 10;

function finiteNumber(value, name, { min = 0, max = 100 } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${name} must be a finite number`);
  if (number < min || number > max) throw new RangeError(`${name} must be between ${min} and ${max}`);
  return number;
}
export function sessionRisk(isoTime = new Date().toISOString()) {
  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) throw new TypeError("observedAt must be a valid ISO timestamp");
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  const minute = Number(parts.hour) * 60 + Number(parts.minute);
  const weekend = parts.weekday === "Sat" || parts.weekday === "Sun";
  const metadata = { status: "SIMULATED", basis: "Weekday/time heuristic; holidays and early closes are not inferred." };
  if (weekend) return { score: 88, phase: "weekend", ...metadata };
  if (minute >= 570 && minute < 960) return { score: 12, phase: "us-regular", ...metadata };
  if (minute >= 240 && minute < 1200) return { score: 45, phase: "extended", ...metadata };
  return { score: 72, phase: "overnight", ...metadata };
}

export function computeRisk(input = {}) {
  const session = finiteNumber(input.session?.score ?? sessionRisk(input.observedAt).score, "session.score");
  const depthQuality = finiteNumber(input.depthQuality ?? 45, "depthQuality");
  const eventRisk = finiteNumber(input.eventRisk ?? 35, "eventRisk");
  const volatilityRisk = finiteNumber(input.volatilityRisk ?? 40, "volatilityRisk");
  const depthNotional = finiteNumber(input.depthNotional ?? 0, "depthNotional", { min: 0, max: 1_000_000_000 });
  const orderNotional = finiteNumber(input.orderNotional ?? 0, "orderNotional", { min: 0.01, max: 1_000_000 });
  const confidence = finiteNumber(input.confidence ?? 50, "confidence");
  const evidenceQuality = finiteNumber(input.evidenceQuality ?? 50, "evidenceQuality");

  const components = {
    session: round(session),
    liquidity: round(100 - depthQuality),
    event: round(eventRisk),
    volatility: round(volatilityRisk),
    size: round(Math.min(100, (orderNotional / Math.max(depthNotional, 1)) * 500)),
    overconfidence: round(Math.min(100, Math.max(0, confidence - evidenceQuality + 35)))
  };
  const weights = { session: 0.14, liquidity: 0.2, event: 0.16, volatility: 0.18, size: 0.18, overconfidence: 0.14 };
  const score = round(Object.entries(weights).reduce((sum, [key, weight]) => sum + components[key] * weight, 0));
  const route = score >= 72 ? "BLOCK" : score >= 56 ? "PAPER_ONLY" : score >= 38 ? "CLAMP" : "ALLOW";
  const maxNotional = route === "BLOCK" || route === "PAPER_ONLY" ? 0 : round(orderNotional * (route === "CLAMP" ? 0.35 : 1));

  return {
    engineVersion: ENGINE_VERSION,
    score,
    route,
    components,
    weights,
    authorization: {
      executable: route === "ALLOW" || route === "CLAMP",
      environment: route === "ALLOW" || route === "CLAMP" ? "SIMULATED" : "DENIED",
      maxNotional,
      expiresInSeconds: route === "ALLOW" ? 300 : route === "CLAMP" ? 120 : 0
    }
  };
}

export function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function signReceipt(payload, secret) {
  if (typeof secret !== "string" || !secret) throw new TypeError("Signing secret is required");
  return crypto.createHmac("sha256", secret).update(canonicalize(payload)).digest("base64url");
}

export function verifyReceipt(receipt, secret) {
  if (!receipt?.payload || typeof receipt?.signature !== "string") return false;
  const expected = signReceipt(receipt.payload, secret);
  const left = Buffer.from(expected);
  const right = Buffer.from(receipt.signature);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function receiptId(payload) {
  return crypto.createHash("sha256").update(canonicalize(payload)).digest("hex").slice(0, 24);
}

export function evaluateIntervention(receiptPayload, outcome) {
  const entry = finiteNumber(receiptPayload.market?.price, "entry price", { min: 0.000001, max: 1_000_000_000 });
  const exit = finiteNumber(outcome?.price, "outcome price", { min: 0.000001, max: 1_000_000_000 });
  const side = receiptPayload.intent?.side === "sell" ? -1 : 1;
  const returnPct = ((exit - entry) / entry) * 100 * side;
  const intervened = receiptPayload.decision.route !== "ALLOW";
  let verdict = "INCONCLUSIVE";
  if (intervened && returnPct <= -1) verdict = "CORRECT_INTERVENTION";
  else if (intervened && returnPct >= 1) verdict = "FALSE_POSITIVE";
  else if (!intervened && returnPct >= 0.5) verdict = "CORRECT_PASS";
  else if (!intervened && returnPct <= -1) verdict = "MISSED_RISK";
  return { verdict, intervened, returnPct: round(returnPct), evaluatedAt: outcome.observedAt || new Date().toISOString() };
}
