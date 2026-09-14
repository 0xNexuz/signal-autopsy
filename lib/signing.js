const DEMO_SECRET = "SIGNAL_AUTOPSY_DEMO_SECRET";

export function receiptSigningConfig() {
  const configured = process.env.RECEIPT_SIGNING_SECRET;
  if (!configured) return { secret: DEMO_SECRET, status: "DEMO" };
  if (configured.length < 32) throw new Error("RECEIPT_SIGNING_SECRET must contain at least 32 characters");
  return { secret: configured, status: "REAL" };
}

