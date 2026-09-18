import Link from "next/link";

import type { SeoLink } from "@/lib/seo-foundation";

export default function Breadcrumbs({ items }: { items: SeoLink[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-black/42">
      <Link href="/" className="transition hover:text-black">Acasă</Link>
      {items.map((item) => (
        <span key={item.href} className="flex items-center gap-2">
          <span aria-hidden="true">/</span>
          <Link href={item.href} className="transition hover:text-black">{item.label}</Link>
        </span>
      ))}
    </nav>
  );
}
