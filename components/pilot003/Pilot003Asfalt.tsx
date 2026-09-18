import Link from "next/link";

const heroImage =
  "https://images.pexels.com/photos/4390530/pexels-photo-4390530.jpeg?auto=compress&cs=tinysrgb&w=1800";

export const pilot003Projects = [
  {
    category: "Parcare comercială",
    title: "Platformă asfaltată · București Nord",
    meta: "1.850 m² · strat suport + două straturi asfaltice",
    copy: "Pregătire teren, compactare, borduri și asfaltare pentru trafic auto zilnic.",
    image:
      "https://images.pexels.com/photos/8995387/pexels-photo-8995387.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    category: "Acces industrial",
    title: "Drum de acces · centură București",
    meta: "620 ml · fundație stabilizată + asfalt",
    copy: "Intervenție etapizată pentru a păstra accesul operațional pe durata lucrării.",
    image:
      "https://images.pexels.com/photos/4390530/pexels-photo-4390530.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    category: "Infrastructură urbană",
    title: "Refacere carosabil · București",
    meta: "3.200 m² · frezare + covor asfaltic",
    copy: "Refacere strat de uzură, corecții locale și compactare controlată.",
    image:
      "https://images.pexels.com/photos/34338544/pexels-photo-34338544.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    category: "Rezidențial",
    title: "Curte și alei · Ilfov",
    meta: "480 m² · drenaj + borduri + asfalt",
    copy: "Soluție completă pentru acces auto, pante corecte și evacuarea apei pluviale.",
    image:
      "https://images.pexels.com/photos/8995387/pexels-photo-8995387.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    category: "Reparații",
    title: "Remediere platformă logistică",
    meta: "1.100 m² · decopertare locală + reparații",
    copy: "Zone degradate refăcute punctual fără oprirea completă a activității din incintă.",
    image:
      "https://images.pexels.com/photos/34338544/pexels-photo-34338544.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    category: "Platformă industrială",
    title: "Suprafață pentru trafic greu",
    meta: "2.450 m² · fundație ranforsată + asfalt",
    copy: "Stratificație pregătită pentru vehicule grele și utilizare intensivă.",
    image:
      "https://images.pexels.com/photos/4390530/pexels-photo-4390530.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
] as const;

const services = [
  ["01", "Asfaltări curți & parcări", "Pregătire teren, fundație, borduri, pante și asfalt pentru proprietăți rezidențiale sau comerciale."],
  ["02", "Drumuri de acces", "Execuție și modernizare pentru acces rezidențial, industrial, logistic și șantiere."],
  ["03", "Platforme industriale", "Soluții pentru suprafețe cu trafic intens, autoutilitare și vehicule grele."],
  ["04", "Reparații & plombări", "Decopertări locale, frezare, remedierea tasărilor și refacerea stratului de uzură."],
  ["05", "Terasamente & fundații", "Excavații, balast, piatră spartă, nivelare și compactare înainte de asfaltare."],
  ["06", "Borduri & drenaj", "Încadrări, rigole, pante și soluții pentru evacuarea controlată a apei."],
] as const;

const fleet = [
  ["Finisor asfalt", "Așternere uniformă pentru suprafețe mari și lucrări continue.", "PAVER"],
  ["Cilindru tandem", "Compactare controlată a stratului asfaltic și finisaj constant.", "ROLLER"],
  ["Excavator", "Decopertări, terasamente și pregătirea fundației.", "EXC"],
  ["Miniîncărcător", "Manevrabilitate în curți, parcări și zone cu acces limitat.", "SKID"],
  ["Autobasculante", "Transport agregate, mixtură și evacuarea materialului decopertat.", "TRUCK"],
  ["Echipamente frezare", "Pregătire locală și corecții înainte de refacerea stratului asfaltic.", "MILL"],
] as const;

export function Pilot003DemoBar() {
  return (
    <div className="border-b border-white/10 bg-[#101214] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
        <span>Pilot #003 · date și proiecte demonstrative</span>
        <Link href="/templates" className="transition hover:text-white/80">
          ORBYVEN Templates ↗
        </Link>
      </div>
    </div>
  );
}

export function Pilot003Header({ active = "acasa" }: { active?: "acasa" | "galerie" | "contact" }) {
  const itemClass = (name: typeof active) =>
    `transition ${active === name ? "text-[#f4a51c]" : "text-white/58 hover:text-white"}`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#111315]/92 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-5 py-4 md:px-9">
        <Link href="/templates/asfaltari-bucuresti" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[10px] border border-[#f4a51c]/45 bg-[#f4a51c] text-[12px] font-black text-[#101214] shadow-[0_10px_30px_rgba(244,165,28,.18)]">
            VF
          </span>
          <span>
            <span className="block text-[17px] font-black tracking-[-0.045em]">VIAFORTE</span>
            <span className="block text-[8px] font-bold uppercase tracking-[0.19em] text-white/35">asfalt & infrastructură</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-[11px] font-semibold md:flex">
          <Link className={itemClass("acasa")} href="/templates/asfaltari-bucuresti">Acasă</Link>
          <Link className={itemClass("galerie")} href="/templates/asfaltari-bucuresti/galerie">Galerie</Link>
          <Link className={itemClass("contact")} href="/templates/asfaltari-bucuresti/contact">Contact</Link>
        </nav>

        <Link
          href="/templates/asfaltari-bucuresti/contact"
          className="rounded-[10px] bg-[#f4a51c] px-4 py-2.5 text-[11px] font-black text-[#101214] transition hover:bg-[#ffb52f]"
        >
          Cere ofertă
        </Link>
      </div>
      <nav className="mx-auto flex max-w-[1500px] items-center justify-center gap-8 border-t border-white/8 px-5 py-3 text-[10px] font-semibold md:hidden">
        <Link className={itemClass("acasa")} href="/templates/asfaltari-bucuresti">Acasă</Link>
        <Link className={itemClass("galerie")} href="/templates/asfaltari-bucuresti/galerie">Galerie</Link>
        <Link className={itemClass("contact")} href="/templates/asfaltari-bucuresti/contact">Contact</Link>
      </nav>
    </header>
  );
}

export function Pilot003Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0d0f10] text-white">
      <div className="mx-auto grid max-w-[1500px] gap-10 px-5 py-12 md:grid-cols-[1fr_auto] md:px-9">
        <div>
          <p className="text-[22px] font-black tracking-[-0.05em]">VIAFORTE</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-white/42">
            Template demonstrativ ORBYVEN pentru o firmă de asfaltări din București și împrejurimi.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-[11px] font-semibold text-white/50">
          <Link href="/templates/asfaltari-bucuresti">Acasă</Link>
          <Link href="/templates/asfaltari-bucuresti/galerie">Galerie</Link>
          <Link href="/templates/asfaltari-bucuresti/contact">Contact</Link>
          <span>București · România</span>
        </div>
      </div>
      <div className="border-t border-white/8 px-5 py-4 text-center text-[9px] uppercase tracking-[0.15em] text-white/25">
        Date fictive pentru demonstrație · Pilot ORBYVEN #003
      </div>
    </footer>
  );
}

function ProjectCard({ project, priority = false }: { project: (typeof pilot003Projects)[number]; priority?: boolean }) {
  return (
    <article className={`group overflow-hidden rounded-[18px] border border-black/10 bg-white ${priority ? "md:col-span-2" : ""}`}>
      <div
        className={`relative overflow-hidden bg-[#31363a] bg-cover bg-center ${priority ? "h-[360px] md:h-[460px]" : "h-[300px]"}`}
        style={{ backgroundImage: `linear-gradient(180deg,rgba(9,11,12,.05),rgba(9,11,12,.55)), url(${project.image})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(244,165,28,.08),transparent_35%)]" />
        <div className="absolute bottom-4 left-4 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/75 backdrop-blur">
          imagine demonstrativă
        </div>
      </div>
      <div className="p-5 md:p-6">
        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#c47700]">{project.category}</p>
        <h3 className="mt-3 text-[23px] font-black tracking-[-0.04em] text-[#111315]">{project.title}</h3>
        <p className="mt-2 text-[11px] font-semibold text-black/38">{project.meta}</p>
        <p className="mt-4 max-w-xl text-sm leading-6 text-black/52">{project.copy}</p>
      </div>
    </article>
  );
}

export function Pilot003Home() {
  return (
    <main className="min-h-screen bg-[#f1f1ed] text-[#111315]" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Pilot003DemoBar />
      <Pilot003Header />

      <section id="acasa" className="relative flex min-h-[94svh] items-center overflow-hidden bg-[#111315] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(244,165,28,.16),transparent_28%),linear-gradient(180deg,#111315,#15191c)]" />
        <div aria-hidden="true" className="absolute inset-0 opacity-[.12] [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:52px_52px]" />
        <div aria-hidden="true" className="absolute -right-24 top-16 h-72 w-72 rounded-full border-[34px] border-[#f4a51c]/10" />
        <div className="relative mx-auto grid w-full max-w-[1580px] gap-10 px-5 py-20 md:px-9 md:py-28 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[0.14em]">
              <span className="rounded-full border border-[#f4a51c]/25 bg-[#f4a51c]/10 px-3 py-2 text-[#f8b647]">București & împrejurimi</span>
              <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-white/55">Pilot #003</span>
            </div>
            <h1 className="mt-7 max-w-[860px] text-[clamp(62px,8.4vw,128px)] font-black leading-[0.82] tracking-[-0.074em]">
              Asfaltăm suprafețe care trebuie să țină.
            </h1>
            <p className="mt-7 max-w-2xl text-[16px] leading-7 text-white/56 md:text-[18px] md:leading-8">
              Curți, parcări, platforme și drumuri de acces. Măsurăm. Ofertăm. Executăm.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/templates/asfaltari-bucuresti/contact" className="rounded-[11px] bg-[#f4a51c] px-6 py-3.5 text-sm font-black text-[#111315]">Solicită evaluare</Link>
              <Link href="/templates/asfaltari-bucuresti/galerie" className="rounded-[11px] border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-bold text-white">Vezi lucrările</Link>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 border-y border-white/10 py-5">
              {[
                ["24–48h", "evaluare demo"],
                ["7–10 zile", "fereastră demo"],
                ["B + IF", "zonă principală"],
              ].map(([value, label]) => (
                <div key={label} className="border-r border-white/10 px-4 first:pl-0 last:border-r-0">
                  <p className="text-[23px] font-black tracking-[-0.05em] md:text-[30px]">{value}</p>
                  <p className="mt-1 text-[8px] uppercase tracking-[0.14em] text-white/30">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div
              className="min-h-[620px] overflow-hidden rounded-[30px] border border-white/10 bg-[#34393b] bg-cover bg-center shadow-[0_42px_120px_rgba(0,0,0,.42)] lg:min-h-[720px]"
              style={{ backgroundImage: `linear-gradient(180deg,rgba(10,12,13,.02),rgba(10,12,13,.38)), url(${heroImage})` }}
            />
            <div className="absolute bottom-5 left-5 right-5 rounded-[16px] border border-white/10 bg-[#101214]/88 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/32">Status operațional · demo</p>
                  <p className="mt-2 text-[20px] font-black tracking-[-0.04em]">Echipe active în București</p>
                </div>
                <span className="flex items-center gap-2 rounded-full border border-[#5bdb8a]/20 bg-[#5bdb8a]/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-[#75e29c]">
                  <span className="h-2 w-2 rounded-full bg-[#75e29c] shadow-[0_0_0_5px_rgba(117,226,156,.10)]" />
                  Operațional
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/8 bg-white">
        <div className="mx-auto grid max-w-[1500px] gap-4 px-5 py-6 md:grid-cols-4 md:px-9">
          {[
            ["Bază", "București"],
            ["Acoperire", "București · Ilfov · împrejurimi"],
            ["Tip clienți", "Rezidențial · comercial · industrial"],
            ["Ofertare", "După evaluare și măsurători"],
          ].map(([label, value]) => (
            <div key={label} className="border-l-2 border-[#f4a51c] px-4 py-2">
              <p className="text-[8px] font-black uppercase tracking-[0.15em] text-black/30">{label}</p>
              <p className="mt-1 text-[12px] font-bold text-black/66">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f1f1ed]" id="servicii">
        <div className="mx-auto max-w-[1500px] px-5 py-20 md:px-9 md:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.62fr_1.38fr]">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#c47700]">Servicii</p>
              <h2 className="mt-5 text-[46px] font-black leading-[0.93] tracking-[-0.058em] md:text-[68px]">De la teren brut la suprafață finală.</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-black/50">Vezi din start etapele, utilajele și ce urmează pe teren.</p>
            </div>
            <div className="grid overflow-hidden rounded-[20px] border border-black/10 bg-white sm:grid-cols-2">
              {services.map(([number, title, copy]) => (
                <article key={number} className="border-b border-black/10 p-6 sm:border-r sm:[&:nth-child(2n)]:border-r-0 md:p-8">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#c47700]">{number}</span>
                    <span className="h-2 w-2 rounded-full bg-[#f4a51c]" />
                  </div>
                  <h3 className="mt-10 text-[23px] font-black tracking-[-0.04em]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-black/48">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="transparenta" className="bg-[#111315] text-white">
        <div className="mx-auto max-w-[1500px] px-5 py-20 md:px-9 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#f4a51c]">Transparență operațională</p>
              <h2 className="mt-5 text-[46px] font-black leading-[0.93] tracking-[-0.058em] md:text-[68px]">Știi cu cine lucrezi înainte să intre utilajele pe teren.</h2>
              <p className="mt-6 max-w-lg text-sm leading-7 text-white/45">Echipă, status și capacitate de lucru — vizibile înainte de programare.</p>
            </div>
            <div className="overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.035]">
              {[
                ["Starea firmei", "Operațional", "verde"],
                ["Echipe active", "3 echipe · DEMO", ""],
                ["Capacitate estimată", "următorul interval: 7–10 zile · DEMO", ""],
                ["Utilaje", "finisor · cilindri · excavator · miniîncărcător · autobasculante", ""],
                ["Arie de lucru", "București + Ilfov; deplasări extinse la ofertă", ""],
                ["Documentație", "ofertă etapizată · proces verbal · recepție lucrare", ""],
              ].map(([label, value, status]) => (
                <div key={label} className="grid gap-3 border-b border-white/10 px-5 py-5 last:border-b-0 sm:grid-cols-[0.42fr_1fr] sm:items-center md:px-7">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30">{label}</p>
                  <div className="flex items-center gap-3">
                    {status === "verde" && <span className="h-2.5 w-2.5 rounded-full bg-[#75e29c] shadow-[0_0_0_5px_rgba(117,226,156,.10)]" />}
                    <p className="text-[13px] font-semibold text-white/72">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="utilaje" className="bg-white">
        <div className="mx-auto max-w-[1500px] px-5 py-20 md:px-9 md:py-28">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#c47700]">Flotă & utilaje</p>
              <h2 className="mt-5 max-w-4xl text-[46px] font-black leading-[0.93] tracking-[-0.058em] md:text-[68px]">Utilajul potrivit pentru fiecare etapă.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-black/48">Flota potrivită, explicată pe scurt pentru fiecare tip de lucrare.</p>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fleet.map(([title, copy, tag], index) => (
              <article key={title} className="group rounded-[18px] border border-black/9 bg-[#f4f4f0] p-6 transition hover:-translate-y-1 hover:bg-[#efefe9]">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-[12px] bg-[#171a1c] text-[8px] font-black tracking-[0.08em] text-[#f4a51c]">{tag}</span>
                  <span className="text-[9px] font-black text-black/22">0{index + 1}</span>
                </div>
                <h3 className="mt-10 text-[24px] font-black tracking-[-0.045em]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-black/48">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="lucrari" className="border-y border-black/8 bg-[#e8e8e2]">
        <div className="mx-auto max-w-[1500px] px-5 py-20 md:px-9 md:py-28">
          <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#c47700]">Lucrări selectate · demo</p>
              <h2 className="mt-5 text-[46px] font-black leading-[0.93] tracking-[-0.058em] md:text-[68px]">Rezultatul se vede în teren.</h2>
            </div>
            <Link href="/templates/asfaltari-bucuresti/galerie" className="w-fit rounded-[11px] bg-[#111315] px-5 py-3 text-[11px] font-bold text-white">Galerie completă →</Link>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {pilot003Projects.slice(0, 3).map((project) => <ProjectCard key={project.title} project={project} />)}
          </div>
        </div>
      </section>

      <section id="proces" className="bg-[#f7f7f3]">
        <div className="mx-auto max-w-[1500px] px-5 py-20 md:px-9 md:py-28">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#c47700]">Cum lucrăm</p>
          <div className="mt-6 grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
            <h2 className="text-[46px] font-black leading-[0.93] tracking-[-0.058em] md:text-[68px]">Măsurăm. Explicăm. Executăm.</h2>
            <div className="border-t border-black/10">
              {[
                ["01", "Evaluare în teren", "Măsurăm suprafața, verificăm accesul, terenul existent, pantele și modul de utilizare."],
                ["02", "Deviz pe etape", "Separăm clar pregătirea terenului, materialele, transportul și asfaltarea pentru ca oferta să fie ușor de înțeles."],
                ["03", "Execuție organizată", "Programăm utilajele și echipa, protejăm accesul unde este posibil și urmărim fiecare etapă până la compactarea finală."],
                ["04", "Recepție", "Verificăm lucrarea împreună și documentăm eventualele observații înainte de închidere."],
              ].map(([number, title, copy]) => (
                <div key={number} className="grid gap-4 border-b border-black/10 py-7 sm:grid-cols-[70px_0.48fr_1fr]">
                  <span className="text-[10px] font-black text-[#c47700]">{number}</span>
                  <h3 className="text-[20px] font-black tracking-[-0.035em]">{title}</h3>
                  <p className="text-sm leading-6 text-black/48">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="start" className="bg-[#f4a51c] px-5 py-6 md:px-9">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-7 rounded-[22px] bg-[#111315] px-6 py-10 text-white md:flex-row md:items-end md:justify-between md:px-9 md:py-12">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#f4a51c]">București · Ilfov · împrejurimi</p>
            <h2 className="mt-4 max-w-4xl text-[42px] font-black leading-[0.95] tracking-[-0.055em] md:text-[60px]">Ai o suprafață de asfaltat? Începem cu măsurătorile.</h2>
          </div>
          <Link href="/templates/asfaltari-bucuresti/contact" className="inline-flex h-12 shrink-0 items-center justify-center rounded-[11px] bg-[#f4a51c] px-6 text-sm font-black text-[#111315]">Contact →</Link>
        </div>
      </section>

      <Pilot003Footer />
    </main>
  );
}

export function Pilot003GalleryPage() {
  return (
    <main className="min-h-screen bg-[#f1f1ed] text-[#111315]" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Pilot003DemoBar />
      <Pilot003Header active="galerie" />
      <section className="bg-[#111315] px-5 py-16 text-white md:px-9 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#f4a51c]">Galerie · lucrări demonstrative</p>
          <h1 className="mt-5 max-w-5xl text-[clamp(52px,7vw,98px)] font-black leading-[0.9] tracking-[-0.065em]">Lucrări prezentate clar, nu ascunse într-un carusel.</h1>
          <p className="mt-7 max-w-2xl text-[16px] leading-7 text-white/50">Fiecare proiect poate afișa tipul lucrării, suprafața, etapele și fotografiile reale ale clientului. Conținutul de mai jos este demo.</p>
        </div>
      </section>
      <section className="mx-auto max-w-[1500px] px-5 py-16 md:px-9 md:py-24">
        <div className="mb-8 flex flex-wrap gap-2">
          {["Toate", "Rezidențial", "Comercial", "Industrial", "Reparații"].map((filter, index) => (
            <span key={filter} className={`rounded-full border px-4 py-2 text-[10px] font-bold ${index === 0 ? "border-[#111315] bg-[#111315] text-white" : "border-black/10 bg-white text-black/48"}`}>{filter}</span>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {pilot003Projects.map((project, index) => <ProjectCard key={project.title} project={project} priority={index === 0 || index === 5} />)}
        </div>
        <div className="mt-12 rounded-[20px] border border-black/10 bg-white p-6 md:p-8">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#c47700]">Notă pilot</p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-black/52">Fotografiile sunt imagini demonstrative din surse stock gratuite. În implementarea clientului, galeria se înlocuiește cu fotografii autentice ale lucrărilor, organizate pe proiect și etapă.</p>
        </div>
      </section>
      <Pilot003Footer />
    </main>
  );
}

export function Pilot003ContactPage() {
  return (
    <main className="min-h-screen bg-[#efefe9] text-[#111315]" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Pilot003DemoBar />
      <Pilot003Header active="contact" />
      <section className="bg-[#111315] px-5 py-16 text-white md:px-9 md:py-24">
        <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#f4a51c]">Contact · București</p>
            <h1 className="mt-5 text-[clamp(52px,6.5vw,92px)] font-black leading-[0.9] tracking-[-0.065em]">Spune-ne ce suprafață ai de asfaltat.</h1>
            <p className="mt-7 max-w-xl text-[16px] leading-7 text-white/50">Pentru o ofertă corectă avem nevoie de locație, suprafață aproximativă, acces și câteva detalii despre terenul existent.</p>
            <div className="mt-10 grid gap-3">
              {[
                ["Telefon / WhatsApp", "07xx xxx xxx"],
                ["E-mail", "oferta@viaforte.demo"],
                ["Bază operațională", "București, România"],
                ["Acoperire", "București · Ilfov · împrejurimi"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[14px] border border-white/10 bg-white/[0.035] px-5 py-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-white/28">{label}</p>
                  <p className="mt-2 text-[14px] font-bold text-white/75">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-[#191c1e] p-5 shadow-[0_35px_100px_rgba(0,0,0,.25)] md:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#f4a51c]">Solicitare ofertă · demo</p>
                <h2 className="mt-2 text-[28px] font-black tracking-[-0.045em]">Evaluare inițială</h2>
              </div>
              <span className="rounded-full border border-[#75e29c]/20 bg-[#75e29c]/10 px-3 py-2 text-[8px] font-black uppercase tracking-[0.12em] text-[#75e29c]">formular demo</span>
            </div>
            <form className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ["Nume / companie", "Ex. Andrei Popescu"],
                ["Telefon", "07xx xxx xxx"],
                ["Locația lucrării", "București / Ilfov"],
                ["Suprafață aproximativă", "Ex. 650 m²"],
              ].map(([label, placeholder]) => (
                <label key={label} className="grid gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-white/34">
                  {label}
                  <input placeholder={placeholder} className="h-12 rounded-[10px] border border-white/10 bg-white/[0.04] px-4 text-[12px] font-medium normal-case tracking-normal text-white outline-none placeholder:text-white/22 focus:border-[#f4a51c]/65" />
                </label>
              ))}
              <label className="grid gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-white/34 sm:col-span-2">
                Tip lucrare
                <select defaultValue="" className="h-12 rounded-[10px] border border-white/10 bg-[#202427] px-4 text-[12px] font-medium normal-case tracking-normal text-white/75 outline-none focus:border-[#f4a51c]/65">
                  <option value="" disabled>Alege tipul lucrării</option>
                  <option>Curte / parcare</option>
                  <option>Drum de acces</option>
                  <option>Platformă industrială</option>
                  <option>Reparație / plombare</option>
                  <option>Altă lucrare</option>
                </select>
              </label>
              <label className="grid gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-white/34 sm:col-span-2">
                Detalii
                <textarea rows={5} placeholder="Descrie terenul actual, accesul, utilizarea suprafeței și orice termen important." className="rounded-[10px] border border-white/10 bg-white/[0.04] px-4 py-3 text-[12px] font-medium normal-case tracking-normal text-white outline-none placeholder:text-white/22 focus:border-[#f4a51c]/65" />
              </label>
              <button type="button" className="h-12 rounded-[10px] bg-[#f4a51c] text-[12px] font-black text-[#111315] sm:col-span-2">Trimite solicitarea</button>
            </form>
            <p className="mt-4 text-[10px] leading-5 text-white/28">Demo vizual: formularul nu transmite date. În proiectul real poate fi conectat la modulul Leads / CRM al clientului prin contractul ORBYVEN existent.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-4 px-5 py-16 md:grid-cols-[1.15fr_0.85fr] md:px-9 md:py-24">
        <div className="relative min-h-[360px] overflow-hidden rounded-[20px] border border-black/10 bg-[#d9d9d2]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_48%,rgba(244,165,28,.23),transparent_9%),linear-gradient(135deg,transparent_0_19%,rgba(0,0,0,.06)_19%_20%,transparent_20%_43%,rgba(0,0,0,.06)_43%_44%,transparent_44%_66%,rgba(0,0,0,.06)_66%_67%,transparent_67%),linear-gradient(45deg,#ecece6,#cfcfc7)]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#111315] text-[16px] text-[#f4a51c] shadow-[0_12px_30px_rgba(0,0,0,.18)]">●</span>
            <p className="mt-3 rounded-full bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] shadow">București · bază demo</p>
          </div>
        </div>
        <div className="rounded-[20px] border border-black/10 bg-white p-6 md:p-8">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#c47700]">Aria de lucru</p>
          <h2 className="mt-4 text-[37px] font-black leading-[0.98] tracking-[-0.05em]">Baza în București. Deplasări în funcție de proiect.</h2>
          <p className="mt-5 text-sm leading-7 text-black/50">Pentru lucrări în afara zonei principale, costul deplasării și logistica utilajelor sunt prezentate separat în ofertă.</p>
          <div className="mt-7 border-t border-black/10 pt-5 text-[11px] font-semibold text-black/48">
            <p>Program demo · L–V 07:30–18:00</p>
            <p className="mt-2">Evaluări în teren · cu programare</p>
          </div>
        </div>
      </section>
      <Pilot003Footer />
    </main>
  );
}
