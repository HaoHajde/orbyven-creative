import SeoIndexPage from "@/components/seo/SeoIndexPage";
import { buildSeoMetadata, seoIndexLinks } from "@/lib/seo-foundation";

export const metadata = buildSeoMetadata({
  path: "/solutii",
  title: "Soluții website pentru firme | ORBYVEN",
  description: "Soluții ORBYVEN pentru creare site, site de prezentare, redesign și verticale precum instalații, detailing auto sau servicii de evenimente.",
});

export default function SolutionsPage() {
  return (
    <SeoIndexPage
      eyebrow="Soluții ORBYVEN"
      title="Nu vindem același site tuturor."
      intro="Pornim de la tipul afacerii, intenția de căutare și fluxul real de lucru. Aici sunt direcțiile pe care le-am separat pentru că rezolvă probleme diferite."
      items={seoIndexLinks.solutions}
    />
  );
}
