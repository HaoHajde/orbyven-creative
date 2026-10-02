import { evaluateClientGrowth } from "@/lib/automation/client-growth";
import type {
  ClientGrowthCompletedWork,
  ClientGrowthState,
} from "@/lib/modules/client-growth";

export type ClientGrowthSignal = {
  key: string;
  rule: string;
  title: string;
  meta: string;
  level: "urgent" | "attention" | "upcoming";
  sortAt: string;
  clientId: string;
  taskId: string;
  actionLabel: string;
};

export function buildClientGrowthSignals(input: {
  clients: Array<{ id: string; name: string }>;
  growthStates: ClientGrowthState[];
  completedWorks: ClientGrowthCompletedWork[];
  now: Date;
}): ClientGrowthSignal[] {
  const clientById = new Map(input.clients.map((client) => [client.id, client]));
  const growthByClient = new Map(
    input.growthStates.map((growth) => [growth.client_id, growth])
  );

  const rules: Record<string, string> = {
    feedback_due: "client_feedback_due",
    feedback_waiting: "client_feedback_waiting",
    recovery_needed: "client_recovery_needed",
    review_ready: "client_review_opportunity",
    review_waiting: "client_review_waiting",
    referral_ready: "client_referral_opportunity",
    referral_waiting: "client_referral_waiting",
    upsell_ready: "client_upsell_opportunity",
    upsell_due: "client_upsell_due",
  };

  const labels: Record<string, string> = {
    feedback_due: "Cere feedback",
    feedback_waiting: "Verifică feedback",
    recovery_needed: "Recuperează clientul",
    review_ready: "Cere review",
    review_waiting: "Verifică review",
    referral_ready: "Cere recomandare",
    referral_waiting: "Verifică recomandarea",
    upsell_ready: "Pregătește ofertă",
    upsell_due: "Relansează oferta",
  };

  const signals: ClientGrowthSignal[] = [];

  for (const work of input.completedWorks) {
    const client = clientById.get(work.client_id);
    if (!client) continue;

    const growth = growthByClient.get(work.client_id) ?? null;
    const evaluation = evaluateClientGrowth(
      growth,
      { id: work.id, title: work.title, completedAt: work.completed_at },
      input.now
    );
    if (evaluation.action === "none") continue;

    const rule = rules[evaluation.action];
    if (!rule) continue;

    const sortAt =
      evaluation.action === "upsell_due" && growth?.upsell_next_at
        ? growth.upsell_next_at
        : evaluation.action === "feedback_waiting" && growth?.feedback_requested_at
          ? growth.feedback_requested_at
          : evaluation.action === "review_waiting" && growth?.review_requested_at
            ? growth.review_requested_at
            : evaluation.action === "referral_waiting" && growth?.referral_requested_at
              ? growth.referral_requested_at
              : work.completed_at;

    signals.push({
      key: `growth:${evaluation.action}:${client.id}`,
      rule,
      title: `${evaluation.label} · ${client.name}`,
      meta: evaluation.detail,
      level: evaluation.level,
      sortAt,
      clientId: client.id,
      taskId: work.id,
      actionLabel: labels[evaluation.action] ?? "Deschide clientul",
    });
  }

  return signals;
}
