import crypto from "node:crypto";

export const ENGINE_VERSION = "s2-rwa-1.0.0";

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value) => Math.round(value * 10) / 10;

export function sessionRisk(isoTime = new Date().toISOString()) {
  const date = new Date(isoTime);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  const minute = Number(parts.hour) * 60 + Number(parts.minute);
  const weekend = parts.weekday === "Sat" || parts.weekday === "Sun";
  if (weekend) return { score: 88, phase: "weekend", status: "REAL" };
  if (minute >= 570 && minute < 960) return { score: 12, phase: "us-regular", status: "REAL" };
  if (minute >= 240 && minute < 1200) return { score: 45, phase: "extended", status: "REAL" };
  return { score: 72, phase: "overnight", status: "REAL" };
}

export function computeRisk(input) {
  const session = input.session?.score ?? sessionRisk(input.observedAt).score;
  const liquidity = clamp(100 - Number(input.depthQuality ?? 45));
  const event = clamp(Number(input.eventRisk ?? 35));
  const volatility = clamp(Number(input.volatilityRisk ?? 40));
  const depthNotional = Math.max(Number(input.depthNotional ?? 0), 1);
  const orderNotional = Math.max(Number(input.orderNotional ?? 0), 0);
  const size = clamp((orderNotional / depthNotional) * 500);
  const confidence = clamp(Number(input.confidence ?? 50));
  const evidenceQuality = clamp(Number(input.evidenceQuality ?? 50));
  const overconfidence = clamp(confidence - evidenceQuality + 35);

  const components = {
    session: round(session),
    liquidity: round(liquidity),
    event: round(event),
    volatility: round(volatility),
    size: round(size),
    overconfidence: round(overconfidence)
  };
  const weights = { session: 0.14, liquidity: 0.2, event: 0.16, volatility: 0.18, size: 0.18, overconfidence: 0.14 };
  const score = round(Object.entries(weights).reduce((sum, [key, weight]) => sum + components[key] * weight, 0));
  const route = score >= 72 ? "BLOCK" : score >= 56 ? "PAPER_ONLY" : score >= 38 ? "CLAMP" : "ALLOW";
  const maxNotional = route === "BLOCK" ? 0 : round(orderNotional * (route === "PAPER_ONLY" ? 0 : route === "CLAMP" ? 0.35 : 1));

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
  const body = canonicalize(payload);
  return crypto.createHmac("sha256", secret).update(body).digest("base64url");
}

export function verifyReceipt(receipt, secret) {
  if (!receipt?.payload || !receipt?.signature) return false;
  const expected = signReceipt(receipt.payload, secret);
  const left = Buffer.from(expected);
  const right = Buffer.from(receipt.signature);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function receiptId(payload) {
  return crypto.createHash("sha256").update(canonicalize(payload)).digest("hex").slice(0, 24);
}

export function evaluateIntervention(receiptPayload, outcome) {
  const entry = Number(receiptPayload.market?.price ?? 0);
  const exit = Number(outcome.price ?? 0);
  if (!entry || !exit) throw new Error("Entry and outcome prices are required");
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
