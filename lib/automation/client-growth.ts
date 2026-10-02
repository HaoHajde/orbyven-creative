import type { ClientGrowthState } from "@/lib/modules/client-growth";

const DAY_MS = 86400000;

export type ClientGrowthAction =
  | "none"
  | "feedback_due"
  | "feedback_waiting"
  | "recovery_needed"
  | "review_ready"
  | "review_waiting"
  | "referral_ready"
  | "referral_waiting"
  | "upsell_ready"
  | "upsell_due";

export type LatestCompletedWork = {
  id: string;
  title: string;
  completedAt: string;
};

export type ClientGrowthEvaluation = {
  action: ClientGrowthAction;
  label: string;
  detail: string;
  level: "urgent" | "attention" | "upcoming";
  taskId: string | null;
  positiveFeedback: boolean;
};

function daysSince(value: string | null | undefined, nowMs: number) {
  if (!value) return null;
  const millis = new Date(value).getTime();
  if (!Number.isFinite(millis)) return null;
  return Math.max(0, Math.floor((nowMs - millis) / DAY_MS));
}

export function evaluateClientGrowth(
  growth: ClientGrowthState | null | undefined,
  latestWork: LatestCompletedWork | null | undefined,
  now = new Date()
): ClientGrowthEvaluation {
  const none = (
    detail = "Nu există încă un pas de growth recomandat."
  ): ClientGrowthEvaluation => ({
    action: "none",
    label: "Growth loop în regulă",
    detail,
    level: "upcoming",
    taskId: latestWork?.id ?? null,
    positiveFeedback: (growth?.feedback_score ?? 0) >= 4,
  });

  if (!latestWork) return none("Clientul nu are încă o lucrare finalizată eligibilă.");

  const nowMs = now.getTime();
  const workAgeDays = daysSince(latestWork.completedAt, nowMs) ?? 0;
  const sameFeedbackCycle = growth?.feedback_task_id === latestWork.id;
  const feedbackStatus = sameFeedbackCycle ? growth?.feedback_status ?? "idle" : "idle";
  const score = sameFeedbackCycle ? growth?.feedback_score ?? null : null;

  if (feedbackStatus === "idle") {
    if (workAgeDays < 2) {
      return none("Așteaptă minimum 2 zile după finalizarea lucrării înainte de feedback.");
    }
    return {
      action: "feedback_due",
      label: "Cere feedback",
      detail: `${latestWork.title} a fost finalizată acum aproximativ ${workAgeDays} zile.`,
      level: workAgeDays >= 7 ? "attention" : "upcoming",
      taskId: latestWork.id,
      positiveFeedback: false,
    };
  }

  if (feedbackStatus === "requested") {
    const requestedAge = daysSince(growth?.feedback_requested_at, nowMs) ?? 0;
    if (requestedAge >= 7) {
      return {
        action: "feedback_waiting",
        label: "Feedback fără răspuns",
        detail: `Cererea de feedback este deschisă de aproximativ ${requestedAge} zile.`,
        level: "attention",
        taskId: latestWork.id,
        positiveFeedback: false,
      };
    }
    return none("Feedback-ul a fost deja solicitat și este în așteptare.");
  }

  if (score !== null && score <= 3) {
    return {
      action: "recovery_needed",
      label: "Recuperează experiența clientului",
      detail: `Feedback ${score}/5. Rezolvă nemulțumirea înainte de review, referral sau upsell.`,
      level: score <= 2 ? "urgent" : "attention",
      taskId: latestWork.id,
      positiveFeedback: false,
    };
  }

  const positiveFeedback = score !== null && score >= 4;
  if (!positiveFeedback) return none("Feedback-ul nu are încă un scor utilizabil.");

  if (!growth || growth.review_status === "idle") {
    return {
      action: "review_ready",
      label: "Review potrivit",
      detail: `Feedback ${score}/5. Clientul este un candidat bun pentru o recenzie publică.`,
      level: "attention",
      taskId: latestWork.id,
      positiveFeedback: true,
    };
  }

  if (growth.review_status === "requested") {
    const age = daysSince(growth.review_requested_at, nowMs) ?? 0;
    if (age >= 14) {
      return {
        action: "review_waiting",
        label: "Review în așteptare",
        detail: `Review-ul a fost solicitat acum aproximativ ${age} zile.`,
        level: "upcoming",
        taskId: latestWork.id,
        positiveFeedback: true,
      };
    }
    return none("Review-ul a fost solicitat recent.");
  }

  if (growth.review_status === "declined") {
    if (growth.upsell_status === "idle") {
      return {
        action: "upsell_ready",
        label: "Oportunitate comercială",
        detail: "Clientul a avut o experiență bună; poți propune un serviciu relevant fără a insista pe review.",
        level: "upcoming",
        taskId: latestWork.id,
        positiveFeedback: true,
      };
    }
  }

  if (growth.review_status === "completed") {
    if (growth.referral_status === "idle") {
      return {
        action: "referral_ready",
        label: "Cere o recomandare",
        detail: "Review finalizat. Acum este momentul potrivit pentru o recomandare către alt client.",
        level: "upcoming",
        taskId: latestWork.id,
        positiveFeedback: true,
      };
    }

    if (growth.referral_status === "requested") {
      const age = daysSince(growth.referral_requested_at, nowMs) ?? 0;
      if (age >= 30) {
        return {
          action: "referral_waiting",
          label: "Recomandare în așteptare",
          detail: `Solicitarea de recomandare este deschisă de aproximativ ${age} zile.`,
          level: "upcoming",
          taskId: latestWork.id,
          positiveFeedback: true,
        };
      }
      return none("Recomandarea a fost solicitată recent.");
    }
  }

  if (
    growth?.review_status === "completed" &&
    ["received", "declined"].includes(growth.referral_status) &&
    growth.upsell_status === "idle"
  ) {
    return {
      action: "upsell_ready",
      label: "Upsell potrivit",
      detail: "Relația este matură și pozitivă. Poți pregăti o ofertă relevantă pentru următoarea nevoie.",
      level: "upcoming",
      taskId: latestWork.id,
      positiveFeedback: true,
    };
  }

  if (growth?.upsell_status === "scheduled" && growth.upsell_next_at) {
    const due = new Date(growth.upsell_next_at).getTime();
    if (Number.isFinite(due) && due <= nowMs) {
      return {
        action: "upsell_due",
        label: "Upsell ajuns la termen",
        detail: growth.upsell_hint?.trim() || "Oportunitatea comercială programată poate fi reluată acum.",
        level: "attention",
        taskId: latestWork.id,
        positiveFeedback: true,
      };
    }
    return none("Oportunitatea comercială este programată pentru mai târziu.");
  }

  return none();
}
