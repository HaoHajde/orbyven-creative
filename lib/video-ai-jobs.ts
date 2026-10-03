import "server-only";

import type { BillingActor } from "@/lib/billing/supabase-server";
import { createBillingServiceClient } from "@/lib/billing/supabase-server";
import type {
  VideoRenderProvider,
  VideoRenderJob,
  VideoRenderJobStatus,
  VideoRenderRequest,
} from "@/lib/video-ai-render";

export type PersistedVideoJob = VideoRenderJob & {
  organizationId: string;
  actorId: string | null;
  storyboard: VideoRenderRequest["storyboard"];
  referenceUrl: string | null;
  sourceUrls: string[];
  failureCode: string | null;
  updatedAt: string;
};

type VideoJobRow = {
  id: string;
  organization_id: string;
  actor_id: string | null;
  provider: VideoRenderProvider | null;
  status: VideoRenderJobStatus;
  storyboard: VideoRenderRequest["storyboard"];
  reference_url: string | null;
  source_urls: string[];
  provider_job_id: string | null;
  output_url: string | null;
  failure_code: string | null;
  created_at: string;
  updated_at: string;
};

function toJob(row: VideoJobRow): PersistedVideoJob {
  return {
    id: row.id,
    organizationId: row.organization_id,
    actorId: row.actor_id,
    provider: row.provider,
    status: row.status,
    storyboard: row.storyboard,
    referenceUrl: row.reference_url,
    sourceUrls: Array.isArray(row.source_urls) ? row.source_urls : [],
    providerJobId: row.provider_job_id,
    outputUrl: row.output_url,
    failureCode: row.failure_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createVideoJob(
  actor: BillingActor,
  input: {
    id: string;
    provider: VideoRenderProvider | null;
    status: VideoRenderJobStatus;
    request: VideoRenderRequest;
    createdAt: string;
  },
) {
  const client = createBillingServiceClient(actor);
  const { data, error } = await client
    .from("video_ai_jobs")
    .insert({
      id: input.id,
      organization_id: actor.organizationId,
      actor_id: actor.userId,
      provider: input.provider,
      status: input.status,
      storyboard: input.request.storyboard,
      reference_url: input.request.referenceUrl ?? null,
      source_urls: input.request.sourceUrls ?? [],
      created_at: input.createdAt,
      updated_at: input.createdAt,
    })
    .select("*")
    .single();

  if (error) throw error;
  return toJob(data as VideoJobRow);
}

export async function updateVideoJob(
  actor: Pick<BillingActor, "organizationId" | "accessToken">,
  id: string,
  patch: {
    status?: VideoRenderJobStatus;
    provider?: VideoRenderProvider | null;
    providerJobId?: string | null;
    outputUrl?: string | null;
    failureCode?: string | null;
  },
) {
  const client = createBillingServiceClient(actor);
  const values: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.status !== undefined) values.status = patch.status;
  if (patch.provider !== undefined) values.provider = patch.provider;
  if (patch.providerJobId !== undefined) values.provider_job_id = patch.providerJobId;
  if (patch.outputUrl !== undefined) values.output_url = patch.outputUrl;
  if (patch.failureCode !== undefined) values.failure_code = patch.failureCode;

  const { data, error } = await client
    .from("video_ai_jobs")
    .update(values)
    .eq("id", id)
    .eq("organization_id", actor.organizationId)
    .select("*")
    .single();

  if (error) throw error;
  return toJob(data as VideoJobRow);
}

export async function getVideoJob(actor: BillingActor, id: string) {
  const client = createBillingServiceClient(actor);
  const { data, error } = await client
    .from("video_ai_jobs")
    .select("*")
    .eq("id", id)
    .eq("organization_id", actor.organizationId)
    .eq("actor_id", actor.userId)
    .maybeSingle();

  if (error) throw error;
  return data ? toJob(data as VideoJobRow) : null;
}

const workerTransitions: Record<VideoRenderJobStatus, ReadonlySet<VideoRenderJobStatus>> = {
  provider_required: new Set(["provider_required"]),
  queued: new Set(["queued", "rendering", "complete", "failed"]),
  rendering: new Set(["rendering", "complete", "failed"]),
  complete: new Set(["complete"]),
  failed: new Set(["failed"]),
};

export async function updateVideoJobFromWorker(
  id: string,
  patch: {
    status: VideoRenderJobStatus;
    providerJobId?: string | null;
    outputUrl?: string | null;
    failureCode?: string | null;
  },
) {
  const client = createBillingServiceClient();
  const { data: current, error: currentError } = await client
    .from("video_ai_jobs")
    .select("status,output_url")
    .eq("id", id)
    .maybeSingle();

  if (currentError) throw currentError;
  if (!current) throw new Error("VIDEO_JOB_NOT_FOUND");

  const currentStatus = current.status as VideoRenderJobStatus;
  if (!workerTransitions[currentStatus].has(patch.status)) {
    throw new Error("VIDEO_JOB_INVALID_TRANSITION");
  }

  const nextOutputUrl =
    patch.outputUrl === undefined ? (current.output_url as string | null) : patch.outputUrl;
  if (patch.status === "complete" && !nextOutputUrl) {
    throw new Error("VIDEO_JOB_OUTPUT_REQUIRED");
  }

  const values: Record<string, unknown> = {
    status: patch.status,
    updated_at: new Date().toISOString(),
  };
  if (patch.providerJobId !== undefined) values.provider_job_id = patch.providerJobId;
  if (patch.outputUrl !== undefined) values.output_url = patch.outputUrl;
  if (patch.failureCode !== undefined) values.failure_code = patch.failureCode;

  const { data, error } = await client
    .from("video_ai_jobs")
    .update(values)
    .eq("id", id)
    .eq("status", currentStatus)
    .select("*")
    .single();

  if (error) throw error;
  return toJob(data as VideoJobRow);
}


export async function listVideoJobs(actor: BillingActor, limit = 12) {
  const client = createBillingServiceClient(actor);
  const safeLimit = Math.min(24, Math.max(1, Math.floor(limit)));
  const { data, error } = await client
    .from("video_ai_jobs")
    .select("*")
    .eq("organization_id", actor.organizationId)
    .eq("actor_id", actor.userId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) throw error;
  return ((data ?? []) as VideoJobRow[]).map(toJob);
}
