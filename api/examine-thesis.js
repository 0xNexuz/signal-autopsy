import { allowMethods, json, readJson } from "../lib/http.js";

const clamp = (value) => Math.max(0, Math.min(100, Number(value)));
function demoExamination(input) {
  return {
    strongestCountercase: `The ${input.symbol} thesis may confuse continuous token access with continuous underlying equity liquidity, especially outside the US regular session.`,
    hiddenAssumptions: ["Reality liquidity remains stable around the clock", "The selected event risk captures unscheduled company news", "Agent confidence is calibrated to evidence quality"],
    evidenceRequests: ["Show current session and spread", "Show the last 30 daily returns", "State the price level that invalidates the thesis"],
    confidenceChallenge: clamp((input.confidence || 50) + 8)
  };
}
function parseModelJson(text) {
  const value = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim());
  return {
    strongestCountercase: String(value.strongestCountercase || "No countercase returned."),
    hiddenAssumptions: Array.isArray(value.hiddenAssumptions) ? value.hiddenAssumptions.slice(0, 4).map(String) : [],
    evidenceRequests: Array.isArray(value.evidenceRequests) ? value.evidenceRequests.slice(0, 4).map(String) : [],
    confidenceChallenge: clamp(value.confidenceChallenge || 50)
  };
}

function responseText(body) {
  if (body.output_text) return body.output_text;
  if (body.choices?.[0]?.message?.content) return body.choices[0].message.content;
  for (const item of body.output || []) {
    for (const content of item.content || []) {
      if (content.text) return content.text;
    }
  }
  throw new Error("Qwen response contained no text output");
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;
  const input = await readJson(req);
  if (!input.thesis || !input.symbol) return json(res, 400, { error: "symbol and thesis are required" });
  const hackathonKey = process.env.BITGET_QWEN_API_KEY;
  const apiKey = hackathonKey || process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return json(res, 200, { status: "DEMO", provider: "Deterministic fallback; Qwen key not configured", advisoryOnly: true, examination: demoExamination(input) });
  try {
    const baseUrl = (process.env.QWEN_BASE_URL || (hackathonKey ? "https://hackathon.bitgetops.com/v1" : "https://dashscope-us.aliyuncs.com/compatible-mode/v1")).replace(/\/$/, "");
    const model = process.env.QWEN_MODEL || (hackathonKey ? "qwen3.8-max" : "qwen-plus");
    const system = "You are an adversarial examiner of tokenized-US-equity trade theses. Return only JSON with strongestCountercase (string), hiddenAssumptions (string array), evidenceRequests (string array), confidenceChallenge (0-100). Never authorize or size a trade.";
    const useResponses = hackathonKey || process.env.QWEN_WIRE_API === "responses";
    const requestBody = useResponses
      ? { model, input: [{ role: "system", content: system }, { role: "user", content: JSON.stringify(input) }], temperature: 0.2 }
      : { model, temperature: 0.2, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: JSON.stringify(input) }] };
    const response = await fetch(`${baseUrl}/${useResponses ? "responses" : "chat/completions"}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(18000)
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || "Qwen request failed");
    return json(res, 200, { status: "REAL", provider: model, advisoryOnly: true, examination: parseModelJson(responseText(body)) });
  } catch (error) {
    return json(res, 502, { status: "BLOCKED", advisoryOnly: true, error: error.message, examination: demoExamination(input) });
  }
}
