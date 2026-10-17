import { createHash, timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  IntegrityAction,
  IntegrityFinding,
  IntegrityIngestFinding,
  IntegrityIngestPayload,
  IntegrityPayload,
  IntegrityRun,
} from "@/lib/orbyven-integrity-contracts";
import { ControlCenterHttpError } from "@/lib/orbyven-control-center-server";

const CATEGORY_SET = new Set(["code", "security", "seo", "legal"]);
const SEVERITY_SET = new Set(["info", "low", "medium", "high", "critical"]);
const INGEST_SOURCE_SET = new Set(["scheduled", "manual", "ci"]);
const INGEST_STATUS_SET = new Set(["passed", "warning", "failed", "error"]);
const MAX_FINDINGS = 250;
const MAX_REPORT_LENGTH = 1_500_000;

function requiredString(value: unknown, label: string, maxLength = 500) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    throw new ControlCenterHttpError(400, "invalid_integrity_payload", `${label} is required.`);
  }
  return text.slice(0, maxLength);
}

function optionalString(value: unknown, maxLength = 10_000) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text.slice(0, maxLength) : null;
}

function finiteScore(value: unknown, label: string) {
  const score = Number(value);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new ControlCenterHttpError(
      400,
      "invalid_integrity_payload",
      `${label} must be between 0 and 100.`
    );
  }
  return Math.round(score);
}

function secureEqual(left: string, right: string) {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

export function createIntegrityServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new ControlCenterHttpError(
      503,
      "integrity_service_not_configured",
      "Integrity service requires the server-side Supabase configuration."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function authorizeIntegrityIngest(request: Request) {
  const configuredSecret = process.env.ORBYVEN_INTEGRITY_INGEST_SECRET?.trim() ?? "";
  const suppliedSecret = request.headers.get("x-orbyven-integrity-secret")?.trim() ?? "";

  if (!configuredSecret) {
    throw new ControlCenterHttpError(
      503,
      "integrity_ingest_not_configured",
      "Integrity ingest secret is not configured."
    );
  }

  if (!suppliedSecret || !secureEqual(configuredSecret, suppliedSecret)) {
    throw new ControlCenterHttpError(401, "invalid_integrity_ingest_secret", "Unauthorized.");
  }
}

function parseFinding(value: unknown): IntegrityIngestFinding {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ControlCenterHttpError(400, "invalid_integrity_payload", "Invalid finding.");
  }

  const raw = value as Record<string, unknown>;
  const category = requiredString(raw.category, "finding.category", 20);
  const severity = requiredString(raw.severity, "finding.severity", 20);

  if (!CATEGORY_SET.has(category)) {
    throw new ControlCenterHttpError(400, "invalid_integrity_payload", "Invalid finding category.");
  }
  if (!SEVERITY_SET.has(severity)) {
    throw new ControlCenterHttpError(400, "invalid_integrity_payload", "Invalid finding severity.");
  }

  return {
    fingerprint: requiredString(raw.fingerprint, "finding.fingerprint", 160),
    category: category as IntegrityIngestFinding["category"],
    severity: severity as IntegrityIngestFinding["severity"],
    title: requiredString(raw.title, "finding.title", 240),
    summary: requiredString(raw.summary, "finding.summary", 4_000),
    evidence: optionalString(raw.evidence, 16_000),
    manual_action: optionalString(raw.manual_action, 8_000),
    ai_action: optionalString(raw.ai_action, 8_000),
    can_ai_execute: raw.can_ai_execute === true,
    requires_human: raw.requires_human === true,
  };
}

export function parseIntegrityIngestPayload(value: unknown): IntegrityIngestPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ControlCenterHttpError(400, "invalid_integrity_payload", "Invalid audit payload.");
  }

  const raw = value as Record<string, unknown>;
  const source = requiredString(raw.source, "source", 20);
  const status = requiredString(raw.status, "status", 20);

  if (!INGEST_SOURCE_SET.has(source) || !INGEST_STATUS_SET.has(status)) {
    throw new ControlCenterHttpError(400, "invalid_integrity_payload", "Invalid audit status/source.");
  }

  const categoryScoresRaw =
    raw.category_scores && typeof raw.category_scores === "object" && !Array.isArray(raw.category_scores)
      ? (raw.category_scores as Record<string, unknown>)
      : {};
  const categoryScores: Record<string, number> = {};
  for (const category of CATEGORY_SET) {
    if (categoryScoresRaw[category] !== undefined) {
      categoryScores[category] = finiteScore(categoryScoresRaw[category], `category_scores.${category}`);
    }
  }

  const findingsRaw = Array.isArray(raw.findings) ? raw.findings : [];
  if (findingsRaw.length > MAX_FINDINGS) {
    throw new ControlCenterHttpError(413, "integrity_payload_too_large", "Too many findings.");
  }

  const reportMarkdown = requiredString(raw.report_markdown, "report_markdown", MAX_REPORT_LENGTH);

  return {
    run_key: requiredString(raw.run_key, "run_key", 180),
    source: source as IntegrityIngestPayload["source"],
    status: status as IntegrityIngestPayload["status"],
    branch: optionalString(raw.branch, 180),
    commit_sha: optionalString(raw.commit_sha, 80),
    started_at: requiredString(raw.started_at, "started_at", 80),
    finished_at: requiredString(raw.finished_at, "finished_at", 80),
    overall_score: finiteScore(raw.overall_score, "overall_score"),
    category_scores: categoryScores,
    summary: requiredString(raw.summary, "summary", 8_000),
    report_markdown: reportMarkdown,
    report_sha256: requiredString(raw.report_sha256, "report_sha256", 128),
    findings: findingsRaw.map(parseFinding),
    metadata:
      raw.metadata && typeof raw.metadata === "object" && !Array.isArray(raw.metadata)
        ? (raw.metadata as Record<string, unknown>)
        : {},
  };
}

export async function ingestIntegrityRun(
  admin: SupabaseClient,
  payload: IntegrityIngestPayload
) {
  const { data: run, error: runError } = await admin
    .from("platform_integrity_runs")
    .upsert(
      {
        run_key: payload.run_key,
        source: payload.source,
        status: payload.status,
        branch: payload.branch ?? null,
        commit_sha: payload.commit_sha ?? null,
        started_at: payload.started_at,
        finished_at: payload.finished_at,
        overall_score: payload.overall_score,
        category_scores: payload.category_scores,
        summary: payload.summary,
        report_markdown: payload.report_markdown,
        report_sha256: payload.report_sha256,
        metadata: payload.metadata ?? {},
      },
      { onConflict: "run_key" }
    )
    .select("id")
    .single();

  if (runError || !run) throw runError ?? new Error("Integrity run was not persisted.");

  const { error: deleteError } = await admin
    .from("platform_integrity_findings")
    .delete()
    .eq("run_id", run.id);
  if (deleteError) throw deleteError;

  if (payload.findings.length > 0) {
    const { error: findingsError } = await admin.from("platform_integrity_findings").insert(
      payload.findings.map((finding) => ({
        run_id: run.id,
        fingerprint: finding.fingerprint,
        category: finding.category,
        severity: finding.severity,
        title: finding.title,
        summary: finding.summary,
        evidence: finding.evidence ?? null,
        manual_action: finding.manual_action ?? null,
        ai_action: finding.ai_action ?? null,
        can_ai_execute: finding.can_ai_execute ?? false,
        requires_human: finding.requires_human ?? false,
        status: "open",
      }))
    );
    if (findingsError) throw findingsError;
  }

  return run.id as string;
}

export async function loadIntegrityPayload(admin: SupabaseClient): Promise<IntegrityPayload> {
  const [runsResult, findingsResult, actionsResult] = await Promise.all([
    admin
      .from("platform_integrity_runs")
      .select(
        "id,run_key,source,status,branch,commit_sha,started_at,finished_at,overall_score,category_scores,summary,report_sha256,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(30),
    admin
      .from("platform_integrity_findings")
      .select(
        "id,run_id,category,severity,title,summary,evidence,manual_action,ai_action,can_ai_execute,requires_human,status,created_at,updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(300),
    admin
      .from("platform_integrity_actions")
      .select(
        "id,finding_id,requested_by,executor,mode,status,branch_name,pr_url,result_summary,created_at,updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (runsResult.error) throw runsResult.error;
  if (findingsResult.error) throw findingsResult.error;
  if (actionsResult.error) throw actionsResult.error;

  const recentRuns = (runsResult.data ?? []) as IntegrityRun[];
  const findings = (findingsResult.data ?? []) as IntegrityFinding[];
  const actions = (actionsResult.data ?? []) as IntegrityAction[];
  const openFindings = findings.filter((finding) =>
    ["open", "queued", "in_progress"].includes(finding.status)
  );

  return {
    latest_run: recentRuns[0] ?? null,
    recent_runs: recentRuns,
    findings,
    actions,
    manual_actions: openFindings.filter((finding) => finding.requires_human),
    ai_actions: openFindings.filter((finding) => finding.can_ai_execute),
    guardian: {
      mode: "pr_only",
      automatic_merge: false,
      direct_production_writes: false,
    },
  };
}

export async function queueGuardianFix(
  admin: SupabaseClient,
  requestedBy: string,
  findingId: string
) {
  const { data: finding, error: findingError } = await admin
    .from("platform_integrity_findings")
    .select("id,can_ai_execute,status")
    .eq("id", findingId)
    .maybeSingle();

  if (findingError) throw findingError;
  if (!finding) {
    throw new ControlCenterHttpError(404, "integrity_finding_not_found", "Finding not found.");
  }
  if (!finding.can_ai_execute) {
    throw new ControlCenterHttpError(
      409,
      "integrity_finding_manual_only",
      "This finding requires manual handling."
    );
  }
  if (finding.status === "resolved" || finding.status === "accepted_risk") {
    throw new ControlCenterHttpError(409, "integrity_finding_closed", "Finding is already closed.");
  }

  const { data: existing, error: existingError } = await admin
    .from("platform_integrity_actions")
    .select("id,status")
    .eq("finding_id", findingId)
    .eq("executor", "orbyven_guardian")
    .in("status", ["queued", "running", "waiting_approval"])
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing.id as string;

  const { data: action, error: actionError } = await admin
    .from("platform_integrity_actions")
    .insert({
      finding_id: findingId,
      requested_by: requestedBy,
      executor: "orbyven_guardian",
      mode: "prepare_pr",
      status: "queued",
    })
    .select("id")
    .single();
  if (actionError || !action) throw actionError ?? new Error("Guardian action was not queued.");

  const { error: findingUpdateError } = await admin
    .from("platform_integrity_findings")
    .update({ status: "queued", updated_at: new Date().toISOString() })
    .eq("id", findingId);
  if (findingUpdateError) throw findingUpdateError;

  return action.id as string;
}

export async function resolveManualFinding(
  admin: SupabaseClient,
  requestedBy: string,
  findingId: string,
  acceptedRisk = false
) {
  const status = acceptedRisk ? "accepted_risk" : "resolved";
  const now = new Date().toISOString();

  const { data: finding, error: findingError } = await admin
    .from("platform_integrity_findings")
    .update({ status, updated_at: now })
    .eq("id", findingId)
    .select("id")
    .maybeSingle();
  if (findingError) throw findingError;
  if (!finding) {
    throw new ControlCenterHttpError(404, "integrity_finding_not_found", "Finding not found.");
  }

  const { error: actionError } = await admin.from("platform_integrity_actions").insert({
    finding_id: findingId,
    requested_by: requestedBy,
    executor: "human",
    mode: "manual",
    status: "completed",
    result_summary: acceptedRisk
      ? "Risk accepted manually by the platform owner."
      : "Finding marked as resolved manually by the platform owner.",
    updated_at: now,
  });
  if (actionError) throw actionError;
}

export async function readIntegrityReport(admin: SupabaseClient, runId: string) {
  const { data, error } = await admin
    .from("platform_integrity_runs")
    .select("id,run_key,report_markdown")
    .eq("id", runId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new ControlCenterHttpError(404, "integrity_report_not_found", "Report not found.");
  }
  return data as { id: string; run_key: string; report_markdown: string };
}
