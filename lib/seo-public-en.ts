import type { Metadata } from "next";

export type EnglishSeoLanding = {
  slug: string;
  path: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  proof: { title: string; copy: string }[];
  deliverables: { title: string; copy: string }[];
  faq: { question: string; answer: string }[];
};

export const englishSeoLandings: EnglishSeoLanding[] = [
  {
    slug: "creare-site",
    path: "/creare-site",
    title: "Professional website development | ORBYVEN",
    description: "Professional website development for businesses: clear structure, premium design, mobile-first UX, technical SEO and a direct path to conversion.",
    eyebrow: "Website development",
    h1: "A website that makes the value of your business clear fast.",
    intro: "ORBYVEN builds websites around what customers need to understand, what they need to trust and what action should come next. The result is designed as a business tool, not a decorative brochure.",
    proof: [
      { title: "Clear positioning", copy: "Visitors understand what you offer, who it is for and what to do next." },
      { title: "Mobile-first", copy: "Layouts and interactions are designed for phones first, not merely scaled down from desktop." },
      { title: "Technical SEO", copy: "Semantic structure, metadata, sitemap, canonical URLs and schema are built into the foundation." },
    ],
    deliverables: [
      { title: "Information architecture", copy: "Pages and sections organized around real customer intent." },
      { title: "Visual system", copy: "A coherent interface shaped around the brand instead of a generic template." },
      { title: "Conversion paths", copy: "Forms, WhatsApp, booking or other CTAs placed where they make sense." },
      { title: "Room to grow", copy: "The website can later connect to leads, scheduling, quotes and workspace modules." },
    ],
    faq: [
      { question: "Is technical SEO included?", answer: "Yes. The technical foundation includes metadata, semantic structure, sitemap, robots, canonical URLs and relevant structured data." },
      { question: "Can the website connect to business tools?", answer: "Yes. Public pages can connect to ORBYVEN modules such as leads, calendar, estimates and operational workflows." },
    ],
  },
  {
    slug: "site-prezentare",
    path: "/site-prezentare",
    title: "Business websites | ORBYVEN",
    description: "Modern business websites with clear services, portfolio, contact flows, technical SEO and a fast mobile experience.",
    eyebrow: "Business website",
    h1: "Present your business without making people hunt for answers.",
    intro: "A strong business website answers the questions that appear before a call: what you do, who you help, where you work, what your work looks like and how a customer can start.",
    proof: [
      { title: "Offer in plain sight", copy: "Important services are easy to understand without unnecessary navigation." },
      { title: "Trust by context", copy: "Portfolio, process and contact information appear where they support the decision." },
      { title: "Search-ready", copy: "Important pages can each own a clear topic, title, description and canonical URL." },
    ],
    deliverables: [
      { title: "Home", copy: "Positioning, differentiation and a direct route to the important services." },
      { title: "Services", copy: "Pages or sections aligned with real commercial intent." },
      { title: "Work / portfolio", copy: "Examples with enough context to build trust." },
      { title: "Contact", copy: "Form, phone, WhatsApp or booking without unnecessary friction." },
    ],
    faq: [
      { question: "How many pages should a business website have?", answer: "There is no fixed number. The structure should cover the important services and questions without creating pages just for volume." },
      { question: "Can it grow later?", answer: "Yes. The architecture can start simple and expand with new pages, ORBYVEN modules or integrations." },
    ],
  },
  {
    slug: "web-design-bucuresti",
    path: "/web-design-bucuresti",
    title: "Web design Bucharest for businesses | ORBYVEN",
    description: "Web design in Bucharest for businesses that need a clear, fast and easy-to-use website with strategy, design, development and technical SEO.",
    eyebrow: "Web design · Bucharest",
    h1: "Web design for Bucharest businesses that do not want a generic website.",
    intro: "A modern look is only part of the job. The website also needs to explain the offer, work flawlessly on mobile and give search engines a structure they can understand.",
    proof: [
      { title: "Local context", copy: "Pages can reflect the services and areas you genuinely serve without artificial location pages." },
      { title: "Premium interface", copy: "The design starts from the brand and the user journey, not from a generic catalog." },
      { title: "SEO without tricks", copy: "Structure follows search intent and avoids repetitive pages created only for keywords." },
    ],
    deliverables: [
      { title: "Page strategy", copy: "We decide what deserves a dedicated page and what belongs in a section." },
      { title: "Mobile UX", copy: "Navigation, CTAs and forms designed around phone usage." },
      { title: "Local SEO foundation", copy: "Titles, descriptions and local context only where they can be supported truthfully." },
      { title: "Launch checks", copy: "Search Console, sitemap and indexing are verified after publication." },
    ],
    faq: [
      { question: "Do I need a registered office in Bucharest?", answer: "No. The page is relevant to businesses that genuinely serve the Bucharest market." },
      { question: "Do you also redesign existing websites?", answer: "Yes. Valuable URLs and content can be preserved while the experience is rebuilt." },
    ],
  },
  {
    slug: "redesign-site",
    path: "/redesign-site",
    title: "Website redesign | ORBYVEN",
    description: "Website redesign for businesses: audit, new information architecture, modern UX, mobile improvements and controlled SEO migration.",
    eyebrow: "Website redesign",
    h1: "Change the experience without throwing away what already works.",
    intro: "A redesign is not just a new color palette. We inventory the existing pages and journeys, keep the useful signals and rebuild what is unclear, slow or difficult to use.",
    proof: [
      { title: "Audit before design", copy: "We identify what should be preserved before changing URLs or structure." },
      { title: "Controlled migration", copy: "Removed or moved pages receive relevant redirects instead of becoming dead ends." },
      { title: "SEO continuity", copy: "Metadata, canonical URLs, internal linking and sitemap are rebuilt with the new experience." },
    ],
    deliverables: [
      { title: "URL inventory", copy: "A clear map of pages to keep, consolidate, move or remove." },
      { title: "New architecture", copy: "Navigation aligned with how people search and compare." },
      { title: "Design & development", copy: "A cleaner responsive experience built around the important journeys." },
      { title: "Redirect plan", copy: "301 mapping for pages whose address changes." },
    ],
    faq: [
      { question: "Can rankings change after a redesign?", answer: "Any migration can cause movement, but planning URLs, redirects, canonical tags and internal links reduces avoidable risk." },
      { question: "Does everything need to be rebuilt?", answer: "No. Strong pages, content and functionality can be preserved." },
    ],
  },
  {
    slug: "site-pentru-firme-mici",
    path: "/site-pentru-firme-mici",
    title: "Websites for small businesses | ORBYVEN",
    description: "Websites for small businesses with clear services, fast contact, technical SEO and the option to add business modules later.",
    eyebrow: "Small business",
    h1: "Simple enough to use. Strong enough to build trust.",
    intro: "Small businesses rarely need dozens of pages. They need the right customer to understand the service, the area, the difference and the fastest way to get in touch.",
    proof: [
      { title: "Focused scope", copy: "Start from the useful minimum and add only what solves a real need." },
      { title: "Fast contact", copy: "Phone, WhatsApp, form or booking based on how the business actually works." },
      { title: "Expandable", copy: "The website can later become the entry point to leads, scheduling or estimates." },
    ],
    deliverables: [
      { title: "Presentation", copy: "Who you are, what you do and what makes the offer different." },
      { title: "Services", copy: "Short, easy-to-compare explanations." },
      { title: "Proof", copy: "Work, images or process without invented testimonials." },
      { title: "Contact", copy: "A simple route to a message, call or request." },
    ],
    faq: [
      { question: "Can a small website still rank?", answer: "Yes. Useful, well-structured pages that answer real search intent matter more than simply having many pages." },
      { question: "Can I start without an online store or CRM?", answer: "Yes. Start with what makes sense now and keep the foundation extensible." },
    ],
  },
  {
    slug: "site-pentru-instalatori",
    path: "/site-pentru-instalatori",
    title: "Websites for plumbing and HVAC services | ORBYVEN",
    description: "Websites for plumbing, heating and field-service businesses with services, coverage, project proof, WhatsApp and quote-ready lead flows.",
    eyebrow: "Field service",
    h1: "Move customers from a real problem to the right contact path.",
    intro: "A field-service customer may have an urgent issue or may be comparing a larger project. The website needs to support both: fast contact and enough context for higher-value work.",
    proof: [
      { title: "Service clarity", copy: "Heating, plumbing, floor heating and maintenance can each have the right context and CTA." },
      { title: "Real coverage", copy: "Service areas and travel conditions are explained without artificial local pages." },
      { title: "Lead to quote", copy: "A website request can continue into visit, estimate and project workflows." },
    ],
    deliverables: [
      { title: "Technical services", copy: "Organized around customer needs instead of one long list." },
      { title: "Project proof", copy: "Work examples and explanations that support trust." },
      { title: "Fast contact", copy: "WhatsApp, phone or form for details and photos." },
      { title: "Operational flow", copy: "Optional leads, visits, estimates, materials and calendar in the same ecosystem." },
    ],
    faq: [
      { question: "Can customers upload photos?", answer: "Yes, when the project flow benefits from it. Uploads can be connected to the request or lead." },
      { question: "Can I show only the cities I actually serve?", answer: "Yes. Real coverage is better for users and healthier for SEO than artificial location pages." },
    ],
  },
  {
    slug: "site-pentru-detailing-auto",
    path: "/site-pentru-detailing-auto",
    title: "Websites for auto detailing | ORBYVEN",
    description: "Premium auto detailing websites with before/after visuals, packages, configurators, galleries and a simple booking path.",
    eyebrow: "Auto detailing",
    h1: "Detailing is sold visually. The website should prove the difference immediately.",
    intro: "For premium detailing, imagery, packages and trust matter before long descriptions. The experience should show the result, explain the service and make the next step obvious.",
    proof: [
      { title: "Visual proof", copy: "Before/after work is positioned as evidence, not decoration." },
      { title: "Package clarity", copy: "Services and upgrades are easier to compare." },
      { title: "Booking path", copy: "The selected need can continue into an estimate or appointment flow." },
    ],
    deliverables: [
      { title: "Cinematic presentation", copy: "Strong visual impact without sacrificing usability." },
      { title: "Before / after", copy: "Dedicated comparisons for real work." },
      { title: "Packages", copy: "Clear service levels and upgrade logic." },
      { title: "Booking", copy: "A direct path from interest to the next available action." },
    ],
    faq: [
      { question: "Can I show different packages?", answer: "Yes. Packages can be compared visually and extended with optional upgrades." },
      { question: "Can the website connect to scheduling?", answer: "Yes. Selections can continue into an appointment or lead workflow." },
    ],
  },
  {
    slug: "site-pentru-servicii-evenimente",
    path: "/site-pentru-servicii-evenimente",
    title: "Websites for event services | ORBYVEN",
    description: "Websites for event-service businesses with visual portfolio, packages, inquiry flows and digital event experiences.",
    eyebrow: "Event services",
    h1: "Sell the atmosphere and make the next step effortless.",
    intro: "Event businesses are judged quickly through visuals, clarity and trust. We organize the offer so customers can understand the direction, compare options and start a conversation without friction.",
    proof: [
      { title: "Visual-first", copy: "Strong media leads the experience without hiding the offer." },
      { title: "Package clarity", copy: "Services and options can be compared without long walls of text." },
      { title: "Connected inquiries", copy: "Requests can continue into event workflows instead of disappearing into an inbox." },
    ],
    deliverables: [
      { title: "Portfolio", copy: "Work presented with context and clear categories." },
      { title: "Services", copy: "Packages and custom options explained simply." },
      { title: "Inquiry flow", copy: "A concise path to date, venue, needs and contact details." },
      { title: "Digital experiences", copy: "Optional invitations, RSVP and event-specific microsites." },
    ],
    faq: [
      { question: "Can the site include event-specific pages?", answer: "Yes. Digital invitations, RSVP or microsites can be added where they support the service." },
      { question: "Can leads continue into the dashboard?", answer: "Yes. Inquiry data can become operational context instead of a disconnected email." },
    ],
  },
];

export function getEnglishLanding(slug: string) {
  return englishSeoLandings.find((page) => page.slug === slug);
}

export function buildEnglishLandingMetadata(page: EnglishSeoLanding): Metadata {
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: {
      canonical: `https://www.orbyven.com${page.path}`,
      languages: {
        "en": `https://www.orbyven.com${page.path}`,
        "ro-RO": `https://orbyven.ro${page.path}`,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `https://www.orbyven.com${page.path}`,
      title: page.title,
      description: page.description,
      siteName: "ORBYVEN CREATIVE",
    },
  };
}
