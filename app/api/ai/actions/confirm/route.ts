import { NextResponse } from "next/server";
import { decideMutationProposal } from "@/lib/ai/action-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function responseError(code: string) {
  const status =
    code === "AUTH_REQUIRED" ? 401 :
    code === "ORG_ACCESS_REQUIRED" || code === "MUTATION_ROLE_REQUIRED" ? 403 :
    [
      "PROPOSAL_EXPIRED","PROPOSAL_ALREADY_EXECUTED","PROPOSAL_NOT_PENDING","MODULE_NOT_AVAILABLE",
      "CLIENT_NOT_FOUND","CLIENT_AMBIGUOUS","TASK_NOT_FOUND","TASK_AMBIGUOUS","TASK_CLIENT_MISMATCH",
      "INVALID_ESTIMATE_TITLE","INVALID_ESTIMATE_ITEMS","INVALID_ESTIMATE_QUANTITY",
      "INVALID_ESTIMATE_UNIT_PRICE","INVALID_ESTIMATE_TAX","INVALID_ESTIMATE_VALID_UNTIL",
      "INVALID_ESTIMATE_CURRENCY","INVALID_ESTIMATE_DISCOUNT","INVALID_ESTIMATE_LABOR",
      "INVALID_ESTIMATE_OTHER_COST"
    ].includes(code) ? 409 :
    500;

  const message =
    code === "PROPOSAL_EXPIRED" ? "Propunerea a expirat. Cere din nou acțiunea." :
    code === "PROPOSAL_ALREADY_EXECUTED" ? "Acțiunea a fost deja executată." :
    code === "PROPOSAL_NOT_PENDING" ? "Propunerea nu mai este disponibilă pentru confirmare." :
    code === "MODULE_NOT_AVAILABLE" ? "Modulul necesar nu mai este activ." :
    code === "CLIENT_NOT_FOUND" ? "Clientul indicat nu a fost găsit exact în această firmă." :
    code === "CLIENT_AMBIGUOUS" ? "Există mai multe potriviri pentru client. Folosește numele exact." :
    code === "TASK_NOT_FOUND" ? "Lucrarea indicată nu a fost găsită exact în această firmă." :
    code === "TASK_AMBIGUOUS" ? "Există mai multe lucrări cu acest titlu. Folosește titlul exact sau redenumește una dintre ele." :
    code === "TASK_CLIENT_MISMATCH" ? "Clientul indicat nu corespunde clientului legat deja de lucrare." :
    code.startsWith("INVALID_ESTIMATE_") ? "Devizul propus conține date invalide. Reformulează cererea cu poziții, cantități și prețuri explicite." :
    status === 403 ? "Rolul tău nu permite această acțiune." :
    status === 401 ? "Sesiunea a expirat." :
    "Acțiunea ORBYVEN nu a putut fi executată.";

  return NextResponse.json(
    { error: message, code },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const organizationId = typeof body.organizationId === "string" ? body.organizationId.trim() : "";
    const proposalId = typeof body.proposalId === "string" ? body.proposalId.trim() : "";
    const decision = body.decision === "reject" ? "reject" : body.decision === "confirm" ? "confirm" : null;

    if (!/^[a-f0-9-]{36}$/i.test(organizationId) || !/^[a-f0-9-]{36}$/i.test(proposalId) || !decision) {
      return NextResponse.json(
        { error: "Cerere invalidă." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const result = await decideMutationProposal(request, organizationId, proposalId, decision);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (![
      "AUTH_REQUIRED","ORG_ACCESS_REQUIRED","MUTATION_ROLE_REQUIRED",
      "PROPOSAL_EXPIRED","PROPOSAL_ALREADY_EXECUTED","PROPOSAL_NOT_PENDING",
      "MODULE_NOT_AVAILABLE","CLIENT_NOT_FOUND","CLIENT_AMBIGUOUS",
      "TASK_NOT_FOUND","TASK_AMBIGUOUS","TASK_CLIENT_MISMATCH",
      "INVALID_ESTIMATE_TITLE","INVALID_ESTIMATE_ITEMS","INVALID_ESTIMATE_QUANTITY",
      "INVALID_ESTIMATE_UNIT_PRICE","INVALID_ESTIMATE_TAX","INVALID_ESTIMATE_VALID_UNTIL",
      "INVALID_ESTIMATE_CURRENCY","INVALID_ESTIMATE_DISCOUNT","INVALID_ESTIMATE_LABOR",
      "INVALID_ESTIMATE_OTHER_COST"
    ].includes(code)) {
      console.error("ORBYVEN AI action failure", error);
    }
    return responseError(code);
  }
}
