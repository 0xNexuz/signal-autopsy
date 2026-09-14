export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}
export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(body));
}

function assertObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "INVALID_JSON_BODY", "Request body must be a JSON object.");
  }
  return value;
}

export async function readJson(req, { maxBytes = 32 * 1024 } = {}) {
  if (req.body !== undefined && req.body !== null) {
    const value = typeof req.body === "string" ? parseJson(req.body) : req.body;
    if (Buffer.byteLength(JSON.stringify(value), "utf8") > maxBytes) {
      throw new HttpError(413, "BODY_TOO_LARGE", `Request body exceeds ${maxBytes} bytes.`);
    }
    return assertObject(value);
  }

  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > maxBytes) throw new HttpError(413, "BODY_TOO_LARGE", `Request body exceeds ${maxBytes} bytes.`);
    chunks.push(buffer);
  }
  return assertObject(chunks.length ? parseJson(Buffer.concat(chunks).toString("utf8")) : {});
}

function parseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "MALFORMED_JSON", "Request body is not valid JSON.");
  }
}

export function handleError(res, error) {
  const status = Number.isInteger(error?.status) ? error.status : 500;
  const code = error?.code || (status >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR");
  return json(res, status, { error: code, message: status >= 500 ? "The request could not be completed." : error.message });
}

export function allowMethods(req, res, methods) {
  if (methods.includes(req.method)) return true;
  res.setHeader("Allow", methods.join(", "));
  json(res, 405, { error: "METHOD_NOT_ALLOWED", message: "Method not allowed." });
  return false;
}
