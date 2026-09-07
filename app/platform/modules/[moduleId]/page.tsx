import Link from "next/link";

const names: Record<string, string> = {
  clients: "Clienți",
  jobs: "Lucrări",
  bookings: "Rezervări",
  quotes: "Oferte",
};

export default async function ModulePlaceholder({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const name = names[moduleId] ?? "Modul";

  return (
    <main className="min-h-screen bg-[#fbfbfd] px-6 py-10 text-[#1d1d1f] antialiased dark:bg-black dark:text-[#f5f5f7] md:px-10">
      <div className="mx-auto max-w-[1200px]">
        <Link
          href="/platform"
          className="inline-flex h-10 items-center rounded-full border border-black/[0.1] px-4 text-sm font-medium dark:border-white/[0.14]"
        >
          ← Workspace
        </Link>

        <section className="mt-16 rounded-[34px] border border-black/[0.07] bg-white p-8 md:p-12 dark:border-white/[0.1] dark:bg-[#111113]">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#86868b]">ORBYVEN · MODUL PORTABIL</p>
          <h1 className="mt-5 text-[48px] font-semibold leading-none tracking-[-0.055em] md:text-[68px]">{name}</h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-[#6e6e73] dark:text-[#a1a1a6]">
            Structura platformei este pregătită pentru acest modul. Implementarea funcțională poate fi conectată aici fără să reconstruim autentificarea, compania sau shell-ul aplicației.
          </p>
        </section>
      </div>
    </main>
  );
}
