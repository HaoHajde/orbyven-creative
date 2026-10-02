import type { BillingActor } from "@/lib/billing/supabase-server";
import { answerBusinessBriefing } from "@/lib/ai/business-briefing";
import type {
  IntelligenceDecisionOption,
  IntelligenceFocusReason,
  IntelligenceResponse,
} from "@/lib/ai/intelligence-types";
import type { OrbyvenModuleId } from "@/lib/orbyven-modules";

const OPTIONS: Record<IntelligenceFocusReason, IntelligenceDecisionOption[]> = {
  blocked: [
    {
      label: "Deblocare imediată",
      impact: "Repornește fluxul și limitează propagarea întârzierii.",
      tradeoff: "Consumă atenție și resurse chiar acum.",
      whenToUse: "Blocajul poate fi rezolvat rapid de echipă.",
    },
    {
      label: "Clarifică dependența",
      impact: "Face cauza și ownership-ul explicite înainte de execuție.",
      tradeoff: "Nu produce progres operațional imediat.",
      whenToUse: "Nu este clar cine sau ce ține lucrarea pe loc.",
    },
    {
      label: "Reprogramare controlată",
      impact: "Protejează restul agendei și resursele deja angajate.",
      tradeoff: "Mută termenul și poate necesita comunicare cu clientul.",
      whenToUse: "Blocajul depinde de un factor extern care nu poate fi grăbit.",
    },
  ],
  overdue: [
    {
      label: "Finalizează acum",
      impact: "Reduce direct restanța și presiunea asupra clientului.",
      tradeoff: "Poate împinge alte activități din agenda curentă.",
      whenToUse: "Lucrarea este aproape de final sau are impact mare.",
    },
    {
      label: "Livrează o etapă",
      impact: "Produce progres vizibil și poate debloca pași dependenți.",
      tradeoff: "Necesită separarea clară a ce rămâne de făcut.",
      whenToUse: "Lucrarea poate fi împărțită într-un rezultat intermediar util.",
    },
    {
      label: "Renegociază termenul",
      impact: "Transformă întârzierea într-un plan explicit și urmărit.",
      tradeoff: "Termenul final se mută și trebuie comunicat.",
      whenToUse: "Finalizarea imediată nu este realistă cu resursele actuale.",
    },
  ],
  priority: [
    {
      label: "Execuție prioritară",
      impact: "Pune lucrarea în fața activităților mai flexibile.",
      tradeoff: "Alte taskuri pot fi împinse.",
      whenToUse: "Prioritatea reflectă un termen sau un client sensibil.",
    },
    {
      label: "Confirmă resursele",
      impact: "Reduce riscul ca prioritatea mare să rămână doar o etichetă.",
      tradeoff: "Necesită verificarea oamenilor, timpului și dependențelor.",
      whenToUse: "Lucrarea este importantă, dar pregătirea nu este confirmată.",
    },
    {
      label: "Reordonează agenda",
      impact: "Eliberează un interval clar pentru execuție.",
      tradeoff: "Schimbă ordinea altor activități.",
      whenToUse: "Problema principală este lipsa unui slot de lucru.",
    },
  ],
  unassigned: [
    {
      label: "Alocă responsabil",
      impact: "Creează ownership imediat pentru următorul pas.",
      tradeoff: "Poate încărca persoana aleasă.",
      whenToUse: "Există un coleg disponibil și potrivit.",
    },
    {
      label: "Owner temporar",
      impact: "Asigură coordonare până la alocarea definitivă.",
      tradeoff: "Responsabilitatea rămâne provizorie.",
      whenToUse: "Execuția trebuie să pornească înainte de alocarea finală.",
    },
    {
      label: "Reprogramează",
      impact: "Evită o programare fără persoană responsabilă.",
      tradeoff: "Mută execuția în calendar.",
      whenToUse: "Nu există momentan capacitate disponibilă.",
    },
  ],
  unplanned: [
    {
      label: "Programează lucrarea",
      impact: "O aduce în agenda operațională și îi dă un moment clar.",
      tradeoff: "Ocupă capacitate în calendar.",
      whenToUse: "Lucrarea este validă și poate fi executată.",
    },
    {
      label: "Setează termen",
      impact: "Creează un prag clar fără a bloca încă un slot exact.",
      tradeoff: "Nu rezervă resurse.",
      whenToUse: "Știi când trebuie terminată, dar nu când va fi executată.",
    },
    {
      label: "Clarifică relevanța",
      impact: "Elimină munca veche care nu mai are motiv să rămână deschisă.",
      tradeoff: "Necesită o verificare înainte de închidere sau amânare.",
      whenToUse: "Lucrarea stă fără termen deoarece scopul ei nu mai este clar.",
    },
  ],
  lead_followup: [
    {
      label: "Contact direct",
      impact: "Reduce timpul fără răspuns și repornește conversația comercială.",
      tradeoff: "Necesită atenție imediată din partea echipei.",
      whenToUse: "Ai suficiente informații pentru următorul contact.",
    },
    {
      label: "Pregătește contextul",
      impact: "Crește calitatea următorului contact cu informații relevante.",
      tradeoff: "Amână puțin contactul efectiv.",
      whenToUse: "Lipsesc detalii despre nevoie, ofertă sau discuția anterioară.",
    },
    {
      label: "Reprogramează follow-up-ul",
      impact: "Păstrează lead-ul vizibil fără contact forțat acum.",
      tradeoff: "Oportunitatea rămâne în așteptare.",
      whenToUse: "Există un motiv concret pentru a reveni mai târziu.",
    },
  ],
  estimate_followup: [
    {
      label: "Follow-up comercial",
      impact: "Cere un răspuns și poate debloca decizia clientului.",
      tradeoff: "Necesită un contact comercial acum.",
      whenToUse: "Oferta este încă relevantă și nu necesită modificări.",
    },
    {
      label: "Revizuiește oferta",
      impact: "Corectează prețul, conținutul sau valabilitatea înainte de contact.",
      tradeoff: "Consumă timp înainte de următorul follow-up.",
      whenToUse: "Contextul sau costurile s-au schimbat.",
    },
    {
      label: "Stabilește următorul contact",
      impact: "Păstrează oportunitatea în flux cu un checkpoint clar.",
      tradeoff: "Decizia comercială rămâne deschisă.",
      whenToUse: "Clientul a indicat că are nevoie de timp.",
    },
  ],
  appointment: [
    {
      label: "Confirmă pregătirea",
      impact: "Reduce riscul unei programări începute fără context sau resurse.",
      tradeoff: "Necesită o verificare înainte de execuție.",
      whenToUse: "Programarea rămâne valabilă și trebuie executată.",
    },
    {
      label: "Reordonează agenda",
      impact: "Eliberează spațiu în jurul programării importante.",
      tradeoff: "Mută alte activități.",
      whenToUse: "Agenda din jur este prea încărcată.",
    },
    {
      label: "Reprogramează controlat",
      impact: "Evită o execuție nepregătită.",
      tradeoff: "Mută angajamentul și poate necesita confirmarea clientului.",
      whenToUse: "Resursele sau condițiile necesare nu sunt disponibile.",
    },
  ],
};

export async function answerDecisionSupport(
  actor: BillingActor,
  available: Set<OrbyvenModuleId>
): Promise<IntelligenceResponse> {
  const briefing = await answerBusinessBriefing(actor, available);
  const focus = briefing.focus;
  const subject = briefing.facts.find((fact) => fact.label === "Focus #1")?.value;

  if (!focus || !focus.reason || !subject) {
    return {
      specialist: "operations",
      answer: "Nu există acum un Focus #1 suficient de clar pentru o comparație de opțiuni.",
      facts: briefing.facts,
      actions: briefing.actions,
      generatedBy: "orbyven_core",
    };
  }

  return {
    specialist: "operations",
    answer: `Pentru „${subject}” ai 3 abordări valide, cu compromisuri diferite. ORBYVEN îți arată efectele; alegerea rămâne la tine.`,
    facts: briefing.facts,
    actions: briefing.actions.slice(0, 1),
    focus,
    decision: {
      subject,
      options: OPTIONS[focus.reason],
      confidence: "high",
    },
    generatedBy: "orbyven_core",
  };
}
