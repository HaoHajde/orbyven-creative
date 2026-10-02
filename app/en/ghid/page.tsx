import SeoIndexPage from "@/components/seo/SeoIndexPage";
import { buildEnglishSeoMetadata } from "@/lib/seo-foundation-en";

export const metadata = buildEnglishSeoMetadata({
  path: "/ghid",
  title: "Web design guides | ORBYVEN",
  description: "Practical ORBYVEN guidance about websites, redesign, structure, AI-assisted design and connected business workflows.",
});

const items = [
  { href: "/creare-site", label: "What a business website should do", copy: "Start with clarity, trust and one obvious next action instead of adding pages for the sake of volume." },
  { href: "/redesign-site", label: "When a redesign makes sense", copy: "Redesign when structure, speed or usability are holding the business back—not just because the site looks old." },
  { href: "/templates", label: "How to use templates well", copy: "Treat templates as design directions, then adapt the content, hierarchy and functionality to the business." },
  { href: "/ai-web-design", label: "AI-assisted web design", copy: "Use AI to explore structure and alternatives while keeping facts, components and publishing decisions controlled." },
];

export default function GuidesPage() {
  return (
    <SeoIndexPage
      locale="en"
      eyebrow="ORBYVEN Guides"
      title="Useful answers before you build."
      intro="Short, practical guidance for the decisions that matter before a website, redesign or connected workspace project starts."
      items={items}
    />
  );
}
