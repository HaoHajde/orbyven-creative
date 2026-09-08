import { orbyvenSupabase } from "@/lib/orbyven-supabase";

export type DocumentCategory =
  | "general"
  | "estimate"
  | "contract"
  | "invoice"
  | "photo"
  | "receipt"
  | "other";

export type BusinessDocument = {
  id: string;
  organization_id: string;
  name: string;
  category: DocumentCategory;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  client_id: string | null;
  task_id: string | null;
  estimate_id: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentLink = { id: string; name: string };
export type DocumentTaskLink = { id: string; title: string };
export type DocumentEstimateLink = { id: string; reference: string; title: string };

export type UploadDocumentInput = {
  file: File;
  category: DocumentCategory;
  clientId?: string | null;
  taskId?: string | null;
  estimateId?: string | null;
  note?: string;
};

const BUCKET = "orbyven-documents";
const FIELDS =
  "id,organization_id,name,category,storage_path,mime_type,size_bytes,client_id,task_id,estimate_id,note,created_by,created_at,updated_at";

function requireOrganizationId(organizationId: string) {
  if (!organizationId.trim()) throw new Error("organization_id is required.");
}

function safeFileName(name: string) {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "document";
}

export async function listDocuments(organizationId: string): Promise<BusinessDocument[]> {
  requireOrganizationId(organizationId);
  const { data, error } = await orbyvenSupabase
    .from("ops_documents")
    .select(FIELDS)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BusinessDocument[];
}

export async function listDocumentContexts(organizationId: string) {
  requireOrganizationId(organizationId);
  const [clientsResult, tasksResult, estimatesResult] = await Promise.all([
    orbyvenSupabase
      .from("crm_leads")
      .select("id,name")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    orbyvenSupabase
      .from("ops_tasks")
      .select("id,title")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false }),
    orbyvenSupabase
      .from("sales_estimates")
      .select("id,reference,title")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false }),
  ]);

  if (clientsResult.error) throw clientsResult.error;
  if (tasksResult.error) throw tasksResult.error;
  if (estimatesResult.error) throw estimatesResult.error;

  return {
    clients: (clientsResult.data ?? []) as DocumentLink[],
    tasks: (tasksResult.data ?? []) as DocumentTaskLink[],
    estimates: (estimatesResult.data ?? []) as DocumentEstimateLink[],
  };
}

export async function uploadDocument(
  organizationId: string,
  input: UploadDocumentInput
): Promise<BusinessDocument> {
  requireOrganizationId(organizationId);
  if (!input.file?.name) throw new Error("Selectează un fișier.");
  if (input.file.size > 20 * 1024 * 1024) throw new Error("Fișierul depășește limita de 20 MB.");

  const { data: authData } = await orbyvenSupabase.auth.getUser();
  const objectName = `${crypto.randomUUID()}-${safeFileName(input.file.name)}`;
  const path = `${organizationId}/${objectName}`;

  const { error: uploadError } = await orbyvenSupabase.storage
    .from(BUCKET)
    .upload(path, input.file, {
      cacheControl: "3600",
      contentType: input.file.type || undefined,
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data, error } = await orbyvenSupabase
    .from("ops_documents")
    .insert({
      organization_id: organizationId,
      name: input.file.name,
      category: input.category,
      storage_path: path,
      mime_type: input.file.type || null,
      size_bytes: input.file.size,
      client_id: input.clientId || null,
      task_id: input.taskId || null,
      estimate_id: input.estimateId || null,
      note: input.note?.trim() || null,
      created_by: authData.user?.id ?? null,
    })
    .select(FIELDS)
    .single();

  if (error) {
    await orbyvenSupabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
  return data as BusinessDocument;
}

export async function createDocumentSignedUrl(storagePath: string) {
  const { data, error } = await orbyvenSupabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteDocument(
  organizationId: string,
  document: Pick<BusinessDocument, "id" | "storage_path">
) {
  requireOrganizationId(organizationId);
  const { error: storageError } = await orbyvenSupabase.storage
    .from(BUCKET)
    .remove([document.storage_path]);
  if (storageError) throw storageError;

  const { error } = await orbyvenSupabase
    .from("ops_documents")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", document.id);
  if (error) throw error;
}
