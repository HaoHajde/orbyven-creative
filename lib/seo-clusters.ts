import type { SeoLink } from "@/lib/seo-foundation";

export type SeoClusterLink = SeoLink & {
  copy: string;
};

const clusters: Record<string, SeoClusterLink[]> = {
  "/creare-site": [
    { href: "/site-prezentare", label: "Site de prezentare pentru firme", copy: "Vezi cum structurăm un site care explică serviciile, dovada și contactul fără pagini inutile." },
    { href: "/ghid/ce-trebuie-sa-contina-site-ul-unei-firme", label: "Structura unui site de firmă", copy: "Un ghid practic despre ce trebuie să găsească un client înainte să trimită o cerere." },
    { href: "/studii-de-caz", label: "Studii de caz ORBYVEN", copy: "Explorează piloți pentru servicii de teren, evenimente și business-uri vizuale." },
  ],
  "/site-prezentare": [
    { href: "/creare-site", label: "Creare site profesional", copy: "Pornește de la arhitectură, design, mobile și traseul către contact." },
    { href: "/ghid/cat-costa-un-site-de-prezentare", label: "Ce influențează costul unui site", copy: "Compară structura, funcțiile și costurile recurente înainte să compari doar prețul." },
    { href: "/studii-de-caz", label: "Exemple și piloți", copy: "Vezi cum se schimbă site-ul în funcție de industrie și fluxul real de lucru." },
  ],
  "/web-design-bucuresti": [
    { href: "/creare-site", label: "Creare site pentru firme", copy: "Serviciul complet pentru companii care vor o prezență clară, rapidă și extensibilă." },
    { href: "/site-pentru-firme-mici", label: "Site pentru firme mici", copy: "O fundație digitală fără funcții cumpărate înainte să existe nevoia." },
    { href: "/studii-de-caz", label: "Portofoliu și studii de caz", copy: "Vezi direcții construite pentru mai multe tipuri de business." },
  ],
  "/redesign-site": [
    { href: "/ghid/cand-merita-redesign-site", label: "Când merită un redesign", copy: "Separă problemele de structură, mobile, performanță și SEO de simplele preferințe vizuale." },
    { href: "/creare-site", label: "Reconstrucție și creare site", copy: "Vezi fundația folosită pentru un website nou sau o refacere majoră." },
    { href: "/studii-de-caz", label: "Studii de caz ORBYVEN", copy: "Compară mai multe direcții înainte să alegi ce merită păstrat sau refăcut." },
  ],
  "/site-pentru-firme-mici": [
    { href: "/ghid/site-sau-facebook-pentru-afacere", label: "Site sau Facebook pentru afacere?", copy: "Înțelege rolul fiecărui canal și de ce nu rezolvă aceeași problemă." },
    { href: "/ghid/ce-trebuie-sa-contina-site-ul-unei-firme", label: "Ce trebuie să conțină site-ul firmei", copy: "O structură compactă pentru ofertă, dovadă, proces și contact." },
    { href: "/studii-de-caz", label: "Piloți pentru firme de servicii", copy: "Vezi exemple construite în jurul unor fluxuri reale, nu doar al unei teme vizuale." },
  ],
  "/site-pentru-instalatori": [
    { href: "/studii-de-caz/neagu-costica-srl", label: "Pilot instalații · Neagu Costică SRL", copy: "Website, lead, vizită, deviz și materiale legate în același flux." },
    { href: "/site-prezentare", label: "Site de prezentare pentru servicii", copy: "Structura de bază pentru servicii, zone de lucru, lucrări și contact." },
    { href: "/ghid/ce-trebuie-sa-contina-site-ul-unei-firme", label: "Structura unui site de firmă", copy: "Ce informații trebuie să găsească rapid un client înainte de apel sau ofertă." },
  ],
  "/site-pentru-detailing-auto": [
    { href: "/studii-de-caz/haos-customs", label: "Pilot detailing · Hao's Customs", copy: "Before/after, configurator și traseu către estimare și programare." },
    { href: "/site-prezentare", label: "Site de prezentare premium", copy: "Organizează serviciile, portofoliul și contactul într-o experiență ușor de parcurs." },
    { href: "/ghid/ce-trebuie-sa-contina-site-ul-unei-firme", label: "Ce trebuie să conțină un site de firmă", copy: "Un ghid pentru ofertă, dovadă, proces și conversie." },
  ],
  "/site-pentru-servicii-evenimente": [
    { href: "/studii-de-caz/obsidian-moments", label: "Pilot evenimente · Obsidian Moments", copy: "Pachete, disponibilitate și contact într-un traseu simplu pentru data evenimentului." },
    { href: "/site-prezentare", label: "Site de prezentare pentru servicii", copy: "O bază clară pentru servicii vizuale, pachete, portofoliu și contact." },
    { href: "/ghid/ce-trebuie-sa-contina-site-ul-unei-firme", label: "Structura unui site de servicii", copy: "Ce informații reduc întrebările inutile înainte de primul mesaj." },
  ],
  "/studii-de-caz/obsidian-moments": [
    { href: "/site-pentru-servicii-evenimente", label: "Site pentru servicii de evenimente", copy: "Vezi soluția comercială din spatele pilotului și cum poate fi adaptată unei firme reale." },
    { href: "/ghid/ce-trebuie-sa-contina-site-ul-unei-firme", label: "Structura unui site de firmă", copy: "Context pentru ofertă, dovadă, proces și contact." },
    { href: "/creare-site", label: "Creare site profesional", copy: "Pornește de la fundația ORBYVEN pentru un proiect nou." },
  ],
  "/studii-de-caz/neagu-costica-srl": [
    { href: "/site-pentru-instalatori", label: "Site pentru instalatori", copy: "Soluția comercială pentru firme de instalații și field service." },
    { href: "/ghid/ce-trebuie-sa-contina-site-ul-unei-firme", label: "Ce trebuie să conțină site-ul firmei", copy: "Un checklist de structură înainte de design și automatizări." },
    { href: "/creare-site", label: "Creare site și flux digital", copy: "Vezi fundația pe care pot fi adăugate ulterior modulele operaționale." },
  ],
  "/studii-de-caz/viaforte-asfaltari": [
    { href: "/site-pentru-firme-mici", label: "Site pentru firme de servicii", copy: "O structură compactă pentru ofertă, lucrări, zone de lucru și contact." },
    { href: "/site-prezentare", label: "Site de prezentare", copy: "Vezi cum organizăm serviciile și dovada vizuală pentru un business de teren." },
    { href: "/creare-site", label: "Creare site profesional", copy: "Fundația ORBYVEN pentru proiecte care trebuie să poată crește ulterior." },
  ],
  "/studii-de-caz/haos-customs": [
    { href: "/site-pentru-detailing-auto", label: "Site pentru detailing auto", copy: "Soluția comercială construită în jurul imaginilor, pachetelor și programării." },
    { href: "/ghid/ce-trebuie-sa-contina-site-ul-unei-firme", label: "Structura unui site de firmă", copy: "Ce trebuie să rămână clar chiar și într-o experiență vizuală premium." },
    { href: "/creare-site", label: "Creare site profesional", copy: "Pornește de la arhitectură, mobile și traseul către cerere." },
  ],
  "/ghid/cat-costa-un-site-de-prezentare": [
    { href: "/site-prezentare", label: "Site de prezentare profesional", copy: "Vezi ce include efectiv serviciul și ce poate fi extins ulterior." },
    { href: "/creare-site", label: "Creare site pentru firme", copy: "Fundația completă pentru un proiect nou." },
    { href: "/studii-de-caz", label: "Compară implementări reale din proiect", copy: "Piloții arată cum complexitatea diferă între industrii." },
  ],
  "/ghid/ce-trebuie-sa-contina-site-ul-unei-firme": [
    { href: "/site-pentru-firme-mici", label: "Site pentru firme mici", copy: "Aplică structura într-o versiune compactă și extensibilă." },
    { href: "/site-prezentare", label: "Site de prezentare", copy: "Vezi cum transformăm structura într-o experiență publică." },
    { href: "/studii-de-caz", label: "Studii de caz ORBYVEN", copy: "Compară aceeași fundație în verticale diferite." },
  ],
  "/ghid/cand-merita-redesign-site": [
    { href: "/redesign-site", label: "Serviciu de redesign website", copy: "Vezi abordarea ORBYVEN pentru audit, păstrarea URL-urilor utile și reconstrucție." },
    { href: "/creare-site", label: "Creare site", copy: "Compară redesignul cu scenariul unei fundații complet noi." },
    { href: "/studii-de-caz", label: "Vezi implementări ORBYVEN", copy: "Exemple de direcții vizuale și fluxuri pentru industrii diferite." },
  ],
  "/ghid/site-sau-facebook-pentru-afacere": [
    { href: "/site-pentru-firme-mici", label: "Site pentru firme mici", copy: "O fundație proprie pentru ofertă, contact și pagini găsite prin căutare." },
    { href: "/creare-site", label: "Creare site profesional", copy: "Vezi cum poate arăta canalul digital pe care îl controlezi." },
    { href: "/studii-de-caz", label: "Exemple de site-uri și piloți", copy: "Explorează moduri diferite de a transforma atenția în cerere." },
  ],
};

const genericCopy: Record<string, string> = {
  "/contact": "Trimite contextul proiectului direct către ORBYVEN.",
  "/templates": "Explorează biblioteca de modele și demo-uri interactive.",
  "/studii-de-caz": "Vezi piloți și implementări pe mai multe verticale.",
  "/servicii": "Descoperă serviciile digitale ORBYVEN.",
};

function isIndexableClusterTarget(href: string) {
  return !(
    href.startsWith("/templates/") ||
    href.startsWith("/demo/") ||
    href.startsWith("/orbyven-demos/") ||
    href.startsWith("/workspace") ||
    href.startsWith("/admin") ||
    href.startsWith("/control-center")
  );
}

export function getSeoClusterLinks(currentPath: string, fallback: SeoLink[]): SeoClusterLink[] {
  const preferred = clusters[currentPath] ?? [];
  const allowedFallback = fallback
    .filter((item) => isIndexableClusterTarget(item.href))
    .map((item) => ({ ...item, copy: genericCopy[item.href] ?? "Continuă către o pagină relevantă pentru aceeași nevoie." }));

  const seen = new Set<string>();
  return [...preferred, ...allowedFallback]
    .filter((item) => item.href !== currentPath && isIndexableClusterTarget(item.href))
    .filter((item) => {
      if (seen.has(item.href)) return false;
      seen.add(item.href);
      return true;
    })
    .slice(0, 3);
}
