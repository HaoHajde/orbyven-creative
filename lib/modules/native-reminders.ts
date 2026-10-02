import type { CrmLead } from "@/lib/modules/leads";

type NativeCrmFollowUpMessage =
  | {
      type: "orbyven:schedule-crm-follow-up";
      leadId: string;
      name: string;
      company?: string | null;
      followUpAt: string;
    }
  | {
      type: "orbyven:cancel-crm-follow-up";
      leadId: string;
    };

type NativeBridgeWindow = Window & {
  ReactNativeWebView?: { postMessage: (payload: string) => void };
};

function postNativeReminder(message: NativeCrmFollowUpMessage) {
  if (typeof window === "undefined") return;
  (window as NativeBridgeWindow).ReactNativeWebView?.postMessage(
    JSON.stringify(message)
  );
}

export function syncNativeCrmFollowUp(
  lead: Pick<
    CrmLead,
    "id" | "kind" | "stage" | "name" | "company" | "next_follow_up_at"
  >
) {
  const inactiveLead =
    lead.kind === "lead" && (lead.stage === "won" || lead.stage === "lost");

  if (!lead.next_follow_up_at || inactiveLead) {
    postNativeReminder({
      type: "orbyven:cancel-crm-follow-up",
      leadId: lead.id,
    });
    return;
  }

  postNativeReminder({
    type: "orbyven:schedule-crm-follow-up",
    leadId: lead.id,
    name: lead.name,
    company: lead.company,
    followUpAt: lead.next_follow_up_at,
  });
}
