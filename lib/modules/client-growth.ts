import {
  buildPostServiceGrowthState,
  encodePostServiceEvent,
  parsePostServiceEvent,
  type PostServiceEvent,
  type PostServiceEventType,
  type PostServiceGrowthState,
} from "@/lib/automation/post-service-growth";
import {
  createCrmLeadActivity,
  listCrmLeadActivities,
} from "@/lib/modules/leads";

export async function loadPostServiceGrowthState(
  organizationId: string,
  clientId: string,
  taskId: string
): Promise<PostServiceGrowthState> {
  const activities = await listCrmLeadActivities(organizationId, clientId);
  return buildPostServiceGrowthState(
    activities
      .map((activity) => parsePostServiceEvent(activity.body, activity.occurred_at))
      .filter((event) => event?.taskId === taskId)
      .filter((event): event is PostServiceEvent => Boolean(event))
  );
}

export async function recordPostServiceEvent(
  organizationId: string,
  clientId: string,
  taskId: string,
  type: PostServiceEventType,
  note?: string
) {
  return createCrmLeadActivity(
    organizationId,
    clientId,
    "status",
    encodePostServiceEvent(taskId, type, note)
  );
}
