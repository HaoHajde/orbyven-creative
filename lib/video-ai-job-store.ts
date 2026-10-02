import {
  createBillingServiceClient,
  type BillingActor,
} from "@/lib/billing/supabase-server";
import type {
  VideoRenderJob,
  VideoRenderProvider,
  VideoRenderRequest,
} from "@/lib/video-ai-render";

type VideoJobUpdate = {
  status: VideoRenderJob["status"];
  providerJobId?: string | null;
  outputUrl?: string | null;
  failureCode?: string | null;
};

export async function persistVideoJob(
  actor: BillingActor,
  job: VideoRenderJob,
  request: VideoRenderRequest
) {
  try {
    const client = createBillingServiceClient(actor);
    const { error } = await client.from("video_ai_jobs").insert({
      id: job.id,
      organization_id: actor.organizationId,
      actor_id: actor.userId,
      provider: job.provider,
      status: job.status,
      storyboard: request.storyboard,
      reference_url: request.referenceUrl ?? null,
      source_urls: request.sourceUrls ?? [],
      provider_job_id: job.providerJobId,
      output_url: job.outputUrl,
    });

    if (error) {
      console.error("ORBYVEN Video AI job persistence failed", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("ORBYVEN Video AI job persistence unavailable", error);
    return false;
  }
}

export async function updateVideoJob(
  actor: BillingActor,
  id: string,
  update: VideoJobUpdate
) {
  try {
    const client = createBillingServiceClient(actor);
    const values: Record<string, unknown> = {
      status: update.status,
      updated_at: new Date().toISOString(),
    };

    if ("providerJobId" in update) values.provider_job_id = update.providerJobId ?? null;
    if ("outputUrl" in update) values.output_url = update.outputUrl ?? null;
    if ("failureCode" in update) values.failure_code = update.failureCode ?? null;

    const { error } = await client
      .from("video_ai_jobs")
      .update(values)
      .eq("id", id)
      .eq("organization_id", actor.organizationId);

    if (error) {
      console.error("ORBYVEN Video AI job update failed", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("ORBYVEN Video AI job update unavailable", error);
    return false;
  }
}

export async function listVideoJobs(actor: BillingActor, limit = 12) {
  const client = createBillingServiceClient(actor);
  const boundedLimit = Math.min(25, Math.max(1, Math.trunc(limit)));

  const { data, error } = await client
    .from("video_ai_jobs")
    .select(
      "id,provider,status,provider_job_id,output_url,failure_code,created_at,updated_at"
    )
    .eq("organization_id", actor.organizationId)
    .order("created_at", { ascending: false })
    .limit(boundedLimit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: String(row.id),
    provider: (row.provider ?? null) as VideoRenderProvider | null,
    status: row.status as VideoRenderJob["status"],
    providerJobId: row.provider_job_id ? String(row.provider_job_id) : null,
    outputUrl: row.output_url ? String(row.output_url) : null,
    failureCode: row.failure_code ? String(row.failure_code) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}
