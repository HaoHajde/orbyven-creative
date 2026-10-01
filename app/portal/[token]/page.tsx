import type { Metadata } from "next";

import CustomerPortalView from "@/components/portal/CustomerPortalView";
import { loadCustomerPortalSnapshot } from "@/lib/portal/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Portal client | ORBYVEN",
  robots: { index: false, follow: false, nocache: true },
};

export default async function CustomerPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const snapshot = await loadCustomerPortalSnapshot(token);

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-[#f5f5f7] px-5 py-16 text-[#1d1d1f]">
        <div className="mx-auto max-w-xl rounded-[32px] border border-black/5 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/40">ORBYVEN Portal</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.045em]">Link indisponibil</h1>
          <p className="mt-3 text-sm leading-6 text-black/55">
            Linkul a expirat, a fost revocat sau nu mai este valid. Solicită firmei un link nou.
          </p>
        </div>
      </main>
    );
  }

  return <CustomerPortalView token={token} snapshot={snapshot} />;
}
