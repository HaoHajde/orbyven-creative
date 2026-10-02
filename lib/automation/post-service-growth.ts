export const POST_SERVICE_PREFIX = "[ORBYVEN:POST_SERVICE]";
const DAY_MS = 86400000;

export type PostServiceEventType =
  | "feedback_requested"
  | "feedback_scored"
  | "feedback_positive"
  | "feedback_issue"
  | "recovery_resolved"
  | "review_requested"
  | "review_completed"
  | "review_declined"
  | "referral_requested"
  | "referral_received"
  | "referral_declined"
  | "upsell_scheduled"
  | "upsell_offered"
  | "upsell_dismissed";

export type PostServiceEvent = {
  taskId: string;
  type: PostServiceEventType;
  occurredAt: string;
  score: number | null;
};

export type PostServiceGrowthState = {
  feedback: "none" | "requested" | "positive" | "issue";
  feedbackScore: number | null;
  feedbackRequestedAt: string | null;
  feedbackResolvedAt: string | null;
  reviewRequestedAt: string | null;
  reviewCompletedAt: string | null;
  reviewDeclinedAt: string | null;
  referralRequestedAt: string | null;
  referralReceivedAt: string | null;
  referralDeclinedAt: string | null;
  upsellScheduledAt: string | null;
  upsellOfferedAt: string | null;
  upsellDismissedAt: string | null;
};

export type PostServiceGrowthAction = {
  rule:
    | "post_service_feedback"
    | "post_service_feedback_followup"
    | "post_service_recovery"
    | "post_service_review"
    | "post_service_review_followup"
    | "post_service_referral"
    | "post_service_referral_followup"
    | "post_service_upsell";
  level: "urgent" | "attention" | "upcoming";
  title: string;
  detail: string;
};

const EVENT_LABELS: Record<PostServiceEventType, string> = {
  feedback_requested: "Feedback cerut după finalizarea lucrării.",
  feedback_scored: "Feedback înregistrat după finalizarea lucrării.",
  feedback_positive: "Clientul a oferit feedback pozitiv.",
  feedback_issue: "Clientul a raportat o problemă după finalizarea lucrării.",
  recovery_resolved: "Problema raportată de client a fost remediată.",
  review_requested: "Review public solicitat clientului.",
  review_completed: "Review public primit de la client.",
  review_declined: "Clientul nu dorește review public.",
  referral_requested: "Recomandare solicitată clientului.",
  referral_received: "Recomandare primită de la client.",
  referral_declined: "Clientul nu dorește să ofere o recomandare acum.",
  upsell_scheduled: "Oportunitatea comercială a fost programată pentru mai târziu.",
  upsell_offered: "O ofertă post-serviciu a fost pregătită pentru client.",
  upsell_dismissed: "Oportunitatea comercială post-serviciu a fost amânată.",
};

export function encodePostServiceEvent(
  taskId: string,
  type: PostServiceEventType,
  note?: string,
  score?: number
) {
  const cleanTaskId = taskId.trim();
  if (!cleanTaskId) throw new Error("task_id is required.");

  if (type === "feedback_scored") {
    if (!Number.isInteger(score) || (score as number) < 1 || (score as number) > 5) {
      throw new Error("Feedback score must be an integer from 1 to 5.");
    }
  }

  const scorePart = type === "feedback_scored" ? `;score=${score}` : "";
  const suffix = note?.trim() || EVENT_LABELS[type];
  return `${POST_SERVICE_PREFIX} task=${cleanTaskId};event=${type}${scorePart} | ${suffix}`;
}

export function parsePostServiceEvent(
  body: string,
  occurredAt: string
): PostServiceEvent | null {
  if (!body.startsWith(POST_SERVICE_PREFIX)) return null;
  const match = body.match(
    /^\[ORBYVEN:POST_SERVICE\] task=([^;]+);event=([a-z_]+)(?:;score=([1-5]))?\s*\|/
  );
  if (!match) return null;

  const type = match[2] as PostServiceEventType;
  if (!(type in EVENT_LABELS)) return null;

  const score = match[3] ? Number(match[3]) : null;
  if (type === "feedback_scored" && score === null) return null;

  return { taskId: match[1], type, occurredAt, score };
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
    feedbackScore: null,
    feedbackRequestedAt: null,
    feedbackResolvedAt: null,
    reviewRequestedAt: null,
    reviewCompletedAt: null,
    reviewDeclinedAt: null,
    referralRequestedAt: null,
    referralReceivedAt: null,
    referralDeclinedAt: null,
    upsellScheduledAt: null,
    upsellOfferedAt: null,
    upsellDismissedAt: null,
  };

  for (const event of sorted) {
    switch (event.type) {
      case "feedback_requested":
        state.feedback = "requested";
        state.feedbackScore = null;
        state.feedbackRequestedAt = event.occurredAt;
        break;
      case "feedback_scored":
        state.feedbackScore = event.score;
        state.feedback = (event.score ?? 0) >= 4 ? "positive" : "issue";
        state.feedbackResolvedAt = event.occurredAt;
        break;
      case "feedback_positive":
        state.feedback = "positive";
        state.feedbackResolvedAt = event.occurredAt;
        break;
      case "feedback_issue":
        state.feedback = "issue";
        state.feedbackResolvedAt = event.occurredAt;
        break;
      case "recovery_resolved":
        state.feedback = "requested";
        state.feedbackScore = null;
        state.feedbackRequestedAt = event.occurredAt;
        state.feedbackResolvedAt = event.occurredAt;
        break;
      case "review_requested":
        state.reviewRequestedAt = event.occurredAt;
        state.reviewCompletedAt = null;
        state.reviewDeclinedAt = null;
        break;
      case "review_completed":
        state.reviewCompletedAt = event.occurredAt;
        state.reviewDeclinedAt = null;
        break;
      case "review_declined":
        state.reviewDeclinedAt = event.occurredAt;
        state.reviewCompletedAt = null;
        break;
      case "referral_requested":
        state.referralRequestedAt = event.occurredAt;
        state.referralReceivedAt = null;
        state.referralDeclinedAt = null;
        break;
      case "referral_received":
        state.referralReceivedAt = event.occurredAt;
        state.referralDeclinedAt = null;
        break;
      case "referral_declined":
        state.referralDeclinedAt = event.occurredAt;
        state.referralReceivedAt = null;
        break;
      case "upsell_scheduled":
        state.upsellScheduledAt = event.occurredAt;
        state.upsellDismissedAt = null;
        break;
      case "upsell_offered":
        state.upsellOfferedAt = event.occurredAt;
        state.upsellScheduledAt = null;
        state.upsellDismissedAt = null;
        break;
      case "upsell_dismissed":
        state.upsellDismissedAt = event.occurredAt;
        state.upsellScheduledAt = event.occurredAt;
        break;
    }
  }

  return state;
}

function elapsedAtLeast(now: Date, value: string | null, days: number) {
  if (!value) return false;
  const millis = new Date(value).getTime();
  return Number.isFinite(millis) && now.getTime() - millis >= days * DAY_MS;
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
  const scoreSuffix =
    input.state.feedbackScore !== null ? ` · ${input.state.feedbackScore}/5` : "";

  if (input.state.feedback === "issue") {
    return {
      rule: "post_service_recovery",
      level: input.state.feedbackScore !== null && input.state.feedbackScore <= 2 ? "urgent" : "attention",
      title: "Recuperare client · " + input.taskTitle,
      detail:
        "Clientul a raportat o problemă" +
        scoreSuffix +
        ". Închide problema înainte de review, recomandare sau ofertă nouă.",
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
    elapsedAtLeast(input.now, input.state.feedbackRequestedAt, 3)
  ) {
    return {
      rule: "post_service_feedback_followup",
      level: "attention",
      title: "Revino pentru feedback · " + input.taskTitle,
      detail: "Feedbackul a fost cerut, dar nu există încă un răspuns înregistrat.",
    };
  }

  if (input.state.feedback !== "positive") return null;

  const reviewResolved = Boolean(
    input.state.reviewCompletedAt || input.state.reviewDeclinedAt
  );

  if (!input.state.reviewRequestedAt && !reviewResolved) {
    return {
      rule: "post_service_review",
      level: "attention",
      title: "Cere review · " + input.taskTitle,
      detail:
        "Feedbackul este pozitiv" +
        scoreSuffix +
        ". Este momentul potrivit pentru un review public.",
    };
  }

  if (
    input.state.reviewRequestedAt &&
    !reviewResolved &&
    elapsedAtLeast(input.now, input.state.reviewRequestedAt, 14)
  ) {
    return {
      rule: "post_service_review_followup",
      level: "upcoming",
      title: "Verifică review-ul · " + input.taskTitle,
      detail: "Review-ul a fost solicitat, dar rezultatul nu este încă înregistrat.",
    };
  }

  if (input.state.reviewRequestedAt && !reviewResolved) return null;

  if (input.state.reviewCompletedAt) {
    const referralResolved = Boolean(
      input.state.referralReceivedAt || input.state.referralDeclinedAt
    );

    if (!input.state.referralRequestedAt && !referralResolved) {
      return {
        rule: "post_service_referral",
        level: "upcoming",
        title: "Cere o recomandare · " + input.taskTitle,
        detail: "Clientul este mulțumit și review-ul a fost primit.",
      };
    }

    if (
      input.state.referralRequestedAt &&
      !referralResolved &&
      elapsedAtLeast(input.now, input.state.referralRequestedAt, 30)
    ) {
      return {
        rule: "post_service_referral_followup",
        level: "upcoming",
        title: "Verifică recomandarea · " + input.taskTitle,
        detail: "Recomandarea a fost solicitată, dar rezultatul nu este încă înregistrat.",
      };
    }

    if (input.state.referralRequestedAt && !referralResolved) return null;
  }

  if (ageDays < 30 || input.hasOpenWorkForClient) return null;

  const latestSnooze =
    input.state.upsellScheduledAt || input.state.upsellDismissedAt;
  if (latestSnooze && !elapsedAtLeast(input.now, latestSnooze, 30)) return null;
  if (
    input.state.upsellOfferedAt &&
    !elapsedAtLeast(input.now, input.state.upsellOfferedAt, 60)
  ) {
    return null;
  }

  return {
    rule: "post_service_upsell",
    level: "upcoming",
    title: "Oportunitate nouă · " + input.taskTitle,
    detail:
      "Client mulțumit, fără lucrare activă. Poți propune un serviciu complementar sau recurent.",
  };
}
