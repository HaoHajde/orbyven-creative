export const POST_SERVICE_PREFIX = "[ORBYVEN:POST_SERVICE]";
const DAY_MS = 86400000;

export type PostServiceEventType =
  | "feedback_requested"
  | "feedback_positive"
  | "feedback_issue"
  | "review_requested"
  | "referral_requested"
  | "upsell_dismissed";

export type PostServiceEvent = {
  taskId: string;
  type: PostServiceEventType;
  occurredAt: string;
};

export type PostServiceGrowthState = {
  feedback: "none" | "requested" | "positive" | "issue";
  feedbackRequestedAt: string | null;
  feedbackResolvedAt: string | null;
  reviewRequestedAt: string | null;
  referralRequestedAt: string | null;
  upsellDismissedAt: string | null;
};

export type PostServiceGrowthAction = {
  rule:
    | "post_service_feedback"
    | "post_service_feedback_followup"
    | "post_service_recovery"
    | "post_service_review"
    | "post_service_referral"
    | "post_service_upsell";
  level: "urgent" | "attention" | "upcoming";
  title: string;
  detail: string;
};

const EVENT_LABELS: Record<PostServiceEventType, string> = {
  feedback_requested: "Feedback cerut după finalizarea lucrării.",
  feedback_positive: "Clientul a oferit feedback pozitiv.",
  feedback_issue: "Clientul a raportat o problemă după finalizarea lucrării.",
  review_requested: "Review public solicitat clientului.",
  referral_requested: "Recomandare solicitată clientului.",
  upsell_dismissed: "Oportunitatea comercială post-serviciu a fost amânată.",
};

export function encodePostServiceEvent(
  taskId: string,
  type: PostServiceEventType,
  note?: string
) {
  const cleanTaskId = taskId.trim();
  if (!cleanTaskId) throw new Error("task_id is required.");
  const suffix = note?.trim() || EVENT_LABELS[type];
  return `${POST_SERVICE_PREFIX} task=${cleanTaskId};event=${type} | ${suffix}`;
}

export function parsePostServiceEvent(
  body: string,
  occurredAt: string
): PostServiceEvent | null {
  if (!body.startsWith(POST_SERVICE_PREFIX)) return null;
  const match = body.match(/^\[ORBYVEN:POST_SERVICE\] task=([^;]+);event=([a-z_]+)\s*\|/);
  if (!match) return null;

  const type = match[2] as PostServiceEventType;
  if (!(type in EVENT_LABELS)) return null;
  return { taskId: match[1], type, occurredAt };
}

export function displayPostServiceActivity(body: string) {
  if (!body.startsWith(POST_SERVICE_PREFIX)) return body;
  const separator = body.indexOf(" | ");
  return separator >= 0 ? body.slice(separator + 3) : body;
}

export function buildPostServiceGrowthState(
  events: PostServiceEvent[]
): PostServiceGrowthState {
  const sorted = [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const state: PostServiceGrowthState = {
    feedback: "none",
    feedbackRequestedAt: null,
    feedbackResolvedAt: null,
    reviewRequestedAt: null,
    referralRequestedAt: null,
    upsellDismissedAt: null,
  };

  for (const event of sorted) {
    switch (event.type) {
      case "feedback_requested":
        state.feedback = "requested";
        state.feedbackRequestedAt = event.occurredAt;
        break;
      case "feedback_positive":
        state.feedback = "positive";
        state.feedbackResolvedAt = event.occurredAt;
        break;
      case "feedback_issue":
        state.feedback = "issue";
        state.feedbackResolvedAt = event.occurredAt;
        break;
      case "review_requested":
        state.reviewRequestedAt = event.occurredAt;
        break;
      case "referral_requested":
        state.referralRequestedAt = event.occurredAt;
        break;
      case "upsell_dismissed":
        state.upsellDismissedAt = event.occurredAt;
        break;
    }
  }

  return state;
}

export function evaluatePostServiceGrowth(input: {
  taskTitle: string;
  completedAt: string | null;
  state: PostServiceGrowthState;
  now: Date;
  hasOpenWorkForClient?: boolean;
}): PostServiceGrowthAction | null {
  if (!input.completedAt) return null;
  const completedMs = new Date(input.completedAt).getTime();
  if (!Number.isFinite(completedMs)) return null;

  const ageDays = Math.max(0, Math.floor((input.now.getTime() - completedMs) / DAY_MS));

  if (input.state.feedback === "issue") {
    return {
      rule: "post_service_recovery",
      level: "urgent",
      title: "Recuperare client · " + input.taskTitle,
      detail: "Clientul a raportat o problemă. Închide problema înainte de review sau ofertă nouă.",
    };
  }

  if (input.state.feedback === "none" && ageDays >= 2) {
    return {
      rule: "post_service_feedback",
      level: "attention",
      title: "Cere feedback · " + input.taskTitle,
      detail: "Lucrarea este finalizată de cel puțin 2 zile și nu există feedback înregistrat.",
    };
  }

  if (
    input.state.feedback === "requested" &&
    input.state.feedbackRequestedAt &&
    input.now.getTime() - new Date(input.state.feedbackRequestedAt).getTime() >= 3 * DAY_MS
  ) {
    return {
      rule: "post_service_feedback_followup",
      level: "attention",
      title: "Revino pentru feedback · " + input.taskTitle,
      detail: "Feedbackul a fost cerut, dar nu există încă un răspuns înregistrat.",
    };
  }

  if (input.state.feedback !== "positive") return null;

  if (!input.state.reviewRequestedAt) {
    return {
      rule: "post_service_review",
      level: "attention",
      title: "Cere review · " + input.taskTitle,
      detail: "Feedbackul este pozitiv. Este momentul potrivit pentru un review public.",
    };
  }

  if (!input.state.referralRequestedAt) {
    return {
      rule: "post_service_referral",
      level: "upcoming",
      title: "Cere o recomandare · " + input.taskTitle,
      detail: "Clientul este mulțumit și review-ul a fost deja cerut.",
    };
  }

  if (
    ageDays >= 30 &&
    !input.hasOpenWorkForClient &&
    (!input.state.upsellDismissedAt ||
      input.now.getTime() - new Date(input.state.upsellDismissedAt).getTime() >= 30 * DAY_MS)
  ) {
    return {
      rule: "post_service_upsell",
      level: "upcoming",
      title: "Oportunitate nouă · " + input.taskTitle,
      detail: "Client mulțumit, fără lucrare activă. Poți propune un serviciu complementar sau recurent.",
    };
  }

  return null;
}
