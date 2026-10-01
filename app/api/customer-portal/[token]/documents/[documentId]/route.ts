import { NextResponse } from "next/server";

import { createPortalServiceClient, loadPortalDocument } from "@/lib/portal/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string; documentId: string }> }
) {
  const { token, documentId } = await context.params;
  try {
    const document = await loadPortalDocument(token, documentId);
    if (!document) return NextResponse.json({ error: "Document indisponibil." }, { status: 404 });

    const service = createPortalServiceClient();
    const { data, error } = await service.storage
      .from("orbyven-documents")
      .createSignedUrl(document.storagePath, 60);

    if (error || !data?.signedUrl) throw error ?? new Error("signed_url_missing");
    return NextResponse.redirect(data.signedUrl, { status: 302 });
  } catch (error) {
    console.error("[customer-portal-document]", error);
    return NextResponse.json({ error: "Documentul nu a putut fi deschis." }, { status: 500 });
  }
}
