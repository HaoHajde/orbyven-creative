import SeoIndexPage from "@/components/seo/SeoIndexPage";
import { buildEnglishSeoMetadata } from "@/lib/seo-foundation-en";

export const metadata = buildEnglishSeoMetadata({
  path: "/solutii",
  title: "Digital solutions for businesses | ORBYVEN",
  description: "ORBYVEN solutions for websites, redesign, AI-assisted web design and connected business workspaces.",
});

const items = [
  { href: "/creare-site", label: "Website development", copy: "A clear, fast and scalable public website built around the way customers understand your business." },
  { href: "/site-prezentare", label: "Business websites", copy: "A focused presentation of your offer, proof and contact paths without unnecessary complexity." },
  { href: "/redesign-site", label: "Website redesign", copy: "Keep useful signals and rebuild the experience, structure and performance that hold the site back." },
  { href: "/ai-web-design", label: "AI Web Design", copy: "Turn a business brief into structured website directions, live previews and controlled refinements." },
  { href: "/servicii", label: "ORBYVEN Workspace", copy: "Connect clients, projects, scheduling, quotes and operational modules in one context." },
];

export default function SolutionsPage() {
  return (
    <SeoIndexPage
      locale="en"
      eyebrow="ORBYVEN Solutions"
      title="One ecosystem. Different ways to start."
      intro="Start with the problem you need to solve. ORBYVEN can remain a focused public website or grow into a connected workspace as the business needs more."
      items={items}
    />
  );
}
