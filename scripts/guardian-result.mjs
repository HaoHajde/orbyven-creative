import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const endpoint = process.env.ORBYVEN_GUARDIAN_RESULT_URL?.trim() ?? "";
const secret = process.env.ORBYVEN_GUARDIAN_WORKER_SECRET?.trim() ?? "";
const workDir =
  process.env.GUARDIAN_WORK_DIR?.trim() || join(process.cwd(), ".orbyven-guardian");
const status = process.env.GUARDIAN_RESULT_STATUS?.trim() ?? "";
const branchName = process.env.GUARDIAN_BRANCH_NAME?.trim() ?? "";
const prUrl = process.env.GUARDIAN_PR_URL?.trim() ?? "";

if (!endpoint || !secret) {
  throw new Error(
    "ORBYVEN_GUARDIAN_RESULT_URL and ORBYVEN_GUARDIAN_WORKER_SECRET are required."
  );
}
if (status !== "waiting_approval" && status !== "failed") {
  throw new Error("GUARDIAN_RESULT_STATUS must be waiting_approval or failed.");
}

const url = new URL(endpoint);
if (url.protocol !== "https:") {
  throw new Error("Guardian result endpoint must use HTTPS.");
}

const job = JSON.parse(readFileSync(join(workDir, "job.json"), "utf8"));
const actionId = typeof job.action_id === "string" ? job.action_id : "";
if (!/^[0-9a-f-]{36}$/i.test(actionId)) {
  throw new Error("Invalid Guardian action ID in job metadata.");
}

const outputPath = join(workDir, "codex-output.txt");
const codexSummary = existsSync(outputPath)
  ? readFileSync(outputPath, "utf8").trim().slice(0, 6_000)
  : "";
const fallbackSummary =
  process.env.GUARDIAN_RESULT_SUMMARY?.trim().slice(0, 6_000) ||
  (status === "waiting_approval"
    ? "Guardian prepared a validated draft pull request for owner review."
    : "Guardian could not prepare a validated pull request. Inspect the workflow run for diagnostics.");

const body = {
  action_id: actionId,
  status,
  branch_name: status === "waiting_approval" ? branchName : null,
  pr_url: status === "waiting_approval" ? prUrl : null,
  result_summary: codexSummary || fallbackSummary,
};

const response = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Orbyven-Guardian-Secret": secret,
    "User-Agent": "orbyven-guardian/1.0",
  },
  body: JSON.stringify(body),
  redirect: "error",
  signal: AbortSignal.timeout(30_000),
});

if (!response.ok) {
  throw new Error(`Guardian result endpoint returned HTTP ${response.status}.`);
}

console.log(`[guardian] result published action=${actionId} status=${status}`);
