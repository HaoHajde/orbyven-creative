import type { Metadata } from "next";

import type { SeoLandingPage } from "@/lib/seo-foundation";

export function buildEnglishSeoMetadata({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  const englishUrl = `https://www.orbyven.com${path}`;
  const romanianUrl = `https://orbyven.ro${path}`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: englishUrl,
      languages: {
        "en": englishUrl,
        "en-US": englishUrl,
        "ro": romanianUrl,
        "ro-RO": romanianUrl,
        "x-default": englishUrl,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: englishUrl,
      title,
      description,
      siteName: "ORBYVEN CREATIVE",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "ORBYVEN CREATIVE" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export const seoLandingPagesEn: SeoLandingPage[] = [
  {
    slug: "creare-site",
    path: "/creare-site",
    title: "Website development",
    metaTitle: "Professional website development for businesses | ORBYVEN",
    description:
      "Premium website development for businesses: clear structure, mobile-first design, technical SEO and a simple path from visit to enquiry.",
    eyebrow: "Website development",
    h1: "A website that makes it clear why your business is worth choosing.",
    intro:
      "ORBYVEN builds websites for businesses that need more than an online presence. We start with what customers need to understand, remove unnecessary noise and connect the public website to the real business workflow.",
    primaryKeyword: "website development",
    secondaryKeywords: ["business website", "professional website", "web design", "website design"],
    proof: [
      { title: "Clear message", copy: "Visitors quickly understand what you offer, who it is for and what to do next." },
      { title: "Mobile-first", copy: "The experience is designed for phones from the start instead of being squeezed down from desktop." },
      { title: "Technical SEO", copy: "Semantic structure, metadata, sitemap, canonicals and relevant schema are prepared for search." },
    ],
    deliverables: [
      { title: "Architecture", copy: "Pages and sections organized around real customer intent." },
      { title: "Design", copy: "A coherent visual identity instead of a generic template placed behind a logo." },
      { title: "Conversion", copy: "Calls to action, forms, messaging or booking flows where they make sense." },
      { title: "Room to grow", copy: "The website can later connect to leads, scheduling, quotes and other ORBYVEN workspace modules." },
    ],
    steps: [
      { number: "01", title: "Clarify the offer", copy: "We define your services, audience and the action you want visitors to take." },
      { number: "02", title: "Build the journey", copy: "We organize content and design so users do not hit unnecessary steps." },
      { number: "03", title: "Launch and verify", copy: "We check mobile behavior, technical SEO, forms and indexing after launch." },
    ],
    faq: [
      { question: "Is Google optimization included?", answer: "Yes. Technical SEO foundations are built in: metadata, semantic structure, sitemap, robots, canonicals and schema where relevant." },
      { question: "Can the website include business tools?", answer: "Yes. ORBYVEN can connect the public site to leads, scheduling, quotes and other operational workflows depending on the project." },
      { question: "Can you work with businesses outside Romania?", answer: "Yes. Digital projects can be delivered remotely, and the English ORBYVEN experience is designed for international projects as well." },
    ],
    related: [
      { href: "/site-prezentare", label: "Business websites" },
      { href: "/redesign-site", label: "Website redesign" },
      { href: "/templates", label: "Explore templates" },
    ],
  },
  {
    slug: "site-prezentare",
    path: "/site-prezentare",
    title: "Business website",
    metaTitle: "Modern business websites | ORBYVEN",
    description:
      "Modern business websites with clear services, proof, contact paths, technical SEO and a fast mobile experience.",
    eyebrow: "Business website",
    h1: "Present your business without making people hunt for answers.",
    intro:
      "A strong business website is not a digital brochure. It answers the questions that appear before someone calls: what you do, who it is for, how your work looks and how a customer can start.",
    primaryKeyword: "business website",
    secondaryKeywords: ["company website", "service website", "website design", "web development"],
    proof: [
      { title: "Offer in sight", copy: "Important services are explained without bloated menus or generic filler." },
      { title: "Trust", copy: "Work, process and contact details appear where visitors actually need them." },
      { title: "Search ready", copy: "Important pages can have their own topic, title, description and canonical URL." },
    ],
    deliverables: [
      { title: "Home", copy: "Positioning, differentiation and a clear path to the most important services." },
      { title: "Services", copy: "Pages or sections aligned with commercial search intent." },
      { title: "Proof", copy: "Work and examples shown with enough context to build confidence." },
      { title: "Contact", copy: "Forms, messaging, phone or scheduling without unnecessary steps." },
    ],
    steps: [
      { number: "01", title: "Inventory the information", copy: "We remove what does not help and keep what answers real questions." },
      { number: "02", title: "Build the pages", copy: "Each page has a clear purpose and a next action." },
      { number: "03", title: "Prepare indexing", copy: "Canonicals, sitemap, robots and search indexing are checked after launch." },
    ],
    faq: [
      { question: "How many pages should a business website have?", answer: "There is no fixed number. The structure should cover important services and questions without creating pages just for volume." },
      { question: "Can it be expanded later?", answer: "Yes. The architecture can start simple and grow with new pages, ORBYVEN modules or integrations." },
      { question: "Can we start from a template?", answer: "Yes. ORBYVEN templates are starting directions; content, branding and functionality are then adapted to the business." },
    ],
    related: [
      { href: "/creare-site", label: "Website development" },
      { href: "/redesign-site", label: "Website redesign" },
      { href: "/templates", label: "Explore templates" },
    ],
  },
  {
    slug: "redesign-site",
    path: "/redesign-site",
    title: "Website redesign",
    metaTitle: "Website redesign and migration | ORBYVEN",
    description:
      "Website redesign with controlled migration, preserved useful signals, technical SEO and a cleaner responsive experience.",
    eyebrow: "Website redesign",
    h1: "Keep what works. Rebuild what slows the business down.",
    intro:
      "A redesign should not erase useful history. We inventory the current site, preserve valuable signals and rebuild what is unclear, slow or difficult to use.",
    primaryKeyword: "website redesign",
    secondaryKeywords: ["website refresh", "website migration", "business redesign", "web redesign"],
    proof: [
      { title: "Audit first", copy: "We identify what is worth keeping before changing structure or URLs." },
      { title: "Controlled migration", copy: "Removed or moved URLs receive relevant redirects instead of turning into broken paths." },
      { title: "SEO protected", copy: "Metadata, canonicals, internal linking and sitemap are rebuilt alongside the new experience." },
    ],
    deliverables: [
      { title: "URL inventory", copy: "A clear list of pages to keep, consolidate, move or remove." },
      { title: "New architecture", copy: "Navigation and structure aligned with how people search and compare." },
      { title: "Design & development", copy: "A cleaner, responsive and easier-to-use experience." },
      { title: "Redirect plan", copy: "301 mapping for pages that change address." },
    ],
    steps: [
      { number: "01", title: "Audit the current site", copy: "Pages, links and their roles are inventoried before redesign begins." },
      { number: "02", title: "Build the new version", copy: "Structure and design are tested before replacing the live website." },
      { number: "03", title: "Migrate and monitor", copy: "Redirects, sitemap and search visibility are checked after launch." },
    ],
    faq: [
      { question: "Can rankings change after a redesign?", answer: "Any migration can create movement, but risk is reduced when URLs, redirects, canonicals and internal linking are planned before launch." },
      { question: "Does everything have to be rebuilt?", answer: "No. Strong pages, content or functionality can stay. We rebuild only what needs to change." },
      { question: "Can we keep the current domain?", answer: "Yes. A redesign does not require a domain change unless there is a real reason to make one." },
    ],
    related: [
      { href: "/creare-site", label: "Website development" },
      { href: "/site-prezentare", label: "Business websites" },
      { href: "/contact", label: "Request an audit" },
    ],
  },
];

export function getLandingBySlugEn(slug: string) {
  return seoLandingPagesEn.find((page) => page.slug === slug);
}
