import SeoIndexPage from "@/components/seo/SeoIndexPage";
import { buildSeoMetadata, seoIndexLinks } from "@/lib/seo-foundation";

export const metadata = buildSeoMetadata({
  path: "/studii-de-caz",
  title: "Studii de caz și piloți ORBYVEN",
  description: "Piloți ORBYVEN pentru evenimente, instalații, asfaltări și detailing auto. Ce am construit, ce flux testăm și cum se leagă site-ul de workspace.",
});

export default function CaseStudiesPage() {
  return (
    <SeoIndexPage
      eyebrow="Studii de caz"
      title="Ce am construit și ce testăm în fiecare pilot."
      intro="Descriem implementarea fără rezultate inventate. Fiecare pilot testează o verticală, un traseu de utilizare și o combinație diferită de site public + workspace."
      items={seoIndexLinks.caseStudies}
    />
  );
}
