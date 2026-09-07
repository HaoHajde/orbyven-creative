import { notFound } from "next/navigation";

import ClientTemplateSite from "@/components/ClientTemplateSite";
import { clientTemplateCatalog, type ClientTemplateSlug } from "@/lib/client-template-catalog";

export function generateStaticParams() {
  return Object.keys(clientTemplateCatalog).map((slug) => ({ slug }));
}

export default async function ClientTemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = clientTemplateCatalog[slug as ClientTemplateSlug];

  if (!template) notFound();

  return <ClientTemplateSite template={template} />;
}
