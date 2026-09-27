/**
 * PostgREST results have a configurable server-side row cap. Always page
 * aggregates that must stay exact when an organization grows past that cap.
 * The query callback MUST specify a deterministic order for stable pages.
 */
export async function readAllPages<T>(
  getPage: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
  pageSize = 500,
): Promise<T[]> {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) {
    throw new Error("Invalid PostgREST page size.");
  }
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await getPage(from, from + pageSize - 1);
    if (error) throw error;
    if (!data) throw new Error("PostgREST page data unavailable.");
    if (data.length > pageSize) throw new Error("PostgREST page exceeds requested size.");
    all.push(...data);
    if (data.length < pageSize) return all;
  }
}
