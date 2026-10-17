export type IntegrityCategory = "code" | "security" | "seo" | "legal";

export type IntegrityRunStatus =
  | "queued"
  | "running"
  | "passed"
  | "warning"
  | "failed"
  | "error";

export type IntegritySeverity =
  | "info"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type IntegrityFindingStatus =
  | "open"
  | "queued"
  | "in_progress"
  | "resolved"
  | "accepted_risk";

export type IntegrityActionMode = "manual" | "prepare_pr" | "safe_auto";

export type IntegrityActionStatus =
  | "queued"
  | "running"
  | "waiting_approval"
  | "completed"
  | "failed"
  | "cancelled";

export type IntegrityFinding = {
  id: string;
  run_id: string;
  category: IntegrityCategory;
  severity: IntegritySeverity;
  title: string;
  summary: string;
  evidence: string | null;
  manual_action: string | null;
  ai_action: string | null;
  can_ai_execute: boolean;
  requires_human: boolean;
  status: IntegrityFindingStatus;
  created_at: string;
  updated_at: string;
};

export type IntegrityAction = {
  id: string;
  finding_id: string;
  requested_by: string | null;
  executor: "human" | "orbyven_guardian";
  mode: IntegrityActionMode;
  status: IntegrityActionStatus;
  branch_name: string | null;
  pr_url: string | null;
  result_summary: string | null;
  created_at: string;
  updated_at: string;
};

export type IntegrityRun = {
  id: string;
  run_key: string;
  source: "scheduled" | "manual" | "ci";
  status: IntegrityRunStatus;
  branch: string | null;
  commit_sha: string | null;
  started_at: string;
  finished_at: string | null;
  overall_score: number | null;
  category_scores: Record<IntegrityCategory, number> | Record<string, number>;
  summary: string | null;
  report_sha256: string | null;
  created_at: string;
};

export type IntegrityPayload = {
  latest_run: IntegrityRun | null;
  recent_runs: IntegrityRun[];
  findings: IntegrityFinding[];
  actions: IntegrityAction[];
  manual_actions: IntegrityFinding[];
  ai_actions: IntegrityFinding[];
  guardian: {
    mode: "pr_only";
    automatic_merge: false;
    direct_production_writes: false;
  };
};

export type IntegrityIngestFinding = {
  fingerprint: string;
  category: IntegrityCategory;
  severity: IntegritySeverity;
  title: string;
  summary: string;
  evidence?: string | null;
  manual_action?: string | null;
  ai_action?: string | null;
  can_ai_execute?: boolean;
  requires_human?: boolean;
};

export type IntegrityIngestPayload = {
  run_key: string;
  source: "scheduled" | "manual" | "ci";
  status: Exclude<IntegrityRunStatus, "queued" | "running">;
  branch?: string | null;
  commit_sha?: string | null;
  started_at: string;
  finished_at: string;
  overall_score: number;
  category_scores: Record<string, number>;
  summary: string;
  report_markdown: string;
  report_sha256: string;
  findings: IntegrityIngestFinding[];
  metadata?: Record<string, unknown>;
};
