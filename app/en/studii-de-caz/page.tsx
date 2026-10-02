import SeoIndexPage from "@/components/seo/SeoIndexPage";
import { buildEnglishSeoMetadata } from "@/lib/seo-foundation-en";

export const metadata = buildEnglishSeoMetadata({
  path: "/studii-de-caz",
  title: "ORBYVEN pilots and case studies",
  description: "Explore ORBYVEN pilot directions across events, field service, infrastructure and automotive detailing.",
});

const items = [
  { href: "/templates/obsidian-moments", label: "Pilot #001 · Obsidian Moments", copy: "A visual event-services direction with packages, availability and a simple enquiry journey." },
  { href: "/templates/pilot-002", label: "Pilot #002 · Field Service", copy: "A service-business direction connecting the public website with visits, estimates and operational context." },
  { href: "/templates/viaforte", label: "Pilot #003 · Infrastructure", copy: "A heavy-services presentation focused on work, equipment, credibility and clear commercial contact." },
  { href: "/templates/haos-customs", label: "Pilot #005 · Automotive", copy: "A premium visual direction for detailing where before-and-after proof and booking intent matter." },
];

export default function CaseStudiesPage() {
  return (
    <SeoIndexPage
      locale="en"
      eyebrow="Case studies"
      title="Different industries. The same rule: keep the public experience simple."
      intro="Our pilots test how the public website can stay clear while the operational complexity moves into the ORBYVEN workspace."
      items={items}
    />
  );
}
