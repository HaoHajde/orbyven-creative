import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const OUTPUT_DIR = join(process.cwd(), ".orbyven-integrity");
const JSON_PATH = join(OUTPUT_DIR, "report.json");
const MARKDOWN_PATH = join(OUTPUT_DIR, "report.md");
const MAX_CAPTURE = 24_000;

const suites = [
  {
    category: "code",
    label: "Lint",
    command: "npm",
    args: ["run", "lint"],
    severity: "medium",
    ai: true,
  },
  {
    category: "code",
    label: "TypeScript",
    command: "npm",
    args: ["run", "typecheck"],
    severity: "high",
    ai: true,
  },
  {
    category: "code",
    label: "Architecture integrity",
    command: "npm",
    args: ["run", "test:architecture"],
    severity: "high",
    ai: true,
  },
  {
    category: "code",
    label: "Production build",
    command: "npm",
    args: ["run", "build"],
    severity: "high",
    ai: true,
  },
  {
    category: "security",
    label: "Security suite",
    command: "npm",
    args: ["run", "test:security"],
    severity: "critical",
    ai: true,
  },
  {
    category: "security",
    label: "Production dependency vulnerabilities",
    command: "npm",
    args: ["audit", "--omit=dev", "--audit-level=high"],
    severity: "high",
    ai: true,
  },
  {
    category: "seo",
    label: "SEO contract",
    command: "npm",
    args: ["run", "test:seo"],
    severity: "medium",
    ai: true,
  },
  {
    category: "legal",
    label: "Legal & compliance contract",
    command: "npm",
    args: ["run", "test:compliance"],
    severity: "high",
    ai: false,
  },
];

function nowIso() {
  return new Date().toISOString();
}

function truncate(value, limit = MAX_CAPTURE) {
  if (!value) return "";
  const text = String(value);
  return text.length > limit ? `${text.slice(-limit)}\n[output truncated]` : text;
}

function redact(value) {
  let text = truncate(value);
  const secretValues = [
    process.env.ORBYVEN_INTEGRITY_INGEST_SECRET,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.OPENAI_API_KEY,
    process.env.VERCEL_TOKEN,
  ].filter((entry) => typeof entry === "string" && entry.length >= 8);

  for (const secret of secretValues) {
    text = text.split(secret).join("[REDACTED]");
  }

  return text
    .replace(/(service[_-]?role|api[_-]?key|secret|token|password)\s*[:=]\s*[^\s]+/gi, "$1=[REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, "Bearer [REDACTED]");
}

function runSuite(suite) {
  const started = Date.now();
  const result = spawnSync(suite.command, suite.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 8 * 1024 * 1024,
    timeout: 20 * 60 * 1000,
  });
  const durationMs = Date.now() - started;
  const signal = result.signal ? String(result.signal) : null;
  const exitCode = typeof result.status === "number" ? result.status : 1;
  const output = redact(`${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim());
  const passed = exitCode === 0 && !signal && !result.error;

  return {
    ...suite,
    passed,
    exitCode,
    signal,
    durationMs,
    output,
    error: result.error ? redact(result.error.message) : null,
  };
}

function fingerprint(result) {
  return createHash("sha256")
    .update(`${result.category}:${result.label}:${result.command}:${result.args.join(" ")}`)
    .digest("hex")
    .slice(0, 32);
}

function categoryScore(results, category) {
  const categoryResults = results.filter((result) => result.category === category);
  if (categoryResults.length === 0) return 100;
  const passed = categoryResults.filter((result) => result.passed).length;
  return Math.round((passed / categoryResults.length) * 100);
}

function statusFromScores(scores) {
  if (scores.code < 100 || scores.security < 100) return "failed";
  if (scores.seo < 100 || scores.legal < 100) return "warning";
  return "passed";
}

function manualAction(result) {
  if (result.category === "legal") {
    return "Revizuiește constatarea juridică/compliance și confirmă manual măsura înainte de orice modificare cu efect juridic.";
  }
  return null;
}

function aiAction(result) {
  if (!result.ai) return null;
  return `Guardian poate investiga eșecul suitei „${result.label}”, poate pregăti o remediere pe branch separat și poate deschide un PR. Nu are voie să facă auto-merge sau write direct în producție.`;
}

function buildMarkdown({ runKey, startedAt, finishedAt, source, branch, commitSha, status, scores, overallScore, results }) {
  const lines = [
    "# ORBYVEN Integrity Audit",
    "",
    `- Run: \`${runKey}\``,
    `- Source: \`${source}\``,
    `- Status: **${status.toUpperCase()}**`,
    `- Started: ${startedAt}`,
    `- Finished: ${finishedAt}`,
    `- Branch: \`${branch ?? "unknown"}\``,
    `- Commit: \`${commitSha ?? "unknown"}\``,
    `- Overall score: **${overallScore}/100**`,
    "",
    "## Category scores",
    "",
    `- Code: ${scores.code}/100`,
    `- Security: ${scores.security}/100`,
    `- SEO: ${scores.seo}/100`,
    `- Legal/compliance: ${scores.legal}/100`,
    "",
    "> Legal scope: this automated check validates ORBYVEN's repository compliance controls and tests. It does not replace review by a qualified lawyer or automatically detect every change in applicable law.",
    "",
    "## Detailed checks",
    "",
  ];

  for (const result of results) {
    lines.push(
      `### ${result.passed ? "PASS" : "FAIL"} — ${result.label}`,
      "",
      `Category: \`${result.category}\`  `,
      `Command: \`${result.command} ${result.args.join(" ")}\`  `,
      `Duration: ${Math.round(result.durationMs / 1000)}s  `,
      `Exit: ${result.exitCode}${result.signal ? ` / signal ${result.signal}` : ""}`,
      ""
    );

    if (!result.passed) {
      lines.push("```text", result.output || result.error || "No diagnostic output.", "```", "");
    }
  }

  lines.push(
    "## Execution policy",
    "",
    "- Human owner is the only Control Center identity allowed to approve integrity actions.",
    "- ORBYVEN Guardian may prepare fixes only on a separate branch and PR.",
    "- Automatic merge is disabled.",
    "- Direct production writes are disabled.",
    ""
  );

  return lines.join("\n");
}

mkdirSync(OUTPUT_DIR, { recursive: true });
const startedAt = nowIso();
const results = [];

for (const suite of suites) {
  console.log(`[integrity] ${suite.category}: ${suite.label}`);
  const result = runSuite(suite);
  results.push(result);
  console.log(`[integrity] ${result.passed ? "PASS" : "FAIL"} ${suite.label} (${Math.round(result.durationMs / 1000)}s)`);
}

const finishedAt = nowIso();
const scores = {
  code: categoryScore(results, "code"),
  security: categoryScore(results, "security"),
  seo: categoryScore(results, "seo"),
  legal: categoryScore(results, "legal"),
};
const overallScore = Math.round(
  scores.code * 0.35 + scores.security * 0.35 + scores.seo * 0.15 + scores.legal * 0.15
);
const status = statusFromScores(scores);
const source = ["scheduled", "manual", "ci"].includes(process.env.INTEGRITY_SOURCE ?? "")
  ? process.env.INTEGRITY_SOURCE
  : "ci";
const branch = process.env.GITHUB_REF_NAME || process.env.INTEGRITY_BRANCH || null;
const commitSha = process.env.GITHUB_SHA || process.env.INTEGRITY_COMMIT_SHA || null;
const runKey = `${finishedAt.slice(0, 10)}-${process.env.GITHUB_RUN_ID || randomUUID()}`;

const failedResults = results.filter((result) => !result.passed);
const findings = failedResults.map((result) => ({
  fingerprint: fingerprint(result),
  category: result.category,
  severity: result.severity,
  title: `${result.label} failed`,
  summary: `${result.label} a eșuat cu exit code ${result.exitCode}. Verifică raportul tehnic pentru dovada completă.`,
  evidence: result.output || result.error || "No diagnostic output.",
  manual_action: manualAction(result),
  ai_action: aiAction(result),
  can_ai_execute: result.ai,
  requires_human: result.category === "legal",
}));

const summary =
  failedResults.length === 0
    ? "Toate verificările automate de integritate au trecut."
    : `${failedResults.length} verificări necesită atenție: ${failedResults.map((result) => result.label).join(", ")}.`;

const reportMarkdown = buildMarkdown({
  runKey,
  startedAt,
  finishedAt,
  source,
  branch,
  commitSha,
  status,
  scores,
  overallScore,
  results,
});
const reportSha256 = createHash("sha256").update(reportMarkdown).digest("hex");

const report = {
  run_key: runKey,
  source,
  status,
  branch,
  commit_sha: commitSha,
  started_at: startedAt,
  finished_at: finishedAt,
  overall_score: overallScore,
  category_scores: scores,
  summary,
  report_markdown: reportMarkdown,
  report_sha256: reportSha256,
  findings,
  metadata: {
    runner: "orbyven-integrity-v1",
    check_count: results.length,
    failed_check_count: failedResults.length,
  },
};

writeFileSync(JSON_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(MARKDOWN_PATH, `${reportMarkdown}\n`, "utf8");
console.log(`[integrity] completed status=${status} score=${overallScore} findings=${findings.length}`);
console.log(`[integrity] report_json=${JSON_PATH}`);
