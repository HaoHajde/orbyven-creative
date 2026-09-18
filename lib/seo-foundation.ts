import type { Metadata } from "next";

import { getSiteUrl } from "@/lib/site-config";

export type SeoLink = {
  href: string;
  label: string;
};

export type SeoLandingPage = {
  slug: string;
  path: string;
  title: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  proof: { title: string; copy: string }[];
  deliverables: { title: string; copy: string }[];
  steps: { number: string; title: string; copy: string }[];
  faq: { question: string; answer: string }[];
  related: SeoLink[];
};

export type SeoCaseStudy = {
  slug: string;
  path: string;
  title: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  context: string[];
  built: { title: string; copy: string }[];
  flow: { number: string; title: string; copy: string }[];
  note: string;
  demoHref: string;
  demoLabel: string;
  related: SeoLink[];
};

export type SeoGuide = {
  slug: string;
  path: string;
  title: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  sections: { title: string; paragraphs: string[]; bullets?: string[] }[];
  related: SeoLink[];
};

export const seoLandingPages: SeoLandingPage[] = [
  {
    slug: "creare-site",
    path: "/creare-site",
    title: "Creare site",
    metaTitle: "Creare site profesional pentru firme | ORBYVEN",
    description:
      "Creare site profesional pentru firme din România: structură clară, design premium, mobile-first, SEO tehnic și traseu simplu către contact.",
    eyebrow: "Creare site · România",
    h1: "Un site care explică repede de ce merită să fii ales.",
    intro:
      "ORBYVEN construiește website-uri pentru firme care vor mai mult decât o prezență online. Pornim de la ce trebuie să înțeleagă clientul, reducem zgomotul și legăm site-ul de fluxul real al afacerii.",
    primaryKeyword: "creare site",
    secondaryKeywords: ["creare website", "site profesional", "realizare site firmă", "website business"],
    proof: [
      { title: "Mesaj clar", copy: "Vizitatorul înțelege rapid ce oferi, cui te adresezi și care este următorul pas." },
      { title: "Mobile-first", copy: "Interfața este gândită pentru telefon înainte să fie doar micșorată de pe desktop." },
      { title: "SEO tehnic", copy: "Structură semantică, metadata, sitemap, canonical și schema pregătite pentru indexare." },
    ],
    deliverables: [
      { title: "Arhitectură", copy: "Pagini și secțiuni construite în jurul intenției reale a clienților." },
      { title: "Design", copy: "Identitate vizuală coerentă, fără template generic lipit peste logo." },
      { title: "Conversie", copy: "CTA-uri, formular, WhatsApp sau programare acolo unde au sens pentru business." },
      { title: "Fundație pentru creștere", copy: "Site-ul poate fi extins ulterior cu workspace, lead-uri, programări și automatizări." },
    ],
    steps: [
      { number: "01", title: "Clarificăm oferta", copy: "Stabilim serviciile, publicul și acțiunea pe care vrei să o facă vizitatorul." },
      { number: "02", title: "Construim traseul", copy: "Organizăm conținutul și designul astfel încât să nu existe drumuri inutile." },
      { number: "03", title: "Lansăm și măsurăm", copy: "Verificăm mobile, SEO tehnic, formulare și indexarea după lansare." },
    ],
    faq: [
      { question: "Este inclusă optimizarea pentru Google?", answer: "Da. Fundația tehnică SEO este parte din construcție: metadata, structură semantică, sitemap, robots, canonical și schema unde este relevantă." },
      { question: "Site-ul poate avea și funcții de business?", answer: "Da. ORBYVEN poate lega site-ul public de module precum lead-uri, calendar, devize sau alte fluxuri operaționale, în funcție de proiect." },
      { question: "Lucrați doar în București?", answer: "Nu. Proiectele digitale pot fi realizate pentru firme din toată România, iar colaborarea se poate desfășura online." },
    ],
    related: [
      { href: "/site-prezentare", label: "Site de prezentare" },
      { href: "/web-design-bucuresti", label: "Web design București" },
      { href: "/site-pentru-firme-mici", label: "Site pentru firme mici" },
    ],
  },
  {
    slug: "site-prezentare",
    path: "/site-prezentare",
    title: "Site de prezentare",
    metaTitle: "Site de prezentare profesional | ORBYVEN",
    description:
      "Site de prezentare modern pentru firme: servicii explicate clar, portofoliu, contact, SEO tehnic și experiență rapidă pe mobil.",
    eyebrow: "Site de prezentare",
    h1: "Prezinți firma fără să obligi omul să caute răspunsurile.",
    intro:
      "Un site de prezentare bun nu este un pliant digital. El răspunde rapid la întrebările care apar înaintea unui apel: ce faci, pentru cine, unde lucrezi, cum arată munca ta și cum poate începe colaborarea.",
    primaryKeyword: "site de prezentare",
    secondaryKeywords: ["creare site de prezentare", "website prezentare firmă", "site firmă", "site servicii"],
    proof: [
      { title: "Oferta la vedere", copy: "Serviciile importante sunt explicate fără meniuri inutile și texte generale." },
      { title: "Încredere", copy: "Portofoliul, procesul și datele de contact apar exact unde vizitatorul are nevoie de ele." },
      { title: "Pregătit pentru Google", copy: "Fiecare pagină importantă poate avea propriul subiect, titlu, descriere și canonical." },
    ],
    deliverables: [
      { title: "Acasă", copy: "Poziționare, diferențiator și traseu către serviciile importante." },
      { title: "Servicii", copy: "Pagini sau secțiuni care răspund intențiilor comerciale reale." },
      { title: "Portofoliu", copy: "Exemple prezentate cu suficient context ca să construiască încredere." },
      { title: "Contact", copy: "Formular, telefon, WhatsApp sau programare, fără pași inutili." },
    ],
    steps: [
      { number: "01", title: "Inventariem informația", copy: "Eliminăm ce nu ajută și păstrăm ce răspunde unei întrebări reale." },
      { number: "02", title: "Construim paginile", copy: "Fiecare pagină are un scop clar și o acțiune următoare." },
      { number: "03", title: "Pregătim indexarea", copy: "Canonical, sitemap, robots și Search Console sunt verificate după lansare." },
    ],
    faq: [
      { question: "Câte pagini trebuie să aibă un site de prezentare?", answer: "Nu există un număr fix. Structura trebuie să acopere serviciile și întrebările importante fără să creeze pagini doar pentru volum." },
      { question: "Poate fi extins ulterior?", answer: "Da. Arhitectura poate porni simplu și poate crește cu pagini noi, module ORBYVEN sau integrări." },
      { question: "Pot porni de la un template?", answer: "Da. Template-urile ORBYVEN sunt direcții de pornire, apoi conținutul, brandingul și funcțiile sunt adaptate afacerii." },
    ],
    related: [
      { href: "/creare-site", label: "Creare site" },
      { href: "/redesign-site", label: "Redesign site" },
      { href: "/templates", label: "Vezi template-urile" },
    ],
  },
  {
    slug: "web-design-bucuresti",
    path: "/web-design-bucuresti",
    title: "Web design București",
    metaTitle: "Web design București pentru firme | ORBYVEN",
    description:
      "Web design în București pentru firme care vor un site clar, rapid și ușor de folosit: strategie, design, dezvoltare, SEO tehnic și suport la lansare.",
    eyebrow: "Web design · București",
    h1: "Web design pentru firme din București care nu vor un site generic.",
    intro:
      "Competiția locală este mare, iar un website nu câștigă doar pentru că arată modern. Trebuie să explice oferta, să funcționeze impecabil pe mobil și să ofere Google o structură ușor de înțeles.",
    primaryKeyword: "web design București",
    secondaryKeywords: ["creare site București", "agenție web design București", "website firmă București", "site prezentare București"],
    proof: [
      { title: "Context local", copy: "Putem construi pagini pentru serviciile și zonele reale în care lucrezi, fără pagini artificiale pentru fiecare sector." },
      { title: "Design premium", copy: "Interfața pornește din identitatea firmei și din comportamentul utilizatorului, nu dintr-un catalog generic." },
      { title: "SEO fără artificii", copy: "Structura urmărește intenția de căutare și evită paginile repetitive create doar pentru cuvinte-cheie." },
    ],
    deliverables: [
      { title: "Strategie de pagini", copy: "Stabilim ce merită pagină separată și ce poate rămâne într-o secțiune." },
      { title: "UX mobil", copy: "Navigație, CTA-uri și formulare proiectate pentru utilizarea de pe telefon." },
      { title: "SEO local de bază", copy: "Titluri, descrieri, structură și date locale doar acolo unde pot fi susținute real." },
      { title: "Lansare monitorizată", copy: "Search Console, sitemap și indexarea sunt verificate după publicare." },
    ],
    steps: [
      { number: "01", title: "Brief scurt", copy: "Înțelegem serviciile, clienții și acoperirea reală a firmei." },
      { number: "02", title: "Design și dezvoltare", copy: "Construim paginile principale și traseele de conversie." },
      { number: "03", title: "Lansare", copy: "Conectăm domeniul, verificăm indexarea și remediem problemele tehnice." },
    ],
    faq: [
      { question: "Trebuie să am sediul în București?", answer: "Nu pentru colaborarea cu ORBYVEN. Pagina este relevantă pentru firme care servesc piața din București și pot susține această acoperire." },
      { question: "Faceți și redesign?", answer: "Da. Putem păstra URL-urile și conținutul valoros și reconstrui experiența fără să ignorăm SEO-ul existent." },
      { question: "Pot avea pagini pentru mai multe servicii?", answer: "Da. Le separăm atunci când există intenții distincte de căutare și suficient conținut util pentru fiecare." },
    ],
    related: [
      { href: "/creare-site", label: "Creare site" },
      { href: "/redesign-site", label: "Redesign site" },
      { href: "/contact", label: "Discută proiectul" },
    ],
  },
  {
    slug: "redesign-site",
    path: "/redesign-site",
    title: "Redesign site",
    metaTitle: "Redesign site și refacere website | ORBYVEN",
    description:
      "Redesign de site pentru firme: audit, structură nouă, UX modern, mobile, păstrarea URL-urilor valoroase și migrare SEO controlată.",
    eyebrow: "Redesign · Refacere website",
    h1: "Schimbi experiența fără să arunci ce funcționează deja.",
    intro:
      "Un redesign bun nu înseamnă doar culori noi. Inventariem paginile și traseele existente, păstrăm semnalele utile și reconstruim ce este neclar, lent sau greu de folosit.",
    primaryKeyword: "redesign site",
    secondaryKeywords: ["refacere site", "redesign website", "modernizare site", "refacere website firmă"],
    proof: [
      { title: "Audit înainte de design", copy: "Identificăm ce merită păstrat înainte să schimbăm structura sau URL-urile." },
      { title: "Migrare controlată", copy: "URL-urile eliminate primesc redirecturi relevante, nu sunt lăsate să devină 404." },
      { title: "SEO protejat", copy: "Metadata, canonical, internal linking și sitemap sunt reconstruite odată cu site-ul." },
    ],
    deliverables: [
      { title: "Inventar URL", copy: "Listă clară cu pagini păstrate, consolidate, mutate sau eliminate." },
      { title: "Arhitectură nouă", copy: "Navigație și structură aliniate modului în care oamenii caută și compară." },
      { title: "Design & development", copy: "Experiență nouă, responsive și mai simplă de parcurs." },
      { title: "Plan de redirecturi", copy: "Mapare 301 pentru paginile care își schimbă adresa." },
    ],
    steps: [
      { number: "01", title: "Audităm site-ul actual", copy: "Paginile, linkurile și rolul lor sunt inventariate înainte de redesign." },
      { number: "02", title: "Construim noua versiune", copy: "Structura și designul sunt testate înainte să înlocuiască site-ul live." },
      { number: "03", title: "Migrăm și monitorizăm", copy: "Redirecturile, sitemap-ul și Search Console sunt urmărite după lansare." },
    ],
    faq: [
      { question: "Pot pierde poziții după un redesign?", answer: "Orice migrare poate produce schimbări, dar riscul scade mult când URL-urile, redirecturile, canonical și internal linking sunt planificate înainte de lansare." },
      { question: "Trebuie refăcut tot?", answer: "Nu. Dacă anumite pagini, texte sau funcții sunt bune, le păstrăm și reconstruim doar ce este necesar." },
      { question: "Puteți păstra domeniul actual?", answer: "Da. Redesignul nu presupune schimbarea domeniului dacă nu există un motiv real pentru asta." },
    ],
    related: [
      { href: "/ghid/cand-merita-redesign-site", label: "Când merită un redesign" },
      { href: "/creare-site", label: "Creare site" },
      { href: "/contact", label: "Cere un audit" },
    ],
  },
  {
    slug: "site-pentru-firme-mici",
    path: "/site-pentru-firme-mici",
    title: "Site pentru firme mici",
    metaTitle: "Site pentru firme mici și afaceri locale | ORBYVEN",
    description:
      "Site pentru firme mici: prezentare clară, servicii, contact, WhatsApp, SEO tehnic și opțiunea de a adăuga ulterior module de business.",
    eyebrow: "Firme mici · Afaceri locale",
    h1: "Un site suficient de simplu ca să fie folosit. Suficient de bun ca să inspire încredere.",
    intro:
      "Firmele mici nu au nevoie de zeci de pagini și funcții inutile. Au nevoie ca omul potrivit să înțeleagă serviciul, zona, diferența și cum poate lua legătura.",
    primaryKeyword: "site pentru firme mici",
    secondaryKeywords: ["creare site firmă mică", "site afacere locală", "website pentru IMM", "site pentru antreprenori"],
    proof: [
      { title: "Puține pagini, scop clar", copy: "Pornim de la minimum util și adăugăm doar ceea ce rezolvă o nevoie reală." },
      { title: "Contact rapid", copy: "Telefon, WhatsApp, formular sau programare, în funcție de modul în care lucrează firma." },
      { title: "Poate crește", copy: "Site-ul poate deveni ulterior intrarea într-un workspace cu lead-uri, calendar sau devize." },
    ],
    deliverables: [
      { title: "Prezentare", copy: "Cine ești, ce faci și ce te diferențiază." },
      { title: "Servicii", copy: "Descrieri scurte și ușor de comparat." },
      { title: "Dovadă", copy: "Lucrări, imagini sau proces, fără testimoniale inventate." },
      { title: "Contact", copy: "Un traseu simplu către mesaj, apel sau cerere." },
    ],
    steps: [
      { number: "01", title: "Alegem esențialul", copy: "Stabilim ce informație influențează cu adevărat decizia clientului." },
      { number: "02", title: "Construim versiunea 1", copy: "Lansăm o fundație curată, nu un proiect supradimensionat." },
      { number: "03", title: "Extindem când apare nevoia", copy: "Adăugăm pagini sau module după comportamentul real al afacerii." },
    ],
    faq: [
      { question: "Este suficient un site mic pentru Google?", answer: "Da, dacă paginile sunt utile, bine structurate și răspund clar intențiilor de căutare. Numărul mare de pagini nu garantează vizibilitate." },
      { question: "Pot începe fără magazin online sau CRM?", answer: "Da. Pornim doar cu funcțiile care au sens acum și păstrăm o fundație extensibilă." },
      { question: "Pot primi cereri direct din site?", answer: "Da. Formularul, WhatsApp-ul sau alte CTA-uri pot trimite cererile către fluxul stabilit pentru firmă." },
    ],
    related: [
      { href: "/site-prezentare", label: "Site de prezentare" },
      { href: "/ghid/ce-trebuie-sa-contina-site-ul-unei-firme", label: "Ce trebuie să conțină site-ul" },
      { href: "/templates", label: "Vezi exemple" },
    ],
  },
  {
    slug: "site-pentru-instalatori",
    path: "/site-pentru-instalatori",
    title: "Site pentru instalatori",
    metaTitle: "Site pentru instalatori și firme de instalații | ORBYVEN",
    description:
      "Site pentru instalatori și firme de instalații termice sau sanitare: servicii, zone de lucru, lucrări, WhatsApp, cereri și opțiuni pentru devize.",
    eyebrow: "Instalații · Field service",
    h1: "Site pentru instalatori care trebuie să aducă omul de la problemă la contact.",
    intro:
      "Cine caută un instalator poate avea o urgență sau poate compara o lucrare complexă. Website-ul trebuie să răspundă ambelor situații: contact rapid pentru intervenții și suficient context pentru proiecte mai mari.",
    primaryKeyword: "site pentru instalatori",
    secondaryKeywords: ["creare site instalator", "site firmă instalații", "website instalații termice", "site instalații sanitare"],
    proof: [
      { title: "Servicii separate", copy: "Termic, sanitar, încălzire în pardoseală sau mentenanță pot avea pagini și CTA-uri distincte." },
      { title: "Acoperire reală", copy: "Zonele de lucru și costul deplasării pot fi explicate fără pagini locale artificiale." },
      { title: "Lead → deviz", copy: "Cererea din site poate deveni lead, vizită, deviz și ofertă în workspace-ul ORBYVEN." },
    ],
    deliverables: [
      { title: "Servicii tehnice", copy: "Structurate pe nevoi, nu doar enumerate într-un singur bloc." },
      { title: "Lucrări", copy: "Galerie și explicații despre tipul proiectului, fără rezultate inventate." },
      { title: "Contact rapid", copy: "WhatsApp, telefon sau formular pentru detalii și fotografii." },
      { title: "Flux operațional", copy: "Opțional, lead-uri, vizite, devize, materiale și calendar în același ecosistem." },
    ],
    steps: [
      { number: "01", title: "Clientul descrie lucrarea", copy: "Poate trimite locația, tipul lucrării și detalii esențiale." },
      { number: "02", title: "Firma califică cererea", copy: "Lead-ul poate fi transformat în vizită sau deviz." },
      { number: "03", title: "Lucrarea intră în flux", copy: "Calendarul, materialele și task-urile rămân legate de același context." },
    ],
    faq: [
      { question: "Poate site-ul să primească poze de la clienți?", answer: "Da, dacă fluxul proiectului cere acest lucru. Upload-ul poate fi conectat la cererea sau lead-ul clientului." },
      { question: "Pot afișa doar orașele unde lucrez?", answer: "Da. Este mai sănătos SEO să afișezi acoperirea reală decât să creezi pagini pentru localități unde nu oferi efectiv servicii." },
      { question: "Aveți și un exemplu?", answer: "Da. Pilot #002 arată o direcție pentru instalații termice și sanitare, iar studiul de caz explică și fluxul operațional." },
    ],
    related: [
      { href: "/studii-de-caz/neagu-costica-srl", label: "Studiu de caz instalații" },
      { href: "/templates/pilot-002", label: "Vezi demo Pilot #002" },
      { href: "/site-pentru-firme-mici", label: "Site pentru firme mici" },
    ],
  },
  {
    slug: "site-pentru-detailing-auto",
    path: "/site-pentru-detailing-auto",
    title: "Site pentru detailing auto",
    metaTitle: "Site pentru detailing auto și servicii premium | ORBYVEN",
    description:
      "Site pentru detailing auto: servicii premium, before/after, pachete, configurator, galerie și traseu simplu către programare.",
    eyebrow: "Auto detailing · Premium service",
    h1: "Detalierea se vinde vizual. Site-ul trebuie să demonstreze diferența imediat.",
    intro:
      "Pentru detailing auto, imaginea, pachetele și încrederea contează înainte de orice descriere lungă. Construim un traseu în care clientul vede rezultatul, înțelege serviciul și ajunge rapid la estimare sau programare.",
    primaryKeyword: "site detailing auto",
    secondaryKeywords: ["web design auto", "site service detailing", "website detailing auto", "site servicii auto premium"],
    proof: [
      { title: "Before / after", copy: "Comparațiile vizuale primesc spațiu real și nu sunt ascunse într-o galerie generică." },
      { title: "Pachete clare", copy: "Interior, exterior, polish sau ceramică pot fi explicate pe niveluri și nevoi." },
      { title: "Programare", copy: "Configurația aleasă poate merge direct în calendar sau formularul de rezervare." },
    ],
    deliverables: [
      { title: "Hero vizual", copy: "Impact puternic fără să sacrificăm viteza pe mobil." },
      { title: "Galerie", copy: "Before/after și lucrări organizate după tipul serviciului." },
      { title: "Configurator", copy: "Estimare orientativă în funcție de mașină, nevoie și upgrade-uri." },
      { title: "Calendar", copy: "Selecțiile pot fi păstrate până la alegerea unui slot disponibil." },
    ],
    steps: [
      { number: "01", title: "Clientul vede rezultatul", copy: "Imaginile și diferența vizuală construiesc încrederea înaintea prețului." },
      { number: "02", title: "Alege nevoia", copy: "Pachetul și upgrade-urile sunt prezentate fără jargon inutil." },
      { number: "03", title: "Rezervă", copy: "Configurația ajunge în calendar sau cererea de programare." },
    ],
    faq: [
      { question: "Pot avea un calculator de preț?", answer: "Da. Poate fi orientativ și construit în jurul dimensiunii mașinii, stării și serviciilor selectate." },
      { question: "Before/after afectează viteza?", answer: "Nu trebuie. Imaginile pot fi optimizate și încărcate eficient, fără să transformăm galeria într-o pagină grea." },
      { question: "Aveți un demo?", answer: "Da. Pilot #005 Hao's Customs este construit exact pentru această verticală." },
    ],
    related: [
      { href: "/studii-de-caz/haos-customs", label: "Studiu de caz Hao's Customs" },
      { href: "/templates/haos-customs", label: "Vezi demo detailing" },
      { href: "/creare-site", label: "Creare site" },
    ],
  },
  {
    slug: "site-pentru-servicii-evenimente",
    path: "/site-pentru-servicii-evenimente",
    title: "Site pentru servicii evenimente",
    metaTitle: "Site pentru servicii de evenimente | ORBYVEN",
    description:
      "Site pentru servicii de evenimente: pachete, galerie, disponibilitate, prețuri, contact și calendar conectat cu fluxul de cereri.",
    eyebrow: "Events · Disponibilitate · Lead-uri",
    h1: "Un site de evenimente trebuie să răspundă la întrebarea principală: «este disponibil pentru data mea?»",
    intro:
      "În servicii de evenimente, vizitatorul compară rapid stilul, pachetele și disponibilitatea. ORBYVEN poate transforma acest traseu într-un flux clar de la inspirație la cerere.",
    primaryKeyword: "site servicii evenimente",
    secondaryKeywords: ["site firmă evenimente", "website servicii evenimente", "site 360 evenimente", "site foto video evenimente"],
    proof: [
      { title: "Disponibilitate", copy: "Calendarul poate reduce cererile pentru date deja ocupate și simplifica primul contact." },
      { title: "Pachete", copy: "Serviciile sunt comparabile fără PDF-uri trimise după primul mesaj." },
      { title: "Lead conectat", copy: "Data, serviciul și mesajul pot ajunge împreună în workspace." },
    ],
    deliverables: [
      { title: "Experiență vizuală", copy: "Galerie și prezentare potrivite unui serviciu care se cumpără mult prin imagine." },
      { title: "Prețuri sau pachete", copy: "Structură clară, cu ce include fiecare nivel." },
      { title: "Calendar", copy: "Disponibilitate afișată sau verificată înainte de contact." },
      { title: "Cerere structurată", copy: "Tip eveniment, dată și servicii selectate într-un singur lead." },
    ],
    steps: [
      { number: "01", title: "Vizitatorul descoperă", copy: "Înțelege stilul și serviciile fără să ceară o prezentare separată." },
      { number: "02", title: "Verifică data", copy: "Calendarul filtrează rapid disponibilitatea." },
      { number: "03", title: "Trimite cererea", copy: "Detaliile evenimentului intră într-un lead ușor de urmărit." },
    ],
    faq: [
      { question: "Pot afișa disponibilitatea fără să expun toate rezervările?", answer: "Da. Se poate afișa doar starea unei zile sau un calendar simplificat, fără detalii private." },
      { question: "Pot avea pachete diferite?", answer: "Da. Pachetele și opțiunile pot fi configurate în funcție de tipul serviciului." },
      { question: "Aveți un exemplu real de structură?", answer: "Da. Pilot #001 Obsidian Moments include servicii, prețuri, contact și disponibilitate live." },
    ],
    related: [
      { href: "/studii-de-caz/obsidian-moments", label: "Studiu de caz Obsidian" },
      { href: "/templates/obsidian-moments", label: "Vezi demo Obsidian" },
      { href: "/site-prezentare", label: "Site de prezentare" },
    ],
  },
];

export const seoCaseStudies: SeoCaseStudy[] = [
  {
    slug: "obsidian-moments",
    path: "/studii-de-caz/obsidian-moments",
    title: "Obsidian Moments",
    metaTitle: "Studiu de caz Obsidian Moments | ORBYVEN",
    description:
      "Cum am structurat Pilot #001 Obsidian Moments: site pentru servicii de evenimente, pachete, contact și disponibilitate live.",
    eyebrow: "Pilot #001 · Events",
    h1: "De la «scrie-ne să vezi dacă suntem liberi» la un traseu clar de disponibilitate.",
    intro:
      "Obsidian Moments este pilotul folosit pentru a testa o verticală de servicii pentru evenimente. Studiul de caz descrie ce am construit în ORBYVEN; nu atribuie rezultate comerciale care nu au fost măsurate.",
    context: [
      "Servicii vizuale care trebuie înțelese rapid: platformă 360°, oglindă foto și efecte speciale.",
      "Data evenimentului este informația critică încă din primul contact.",
      "Pachetele și contactul trebuie să rămână accesibile fără navigație complicată.",
    ],
    built: [
      { title: "Site premium", copy: "Hero vizual, servicii, secțiune de prezentare și trasee clare către prețuri și contact." },
      { title: "Disponibilitate live", copy: "Calendar public conectat la o rută dedicată pentru verificarea datei." },
      { title: "Pagini separate", copy: "Prețuri și contact au propriile rute pentru o navigare mai directă." },
      { title: "Mobile flow", copy: "Navigația și hero-ul au fost ajustate separat pentru telefon." },
    ],
    flow: [
      { number: "01", title: "Alege serviciul", copy: "Vizitatorul înțelege opțiunile înainte să trimită mesajul." },
      { number: "02", title: "Verifică data", copy: "Disponibilitatea reduce pașii inutili din primul contact." },
      { number: "03", title: "Trimite cererea", copy: "Data și serviciul pot deveni context pentru lead și calendar." },
    ],
    note:
      "Următorul nivel al pilotului este conectarea completă a formularului și disponibilității cu Lead-uri, Calendar și Ofertă în workspace. Ideea nu este să transformăm site-ul într-un CRM vizibil, ci să păstrăm experiența publică simplă și să mutăm complexitatea în spate. Data evenimentului, serviciul ales și mesajul trebuie să ajungă împreună în același context, astfel încât echipa să nu reconstruiască manual informația din conversații separate.",
    demoHref: "/templates/obsidian-moments",
    demoLabel: "Deschide demo-ul Obsidian",
    related: [
      { href: "/site-pentru-servicii-evenimente", label: "Soluție pentru servicii de evenimente" },
      { href: "/templates/obsidian-moments/preturi", label: "Vezi pagina de prețuri" },
    ],
  },
  {
    slug: "neagu-costica-srl",
    path: "/studii-de-caz/neagu-costica-srl",
    title: "Neagu Costică SRL",
    metaTitle: "Studiu de caz instalații · Pilot #002 | ORBYVEN",
    description:
      "Pilot #002 ORBYVEN pentru instalații termice și sanitare: website, lead-uri, vizite, devize, materiale, ofertă și flux operațional.",
    eyebrow: "Pilot #002 · Field service",
    h1: "Website-ul este doar intrarea. Valoarea mare apare când lucrarea continuă în workspace.",
    intro:
      "Pilot #002 testează ORBYVEN într-o firmă de instalații cu muncă de teren. Accentul nu este doar pe prezentare, ci pe trecerea de la cerere la vizită, deviz și organizarea lucrării.",
    context: [
      "Servicii termice și sanitare cu proiecte de complexitate diferită.",
      "Lucrări locale în Fetești și deplasări stabilite în funcție de proiect.",
      "Nevoie de devize, materiale, calendar și urmărirea costurilor.",
    ],
    built: [
      { title: "Template dedicat", copy: "Prezentare pentru centrale, încălzire în pardoseală, control smart și instalații sanitare." },
      { title: "Workspace modular", copy: "Lead-uri, task-uri, calendar și estimates sunt parte din pilot." },
      { title: "Flux de deviz", copy: "Deviz → materiale necesare → ofertă → factură draft → buget planificat vs. real." },
      { title: "Izolare multi-tenant", copy: "Datele organizației sunt separate prin membership și RLS." },
    ],
    flow: [
      { number: "01", title: "Cerere", copy: "Clientul descrie lucrarea și contextul." },
      { number: "02", title: "Vizită și deviz", copy: "Cererea poate deveni programare, măsurători și deviz." },
      { number: "03", title: "Execuție", copy: "Materialele, task-urile, calendarul și cheltuielile rămân legate de lucrare." },
    ],
    note:
      "Pilotul este folosit pentru a valida dacă un flux simplu poate reduce munca repetitivă dintre teren, deviz și urmărirea proiectului. Site-ul public trebuie să rămână ușor de folosit pentru client, în timp ce workspace-ul păstrează contextul lucrării: cine a cerut-o, unde are loc, ce s-a măsurat, ce materiale sunt necesare și ce s-a ofertat. Valoarea urmărită este continuitatea informației, nu numărul de ecrane din aplicație.",
    demoHref: "/templates/pilot-002",
    demoLabel: "Deschide demo-ul Pilot #002",
    related: [
      { href: "/site-pentru-instalatori", label: "Soluție pentru instalatori" },
      { href: "/workspace", label: "Vezi workspace-ul" },
    ],
  },
  {
    slug: "viaforte-asfaltari",
    path: "/studii-de-caz/viaforte-asfaltari",
    title: "VIAFORTE",
    metaTitle: "Studiu de caz asfaltări București | ORBYVEN",
    description:
      "Pilot #003 VIAFORTE: template pentru firmă de asfaltări, cu lucrări, utilaje, galerie, contact și structură pentru field service.",
    eyebrow: "Pilot #003 · Infrastructură",
    h1: "Pentru lucrări grele, site-ul trebuie să arate capacitatea de execuție fără să pară un catalog generic.",
    intro:
      "VIAFORTE este pilotul pentru o firmă de asfaltări din București și împrejurimi. Am construit o prezentare axată pe lucrări, utilaje și transparență, fără să atribuim cifre sau rezultate care nu au fost furnizate.",
    context: [
      "Servicii de asfaltare unde imaginile lucrărilor și utilajele contribuie direct la încredere.",
      "Acoperire București și împrejurimi, cu cereri care pot necesita vizită și măsurători.",
      "Nevoie de pagini distincte pentru galerie și contact.",
    ],
    built: [
      { title: "Homepage industrial", copy: "Prezentare profesională, modernă și directă." },
      { title: "Galerie", copy: "Lucrările pot fi evaluate vizual înainte de primul contact." },
      { title: "Contact", copy: "Ruta separată reduce fricțiunea pentru cereri." },
      { title: "Bază pentru field service", copy: "Fluxul poate fi extins ulterior cu vizită, estimare, utilaje, echipă și ofertă." },
    ],
    flow: [
      { number: "01", title: "Solicitare", copy: "Tip lucrare, locație și suprafață estimată." },
      { number: "02", title: "Evaluare", copy: "Vizită, măsurători și necesar tehnic." },
      { number: "03", title: "Ofertare", copy: "Deviz, echipă și planificare într-un flux comun." },
    ],
    note:
      "Pilotul pregătește o verticală de tip Field Service care poate fi reutilizată pentru construcții, HVAC, electricieni sau alte echipe de teren. Elementele comune sunt aceleași: solicitare, locație, vizită, măsurători, ofertă, echipă și costuri. Diferența dintre verticale rămâne în datele și pașii specifici meseriei, nu într-o aplicație complet diferită pentru fiecare tip de firmă.",
    demoHref: "/templates/asfaltari-bucuresti",
    demoLabel: "Deschide demo-ul VIAFORTE",
    related: [
      { href: "/site-pentru-firme-mici", label: "Site pentru firme de servicii" },
      { href: "/templates/asfaltari-bucuresti/galerie", label: "Vezi galeria demo" },
    ],
  },
  {
    slug: "haos-customs",
    path: "/studii-de-caz/haos-customs",
    title: "Hao's Customs",
    metaTitle: "Studiu de caz detailing auto · Pilot #005 | ORBYVEN",
    description:
      "Pilot #005 Hao's Customs: website premium pentru detailing auto, before/after, configurator de pachet, galerie și calendar.",
    eyebrow: "Pilot #005 · Auto detailing",
    h1: "Am construit traseul în jurul rezultatului vizual, nu în jurul unei liste lungi de servicii.",
    intro:
      "Hao's Customs este pilotul ORBYVEN pentru detailing auto premium. Interfața pune accent pe before/after, servicii ușor de comparat și traseul de la nevoie la estimare și rezervare.",
    context: [
      "Servicii premium unde diferența trebuie demonstrată vizual.",
      "Pachete cu niveluri și upgrade-uri care pot deveni greu de înțeles într-o listă statică.",
      "Nevoie de programare fără pierderea configurației alese.",
    ],
    built: [
      { title: "Hero cinematic", copy: "Impact puternic, dar optimizat cu media locală pentru control și performanță." },
      { title: "Before / after", copy: "Perechi dedicate de imagini pentru comparație directă." },
      { title: "Configurator", copy: "Flux pentru mașină, nevoie, upgrade-uri și estimare." },
      { title: "Calendar", copy: "Configurația poate continua către alegerea unui slot." },
    ],
    flow: [
      { number: "01", title: "Mașina", copy: "Dimensiunea și contextul setează baza." },
      { number: "02", title: "Nevoia", copy: "Clientul alege pachetul și upgrade-urile." },
      { number: "03", title: "Slotul", copy: "Selecțiile pot merge mai departe în programare." },
    ],
    note:
      "Pilotul validează o experiență de servicii premium în care site-ul poate prelua o parte din calificarea cererii înainte de contact. În loc ca utilizatorul să trimită doar «cât costă?», traseul poate păstra tipul mașinii, serviciul, starea și upgrade-urile alese. Echipa primește astfel o cerere mai clară, iar clientul vede mai devreme ce influențează estimarea și programarea.",
    demoHref: "/templates/haos-customs",
    demoLabel: "Deschide demo-ul Hao's Customs",
    related: [
      { href: "/site-pentru-detailing-auto", label: "Soluție pentru detailing auto" },
      { href: "/templates/haos-customs/galerie", label: "Vezi galeria before/after" },
    ],
  },
];

export const seoGuides: SeoGuide[] = [
  {
    slug: "cat-costa-un-site-de-prezentare",
    path: "/ghid/cat-costa-un-site-de-prezentare",
    title: "Cât costă un site de prezentare?",
    metaTitle: "Cât costă un site de prezentare? Ghid ORBYVEN",
    description:
      "Ce influențează costul unui site de prezentare: structură, design, conținut, integrări, SEO, mentenanță și ce merită comparat între oferte.",
    eyebrow: "Ghid · Cost website",
    h1: "Prețul unui site nu spune mare lucru până nu știi ce include.",
    intro:
      "Două oferte pentru «site de prezentare» pot descrie produse complet diferite. Mai util decât un interval generic este să compari structura, nivelul de personalizare, funcțiile și costurile recurente.",
    sections: [
      {
        title: "Ce schimbă costul cel mai mult",
        paragraphs: [
          "Numărul de pagini contează, dar nu este singurul factor. Designul custom, conținutul, formularele, integrările, animațiile și funcțiile operaționale pot schimba mult complexitatea.",
          "Un site simplu cu cinci pagini și formular este alt proiect decât un site care include configurator, calendar, conturi sau workspace.",
        ],
        bullets: ["numărul și tipul paginilor", "design custom vs. structură existentă", "copy și media", "integrări și automatizări", "SEO și migrare"],
      },
      {
        title: "Ce trebuie separat în ofertă",
        paragraphs: [
          "Întreabă ce este cost inițial și ce este recurent. Domeniul, emailul, anumite servicii cloud sau mentenanța pot avea cost separat de construcția site-ului.",
        ],
        bullets: ["dezvoltare", "domeniu", "hosting sau platformă", "email business", "mentenanță", "licențe terțe"],
      },
      {
        title: "Cum compari corect două oferte",
        paragraphs: [
          "Compară rezultatul și responsabilitatea, nu doar prețul. Cine scrie conținutul? Cine configurează Search Console? Cine verifică formularele și versiunea mobilă? Cine deține domeniul și codul?",
          "Un preț mai mic poate fi suficient pentru un site simplu, dar devine greu de comparat dacă una dintre oferte include copy, migrare, SEO tehnic și suport, iar cealaltă include doar implementarea vizuală. Cere ca livrabilele să fie scrise clar, inclusiv ce nu este inclus.",
        ],
      },
      {
        title: "Costul după lansare",
        paragraphs: [
          "După publicare rămân costurile de infrastructură și operare. Domeniul, emailul business, anumite servicii cloud, mentenanța sau integrările pot avea costuri recurente. Ele trebuie separate de costul inițial al designului și dezvoltării.",
          "Pentru ORBYVEN, site-ul public și workspace-ul pot fi două componente ale aceluiași ecosistem, dar nu presupunem automat că orice firmă are nevoie de toate modulele din prima zi.",
        ],
      },
    ],
    related: [
      { href: "/site-prezentare", label: "Site de prezentare" },
      { href: "/creare-site", label: "Creare site" },
      { href: "/contact", label: "Cere o discuție" },
    ],
  },
  {
    slug: "ce-trebuie-sa-contina-site-ul-unei-firme",
    path: "/ghid/ce-trebuie-sa-contina-site-ul-unei-firme",
    title: "Ce trebuie să conțină site-ul unei firme",
    metaTitle: "Ce trebuie să conțină site-ul unei firme | ORBYVEN",
    description:
      "Structura esențială pentru site-ul unei firme: ofertă, servicii, dovadă, proces, contact, pagini legale și elemente SEO de bază.",
    eyebrow: "Ghid · Structură website",
    h1: "Site-ul unei firme trebuie să răspundă la întrebări, nu să umple meniul.",
    intro:
      "Înainte de efecte și animații, un website de firmă trebuie să explice clar oferta, să construiască încredere și să ofere un drum simplu către contact.",
    sections: [
      {
        title: "Mesajul principal",
        paragraphs: ["Prima zonă trebuie să spună ce face firma, pentru cine și care este următorul pas. Sloganurile fără context pot arăta bine, dar obligă vizitatorul să caute explicația."],
      },
      {
        title: "Servicii și dovadă",
        paragraphs: ["Serviciile importante merită suficient context. Portofoliul, lucrările, procesul sau exemplele reale oferă dovadă fără să fie nevoie de afirmații neverificabile."],
        bullets: ["servicii", "zone de lucru", "lucrări sau exemple", "proces", "întrebări frecvente"],
      },
      {
        title: "Contact și încredere",
        paragraphs: ["Telefonul, WhatsApp-ul, formularul sau programarea trebuie să fie ușor de găsit. Datele legale și politicile trebuie să existe acolo unde sunt necesare."],
      },
      {
        title: "Fundația SEO",
        paragraphs: [
          "Titlurile, descrierile, H1-ul, canonical, sitemap-ul, robots și internal linking ajută motoarele de căutare să înțeleagă site-ul.",
          "La fel de important este ca fiecare pagină să aibă un subiect clar. Dacă toate serviciile sunt înghesuite într-o singură pagină, devine mai greu pentru utilizator și pentru Google să înțeleagă diferența dintre ele.",
        ],
      },
      {
        title: "Ce verifici înainte de lansare",
        paragraphs: [
          "Testează site-ul pe telefon, verifică formularele, linkurile, datele de contact și paginile legale. Apoi conectează domeniul, Search Console și sitemap-ul și urmărește primele crawl-uri.",
          "Un site nu este «gata pentru SEO» doar pentru că are meta tag-uri. Trebuie să poată fi accesat, indexat și parcurs logic de la paginile principale către serviciile importante.",
        ],
      },
    ],
    related: [
      { href: "/site-pentru-firme-mici", label: "Site pentru firme mici" },
      { href: "/site-prezentare", label: "Site de prezentare" },
      { href: "/templates", label: "Vezi exemple" },
    ],
  },
  {
    slug: "cand-merita-redesign-site",
    path: "/ghid/cand-merita-redesign-site",
    title: "Când merită să faci redesign unui site",
    metaTitle: "Când merită un redesign de site | ORBYVEN",
    description:
      "Semne că site-ul are nevoie de redesign: ofertă neclară, experiență slabă pe mobil, structură veche, viteză, formulare și probleme SEO.",
    eyebrow: "Ghid · Redesign",
    h1: "Nu orice site vechi are nevoie de redesign. Dar unele probleme nu se mai repară cu mici retușuri.",
    intro:
      "Redesignul are sens când site-ul a devenit o frână pentru vânzare, conținut sau operare. Înainte de a-l reconstrui, trebuie identificat ce funcționează deja.",
    sections: [
      {
        title: "Semnale vizibile",
        paragraphs: ["Dacă utilizatorii nu înțeleg oferta, meniul este greu de folosit sau formularul este ascuns, problema nu este doar estetică."],
        bullets: ["mesaj neclar", "navigație complicată", "mobil slab", "pagini greu de actualizat"],
      },
      {
        title: "Semnale tehnice",
        paragraphs: ["Viteza, erorile, structura URL și lipsa redirecturilor pot afecta atât experiența, cât și vizibilitatea organică."],
      },
      {
        title: "Ce păstrezi",
        paragraphs: [
          "Paginile care au linkuri, trafic sau conținut bun nu trebuie eliminate doar pentru că designul se schimbă. Inventarul și maparea URL-urilor vin înaintea lansării.",
          "Dacă o pagină dispare, trebuie decis unde se mută intenția ei. Uneori se păstrează același URL, alteori este nevoie de un redirect 301 către cea mai apropiată alternativă relevantă.",
        ],
      },
      {
        title: "Cum arată o migrare controlată",
        paragraphs: [
          "Noua versiune se verifică înainte de lansare: canonical, robots, sitemap, formulare, linkuri interne și statusurile HTTP. După publicare, Search Console ajută la observarea paginilor care nu mai sunt găsite sau nu mai sunt indexate.",
          "Redesignul nu trebuie să fie o resetare a istoricului site-ului. Scopul este să îmbunătățești experiența păstrând semnalele bune deja câștigate.",
        ],
      },
    ],
    related: [
      { href: "/redesign-site", label: "Serviciu redesign" },
      { href: "/ghid/ce-trebuie-sa-contina-site-ul-unei-firme", label: "Structura unui site bun" },
      { href: "/contact", label: "Discută un redesign" },
    ],
  },
  {
    slug: "site-sau-facebook-pentru-afacere",
    path: "/ghid/site-sau-facebook-pentru-afacere",
    title: "Site sau Facebook pentru o afacere?",
    metaTitle: "Site sau Facebook pentru o afacere? | ORBYVEN",
    description:
      "Site sau Facebook? Rolurile sunt diferite: social media ajută distribuția, iar site-ul oferă control asupra structurii, brandului și conversiei.",
    eyebrow: "Ghid · Prezență digitală",
    h1: "Facebook poate aduce atenție. Site-ul îți dă control asupra traseului.",
    intro:
      "Nu este o alegere obligatoriu exclusivă. Social media și website-ul rezolvă probleme diferite și funcționează mai bine când sunt folosite împreună.",
    sections: [
      {
        title: "Ce face bine social media",
        paragraphs: ["Este bună pentru distribuție, conținut frecvent, comunitate și interacțiune rapidă. Oamenii pot descoperi afacerea într-un flux pe care îl folosesc deja."],
      },
      {
        title: "Ce face bine site-ul",
        paragraphs: ["Controlezi structura, ordinea informației, datele importante și traseul către contact. Nu depinzi de formatul unei singure platforme."],
        bullets: ["pagini pentru servicii", "SEO", "formulare și programări", "portofoliu", "integrări"],
      },
      {
        title: "Când ai nevoie de ambele",
        paragraphs: [
          "Pentru multe firme locale, social media atrage atenția, iar site-ul oferă contextul necesar înainte de apel sau cerere. Linkurile dintre ele trebuie să fie simple și consecvente.",
          "Un clip sau o postare poate aduce vizitatorul, iar site-ul poate explica serviciul, afișa lucrări, răspunde la întrebări și colecta o cerere într-un format mai ușor de urmărit.",
        ],
      },
      {
        title: "Cum le legi fără să dublezi munca",
        paragraphs: [
          "Folosește social media pentru conținut frecvent și exemple noi, iar site-ul pentru informația stabilă: servicii, proces, contact, portofoliu și pagini care pot fi găsite în Google.",
          "Nu este nevoie să copiezi fiecare postare pe site. Mai util este să trimiți oamenii către pagina exactă care răspunde întrebării lor și să păstrezi acolo informația actualizată.",
        ],
      },
    ],
    related: [
      { href: "/site-pentru-firme-mici", label: "Site pentru firme mici" },
      { href: "/creare-site", label: "Creare site" },
      { href: "/contact", label: "Discută proiectul" },
    ],
  },
];

export const seoIndexLinks = {
  solutions: seoLandingPages.map((page) => ({
    href: page.path,
    label: page.title,
    copy: page.description,
  })),
  caseStudies: seoCaseStudies.map((page) => ({
    href: page.path,
    label: page.title,
    copy: page.description,
  })),
  guides: seoGuides.map((page) => ({
    href: page.path,
    label: page.title,
    copy: page.description,
  })),
};

export function getLandingBySlug(slug: string) {
  return seoLandingPages.find((page) => page.slug === slug);
}

export function getCaseStudyBySlug(slug: string) {
  return seoCaseStudies.find((page) => page.slug === slug);
}

export function getGuideBySlug(slug: string) {
  return seoGuides.find((page) => page.slug === slug);
}

export function buildSeoMetadata({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${path}`;

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: path,
      languages: {
        "ro-RO": path,
      },
    },
    openGraph: {
      type: "website",
      locale: "ro_RO",
      url,
      title,
      description,
      siteName: "ORBYVEN CREATIVE",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
