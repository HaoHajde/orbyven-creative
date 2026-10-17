import { createHash, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ControlCenterHttpError } from "@/lib/orbyven-control-center-server";

function secureEqual(left: string, right: string) {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

export function authorizeGuardianWorker(request: Request) {
  const configuredSecret = process.env.ORBYVEN_GUARDIAN_WORKER_SECRET?.trim() ?? "";
  const suppliedSecret = request.headers.get("x-orbyven-guardian-secret")?.trim() ?? "";

  if (!configuredSecret) {
    throw new ControlCenterHttpError(
      503,
      "guardian_worker_not_configured",
      "Guardian worker secret is not configured."
    );
  }

  if (!suppliedSecret || !secureEqual(configuredSecret, suppliedSecret)) {
    throw new ControlCenterHttpError(401, "invalid_guardian_worker_secret", "Unauthorized.");
  }
}

export async function claimGuardianAction(admin: SupabaseClient) {
  const { data: queued, error: queuedError } = await admin
    .from("platform_integrity_actions")
    .select("id,finding_id,created_at")
    .eq("executor", "orbyven_guardian")
    .eq("mode", "prepare_pr")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (queuedError) throw queuedError;
  if (!queued) return null;

  const now = new Date().toISOString();
  const { data: claimed, error: claimError } = await admin
    .from("platform_integrity_actions")
    .update({ status: "running", updated_at: now })
    .eq("id", queued.id)
    .eq("status", "queued")
    .select("id,finding_id")
    .maybeSingle();

  if (claimError) throw claimError;
  if (!claimed) return null;

  const { data: finding, error: findingError } = await admin
    .from("platform_integrity_findings")
    .select(
      "id,run_id,category,severity,title,summary,evidence,ai_action,can_ai_execute,status"
    )
    .eq("id", claimed.finding_id)
    .maybeSingle();

  if (findingError) throw findingError;
  if (!finding || !finding.can_ai_execute) {
    await admin
      .from("platform_integrity_actions")
      .update({
        status: "failed",
        result_summary: "Guardian claim rejected because the finding is missing or not AI-executable.",
        updated_at: now,
      })
      .eq("id", claimed.id);
    return null;
  }

  const { data: run, error: runError } = await admin
    .from("platform_integrity_runs")
    .select("run_key,commit_sha,branch,created_at")
    .eq("id", finding.run_id)
    .maybeSingle();
  if (runError) throw runError;

  const { error: findingUpdateError } = await admin
    .from("platform_integrity_findings")
    .update({ status: "in_progress", updated_at: now })
    .eq("id", finding.id);
  if (findingUpdateError) throw findingUpdateError;

  return {
    action_id: claimed.id as string,
    finding: {
      id: finding.id as string,
      category: finding.category as string,
      severity: finding.severity as string,
      title: finding.title as string,
      summary: finding.summary as string,
      evidence: (finding.evidence as string | null) ?? null,
      ai_action: (finding.ai_action as string | null) ?? null,
    },
    audit: run
      ? {
          run_key: run.run_key as string,
          commit_sha: (run.commit_sha as string | null) ?? null,
          branch: (run.branch as string | null) ?? null,
          created_at: run.created_at as string,
        }
      : null,
  };
}

export async function completeGuardianAction(
  admin: SupabaseClient,
  body: Record<string, unknown>
) {
  const actionId = typeof body.action_id === "string" ? body.action_id.trim() : "";
  const status = typeof body.status === "string" ? body.status.trim() : "";
  const branchName = typeof body.branch_name === "string" ? body.branch_name.trim() : "";
  const prUrl = typeof body.pr_url === "string" ? body.pr_url.trim() : "";
  const resultSummary =
    typeof body.result_summary === "string" ? body.result_summary.trim().slice(0, 8_000) : "";

  if (!/^[0-9a-f-]{36}$/i.test(actionId)) {
    throw new ControlCenterHttpError(400, "guardian_action_invalid", "Invalid Guardian action ID.");
  }
  if (status !== "waiting_approval" && status !== "failed") {
    throw new ControlCenterHttpError(400, "guardian_status_invalid", "Invalid Guardian result status.");
  }
  if (status === "waiting_approval") {
    if (!/^guardian\/[0-9a-f-]{36}$/i.test(branchName)) {
      throw new ControlCenterHttpError(400, "guardian_branch_invalid", "Invalid Guardian branch.");
    }
    if (!/^https:\/\/github\.com\/HaoHajde\/orbyven-creative\/pull\/\d+$/i.test(prUrl)) {
      throw new ControlCenterHttpError(400, "guardian_pr_invalid", "Invalid Guardian pull request URL.");
    }
  }

  const { data: action, error: actionError } = await admin
    .from("platform_integrity_actions")
    .select("id,finding_id,status")
    .eq("id", actionId)
    .eq("executor", "orbyven_guardian")
    .maybeSingle();
  if (actionError) throw actionError;
  if (!action) {
    throw new ControlCenterHttpError(404, "guardian_action_not_found", "Guardian action not found.");
  }
  if (!["running", "waiting_approval"].includes(action.status)) {
    throw new ControlCenterHttpError(
      409,
      "guardian_action_state_conflict",
      "Guardian action is not in an executable state."
    );
  }

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("platform_integrity_actions")
    .update({
      status,
      branch_name: status === "waiting_approval" ? branchName : null,
      pr_url: status === "waiting_approval" ? prUrl : null,
      result_summary: resultSummary || null,
      updated_at: now,
    })
    .eq("id", actionId);
  if (updateError) throw updateError;

  const { error: findingError } = await admin
    .from("platform_integrity_findings")
    .update({
      status: status === "waiting_approval" ? "in_progress" : "open",
      updated_at: now,
    })
    .eq("id", action.finding_id);
  if (findingError) throw findingError;
}
