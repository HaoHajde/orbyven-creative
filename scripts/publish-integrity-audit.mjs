import { readFileSync } from "node:fs";
import { join } from "node:path";

const reportPath = join(process.cwd(), ".orbyven-integrity", "report.json");
const endpoint = process.env.ORBYVEN_INTEGRITY_INGEST_URL?.trim() ?? "";
const secret = process.env.ORBYVEN_INTEGRITY_INGEST_SECRET?.trim() ?? "";

if (!endpoint || !secret) {
  throw new Error(
    "ORBYVEN_INTEGRITY_INGEST_URL and ORBYVEN_INTEGRITY_INGEST_SECRET are required."
  );
}

const url = new URL(endpoint);
if (url.protocol !== "https:") {
  throw new Error("Integrity ingest endpoint must use HTTPS.");
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));

const response = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Orbyven-Integrity-Secret": secret,
    "User-Agent": "orbyven-integrity-audit/1.0",
  },
  body: JSON.stringify(report),
  redirect: "error",
  signal: AbortSignal.timeout(30_000),
});

if (!response.ok) {
  throw new Error(`Integrity ingest returned HTTP ${response.status}.`);
}

console.log(`[integrity] published run=${report.run_key} status=${report.status}`);
