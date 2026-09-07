export type ClientTemplateSlug =
  | "instalatii"
  | "evenimente"
  | "beauty"
  | "clinica-dentara";

export type ClientTemplateStyle =
  | "technical"
  | "editorial"
  | "airy"
  | "medical";

export type ClientTemplateConfig = {
  slug: ClientTemplateSlug;
  style: ClientTemplateStyle;
  title: string;
  category: string;
  eyebrow: string;
  subtitle: string;
  description: string;
  accent: string;
  accentSoft: string;
  surface: string;
  ink: string;
  heroTitle: string;
  heroCopy: string;
  primaryAction: string;
  secondaryAction: string;
  stats: { value: string; label: string }[];
  services: { title: string; copy: string; icon: string }[];
  benefits: { title: string; copy: string }[];
  process: { number: string; title: string; copy: string }[];
  gallery: { label: string; title: string; copy: string }[];
  reviews: { quote: string; name: string; meta: string }[];
  testimonial: string;
  contactLine: string;
};

export const clientTemplateCatalog: Record<ClientTemplateSlug, ClientTemplateConfig> = {
  instalatii: {
    slug: "instalatii",
    style: "technical",
    title: "NordFlow",
    category: "Instalații · Servicii locale",
    eyebrow: "Confort. Siguranță. Eficiență.",
    subtitle: "Instalații termice & sanitare",
    description:
      "Un site direct și credibil pentru firme tehnice care trebuie să transmită seriozitate înainte de primul telefon.",
    accent: "#315ee8",
    accentSoft: "#eaf0ff",
    surface: "#f4f6f8",
    ink: "#121820",
    heroTitle: "Instalații făcute corect, de la prima intervenție.",
    heroCopy:
      "Montaj, mentenanță și intervenții pentru locuințe și spații comerciale. Primești o evaluare clară, o ofertă transparentă și o echipă care respectă lucrarea.",
    primaryAction: "Solicită o evaluare",
    secondaryAction: "Vezi serviciile",
    stats: [
      { value: "10+", label: "ani experiență" },
      { value: "1.000+", label: "lucrări finalizate" },
      { value: "24h", label: "răspuns la solicitări" },
    ],
    services: [
      { title: "Instalații termice", copy: "Centrale, calorifere, încălzire în pardoseală și automatizări.", icon: "T" },
      { title: "Instalații sanitare", copy: "Rețele, obiecte sanitare, renovări și intervenții complete.", icon: "S" },
      { title: "Climatizare", copy: "Aer condiționat, pompe de căldură și soluții eficiente energetic.", icon: "C" },
      { title: "Mentenanță", copy: "Revizii periodice și suport după finalizarea proiectului.", icon: "M" },
    ],
    benefits: [
      { title: "Ofertă explicată", copy: "Știi ce se face, de ce se face și care este costul estimat înainte de începerea lucrării." },
      { title: "Echipă verificată", copy: "Lucrările sunt planificate, documentate și urmărite până la recepția finală." },
      { title: "Suport după lucrare", copy: "Rămânem disponibili pentru reglaje, mentenanță și întrebări după finalizare." },
    ],
    process: [
      { number: "01", title: "Ne spui problema", copy: "Telefonic sau prin formularul de solicitare, cu poze și detalii dacă este nevoie." },
      { number: "02", title: "Evaluăm și ofertăm", copy: "Clarificăm soluția tehnică, timpul estimat și costurile înainte să programăm echipa." },
      { number: "03", title: "Executăm și verificăm", copy: "Lucrarea este realizată, testată și predată cu explicațiile necesare." },
    ],
    gallery: [
      { label: "Rezidențial", title: "Încălzire în pardoseală", copy: "Sistem complet pentru o locuință de 140 mp." },
      { label: "Renovare", title: "Refacere instalație baie", copy: "Trasee noi, obiecte sanitare și probe de presiune." },
      { label: "Eficiență", title: "Pompă de căldură", copy: "Modernizare sistem termic cu automatizare pe zone." },
      { label: "Comercial", title: "Spațiu birouri", copy: "Instalații sanitare și climatizare pentru 320 mp." },
    ],
    reviews: [
      { quote: "Au explicat soluția înainte să înceapă și nu au apărut costuri surpriză.", name: "Andrei M.", meta: "București · lucrare rezidențială" },
      { quote: "Punctuali, curați și foarte bine organizați. Am primit răspuns la fiecare întrebare.", name: "Cristina R.", meta: "Ilfov · renovare completă" },
      { quote: "Intervenție rapidă și o soluție care chiar a rezolvat cauza, nu doar simptomul.", name: "Mihai P.", meta: "București · mentenanță" },
    ],
    testimonial:
      "Profesioniști, punctuali și foarte clari. Exact genul de firmă pe care vrei să o găsești când ai nevoie de o lucrare serioasă.",
    contactLine: "București · Ilfov · împrejurimi",
  },
  evenimente: {
    slug: "evenimente",
    style: "editorial",
    title: "Lumière Events",
    category: "Evenimente · Wedding & private",
    eyebrow: "Momente care rămân.",
    subtitle: "Planning · styling · coordination",
    description:
      "Un site editorial, cald și rafinat pentru branduri de evenimente care vând emoție, atmosferă și încredere.",
    accent: "#9f5e4b",
    accentSoft: "#f1dfd7",
    surface: "#f7f1e9",
    ink: "#2b211d",
    heroTitle: "O zi care arată și se simte ca voi.",
    heroCopy:
      "Construim nunți și evenimente private cu o direcție coerentă, de la prima schiță până la ultimul detaliu din ziua evenimentului.",
    primaryAction: "Povestește-ne despre voi",
    secondaryAction: "Descoperă experiența",
    stats: [
      { value: "120+", label: "evenimente create" },
      { value: "4.9", label: "rating mediu" },
      { value: "8", label: "ani de povești" },
    ],
    services: [
      { title: "Full planning", copy: "Concept, buget, furnizori, timeline și coordonare completă.", icon: "01" },
      { title: "Design & styling", copy: "Direcție vizuală, floristică, papetărie și styling pentru spațiu.", icon: "02" },
      { title: "Wedding day", copy: "Coordonarea furnizorilor și a momentelor importante în ziua evenimentului.", icon: "03" },
      { title: "Private events", copy: "Cine private, aniversări și experiențe construite la scară intimă.", icon: "04" },
    ],
    benefits: [
      { title: "Un singur fir roșu", copy: "Fiecare decizie vizuală și logistică pornește din aceeași poveste." },
      { title: "Furnizori potriviți", copy: "Recomandări curate, în funcție de stil, buget și nivelul de experiență dorit." },
      { title: "Prezență, nu stres", copy: "În ziua evenimentului voi rămâneți în poveste; coordonarea rămâne la noi." },
    ],
    process: [
      { number: "I", title: "Ne cunoaștem", copy: "Vorbim despre voi, ce vă place și cum vreți să se simtă ziua." },
      { number: "II", title: "Dăm formă ideii", copy: "Construim conceptul, bugetul și echipa de furnizori în jurul direcției alese." },
      { number: "III", title: "Trăiți momentul", copy: "Coordonăm ziua și păstrăm lucrurile fluide, astfel încât voi să fiți cu adevărat prezenți." },
    ],
    gallery: [
      { label: "Garden wedding", title: "Ana & Luca", copy: "cină sub lumini calde · 86 invitați" },
      { label: "Editorial dinner", title: "Nocturne", copy: "texturi naturale · mese lungi · muzică live" },
      { label: "City wedding", title: "Mara & Victor", copy: "minimalism urban · 120 invitați" },
      { label: "Private celebration", title: "Supper Club 30", copy: "cină intimă · styling floral sculptural" },
    ],
    reviews: [
      { quote: "În ziua nunții am uitat complet de timeline. Pentru noi asta spune tot.", name: "Ana & Luca", meta: "Garden wedding · 2026" },
      { quote: "Au înțeles atmosfera pe care o voiam înainte să știm noi să o explicăm bine.", name: "Mara & Victor", meta: "City wedding · 2026" },
      { quote: "Elegant, atent și fără sentimentul că ni se vinde ceva în plus la fiecare pas.", name: "Irina D.", meta: "Private dinner · 2025" },
    ],
    testimonial:
      "Totul a fost calm, elegant și foarte bine organizat. În ziua evenimentului am simțit că putem pur și simplu să ne bucurăm.",
    contactLine: "București · evenimente în toată România",
  },
  beauty: {
    slug: "beauty",
    style: "airy",
    title: "Atelier Élan",
    category: "Beauty · Salon premium",
    eyebrow: "Beauty, without the noise.",
    subtitle: "Skin · nails · rituals",
    description:
      "Un site soft și aerisit pentru un salon contemporan, orientat pe experiență, rezultate și programare ușoară.",
    accent: "#8b6a75",
    accentSoft: "#efe4e7",
    surface: "#faf7f5",
    ink: "#30282c",
    heroTitle: "Ritualuri de beauty care lasă loc pentru tine.",
    heroCopy:
      "Tratamente atent alese, specialiști în care poți avea încredere și o atmosferă în care frumusețea nu trebuie grăbită.",
    primaryAction: "Alege o programare",
    secondaryAction: "Explorează ritualurile",
    stats: [
      { value: "5.000+", label: "vizite în salon" },
      { value: "98%", label: "cliente recurente" },
      { value: "4.9", label: "rating" },
    ],
    services: [
      { title: "Skin rituals", copy: "Tratamente faciale personalizate pentru hidratare, glow și echilibru.", icon: "skin" },
      { title: "Nails", copy: "Manichiură curată, îngrijire atentă și finisaje contemporane.", icon: "nails" },
      { title: "Brows & lashes", copy: "Formă, culoare și definire adaptate fizionomiei tale.", icon: "brows" },
      { title: "Occasion make-up", copy: "Machiaj profesional pentru evenimente, ședințe foto și momente importante.", icon: "make-up" },
    ],
    benefits: [
      { title: "Consult înainte de tratament", copy: "Alegem serviciul după nevoia reală, nu după cel mai lung meniu." },
      { title: "Produse selectate", copy: "Lucrăm cu formule profesionale și protocoale adaptate fiecărui tip de piele." },
      { title: "Timp rezervat pentru tine", copy: "Programările sunt spațiate astfel încât experiența să rămână calmă." },
    ],
    process: [
      { number: "01", title: "Alege ritualul", copy: "Descoperă serviciul potrivit și durata lui, fără liste interminabile." },
      { number: "02", title: "Rezervă timpul", copy: "Selectează o fereastră disponibilă și lasă-ne câteva detalii." },
      { number: "03", title: "Vino așa cum ești", copy: "Confirmarea și recomandările pentru vizită ajung înainte de programare." },
    ],
    gallery: [
      { label: "Skin", title: "Quiet glow", copy: "hidratare · calmare · lumină naturală" },
      { label: "Nails", title: "Soft structure", copy: "nuanțe neutre · finish curat" },
      { label: "Brows", title: "Natural frame", copy: "definire subtilă · proporții naturale" },
      { label: "Make-up", title: "Evening skin", copy: "ten luminos · detalii soft-focus" },
    ],
    reviews: [
      { quote: "Nu simt că vin doar la o programare. E ora mea de liniște din săptămână.", name: "Bianca A.", meta: "clientă recurentă" },
      { quote: "Mi-au recomandat mai puțin decât voiam inițial și rezultatul a fost exact ce aveam nevoie.", name: "Diana C.", meta: "skin ritual" },
      { quote: "Site-ul e la fel ca salonul: simplu, frumos și foarte ușor de navigat.", name: "Raluca N.", meta: "nails & brows" },
    ],
    testimonial:
      "Un salon superb, dar mai ales o experiență foarte atentă. Programarea este simplă, iar fiecare vizită se simte personală.",
    contactLine: "București · programări demo online",
  },
  "clinica-dentara": {
    slug: "clinica-dentara",
    style: "medical",
    title: "NovaSmile",
    category: "Medical · Clinică dentară",
    eyebrow: "Stomatologie explicată simplu.",
    subtitle: "Dental care for real life",
    description:
      "Un site medical calm, uman și foarte clar, construit să reducă anxietatea și să facă programarea firească.",
    accent: "#286d73",
    accentSoft: "#dfeeee",
    surface: "#f2f7f6",
    ink: "#172627",
    heroTitle: "Un loc în care știi ce urmează înainte să înceapă tratamentul.",
    heroCopy:
      "Consultații explicate pe înțelesul tău, planuri de tratament clare și o echipă care pune confortul pacientului înaintea jargonului medical.",
    primaryAction: "Programează o consultație",
    secondaryAction: "Vezi tratamentele",
    stats: [
      { value: "12", label: "medici & specialiști" },
      { value: "5.000+", label: "pacienți tratați" },
      { value: "4.9", label: "rating pacienți" },
    ],
    services: [
      { title: "Stomatologie generală", copy: "Consultații, prevenție și tratamente pentru adulți și copii.", icon: "+" },
      { title: "Implantologie", copy: "Planificare digitală și soluții moderne pentru restaurarea zâmbetului.", icon: "I" },
      { title: "Ortodonție", copy: "Aparate clasice și alignere, cu monitorizare pe termen lung.", icon: "O" },
      { title: "Estetică dentară", copy: "Albire, fațete și restaurări cu aspect natural.", icon: "E" },
    ],
    benefits: [
      { title: "Plan înainte de tratament", copy: "Primești pașii, alternativele și costurile estimate înainte să iei o decizie." },
      { title: "Confort real", copy: "Programări organizate, explicații fără grabă și opțiuni pentru pacienții anxioși." },
      { title: "Echipă multidisciplinară", copy: "Cazurile complexe sunt discutate între specialiști, nu mutate din cabinet în cabinet." },
    ],
    process: [
      { number: "01", title: "Consultație", copy: "Ascultăm motivul vizitei, evaluăm situația și răspundem la întrebări." },
      { number: "02", title: "Plan clar", copy: "Primești opțiunile de tratament, ordinea etapelor și costurile estimate." },
      { number: "03", title: "Tratament & follow-up", copy: "Urmărim evoluția și păstrăm toate etapele într-un parcurs ușor de înțeles." },
    ],
    gallery: [
      { label: "Cabinet 01", title: "Consultații & prevenție", copy: "spațiu luminos · tehnologie digitală" },
      { label: "Echipă", title: "Dr. Ana Popescu", copy: "stomatologie generală · protetică" },
      { label: "Echipă", title: "Dr. Vlad Ionescu", copy: "implantologie · chirurgie orală" },
      { label: "Tehnologie", title: "Scanare intraorală", copy: "planificare mai clară · mai puțin disconfort" },
    ],
    reviews: [
      { quote: "Mi s-a explicat totul înainte de tratament și pentru prima dată nu m-am simțit grăbită.", name: "Elena S.", meta: "pacient verificat" },
      { quote: "Copilul meu a ieșit din cabinet întrebând când mai venim. Nu mă așteptam la asta.", name: "Alexandru D.", meta: "părinte · pedodonție" },
      { quote: "Planul de tratament a fost foarte clar, inclusiv costurile și alternativele.", name: "Radu B.", meta: "implantologie" },
    ],
    testimonial:
      "Explicații clare, atmosferă relaxată și o echipă foarte atentă. Pentru prima dată o vizită la dentist nu a părut complicată.",
    contactLine: "București · consultații cu programare",
  },
};

export const clientTemplateList = Object.values(clientTemplateCatalog);
