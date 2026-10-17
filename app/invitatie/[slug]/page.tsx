import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PublishedInvitation from "@/components/invitations/PublishedInvitation";
import { isInvitationSlug } from "@/lib/invitations/contracts";
import { loadPublishedInvitation } from "@/lib/invitations/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isInvitationSlug(slug)) {
    return { title: "Invitație ORBYVEN", robots: { index: false, follow: false } };
  }

  const project = await loadPublishedInvitation(slug).catch(() => null);
  return {
    title: project ? `${project.title} · Invitație` : "Invitație ORBYVEN",
    description: project?.draft.description ?? "Invitație online ORBYVEN.",
    robots: { index: false, follow: false, noarchive: true },
  };
}

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isInvitationSlug(slug)) notFound();

  const project = await loadPublishedInvitation(slug).catch((error) => {
    console.error("ORBYVEN public invitation load error", error);
    return null;
  });
  if (!project) notFound();

  return (
    <PublishedInvitation
      slug={project.slug}
      projectType={project.projectType}
      draft={project.draft}
    />
  );
}
