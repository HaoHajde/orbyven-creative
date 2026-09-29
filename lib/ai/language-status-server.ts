import {
  createBillingServiceClient,
  type BillingActor,
} from "@/lib/billing/supabase-server";
import { getLanguageReadiness } from "@/lib/ai/language-readiness";

export type LanguageOpsStatus = {
  readiness: ReturnType<typeof getLanguageReadiness>;
  usage: {
    date: string;
    requests: number;
    remaining: number;
  };
  recentCalls: Array<{
    id: string;
    provider: string;
    model: string;
    status: "reserved" | "succeeded" | "failed";
    inputTokens: number;
    outputTokens: number;
    failureCode: string | null;
    startedAt: string;
    finishedAt: string | null;
  }>;
};

function utcDateKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function loadLanguageOpsStatus(
  actor: BillingActor
): Promise<LanguageOpsStatus> {
  if (actor.role !== "owner" && actor.role !== "admin") {
    throw new Error("AI_ADMIN_REQUIRED");
  }

  const readiness = getLanguageReadiness();
  const client = createBillingServiceClient();
  const date = utcDateKey();

  const [usageResult, callsResult] = await Promise.all([
    client
      .from("ai_language_daily_usage")
      .select("requests")
      .eq("organization_id", actor.organizationId)
      .eq("usage_date", date)
      .maybeSingle(),
    client
      .from("ai_language_calls")
      .select(
        "id,provider,model,status,input_tokens,output_tokens,failure_code,started_at,finished_at"
      )
      .eq("organization_id", actor.organizationId)
      .order("started_at", { ascending: false })
      .limit(8),
  ]);

  if (usageResult.error) throw usageResult.error;
  if (callsResult.error) throw callsResult.error;

  const requests = Number(usageResult.data?.requests ?? 0);
  return {
    readiness,
    usage: {
      date,
      requests,
      remaining: Math.max(0, readiness.dailyLimit - requests),
    },
    recentCalls: (callsResult.data ?? []).map((row) => ({
      id: row.id,
      provider: row.provider,
      model: row.model,
      status: row.status as "reserved" | "succeeded" | "failed",
      inputTokens: Number(row.input_tokens || 0),
      outputTokens: Number(row.output_tokens || 0),
      failureCode: row.failure_code ?? null,
      startedAt: row.started_at,
      finishedAt: row.finished_at ?? null,
    })),
  };
}
