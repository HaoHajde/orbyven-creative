import { createHmac, timingSafeEqual } from "node:crypto";

export type StripeEvent = {
  id: string;
  type: string;
  created?: number;
  data: { object: Record<string, unknown> };
};

function safeEqualHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyStripeWebhook(
  payload: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300
) {
  const parts = signatureHeader.split(",");
  const timestamp = parts
    .find((part) => part.startsWith("t="))
    ?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  if (!timestamp || signatures.length === 0) return false;

  const unix = Number(timestamp);
  if (!Number.isFinite(unix)) return false;
  if (Math.abs(Date.now() / 1000 - unix) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");

  return signatures.some((signature) => safeEqualHex(signature, expected));
}

export function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

export function metadataValue(object: Record<string, unknown>, key: string) {
  const metadata = object.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  return stringValue((metadata as Record<string, unknown>)[key]);
}

export function unixDate(value: unknown) {
  const unix = numberValue(value);
  return unix ? new Date(unix * 1000).toISOString() : null;
}
