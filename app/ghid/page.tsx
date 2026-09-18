import SeoIndexPage from "@/components/seo/SeoIndexPage";
import { buildSeoMetadata, seoIndexLinks } from "@/lib/seo-foundation";

export const metadata = buildSeoMetadata({
  path: "/ghid",
  title: "Ghid website pentru firme | ORBYVEN",
  description: "Ghiduri ORBYVEN despre site-uri de prezentare, structură, redesign, costuri și rolul website-ului într-o afacere.",
});

export default function GuidesPage() {
  return (
    <SeoIndexPage
      eyebrow="Ghid ORBYVEN"
      title="Răspunsuri utile înainte să cumperi un site."
      intro="Fără articole scrise pentru volum. Doar întrebări care apar real înainte de un proiect și explicații suficient de clare ca să iei o decizie."
      items={seoIndexLinks.guides}
    />
  );
}
