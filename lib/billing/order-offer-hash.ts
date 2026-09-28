import { createHash } from "node:crypto";

/** Digest of the exact offer snapshot, stable across PostgreSQL jsonb key reordering. */
export function hashOrderOffer(snapshot:unknown) {
  const canonical=JSON.stringify(snapshot,(_key,value)=>
    value && typeof value==="object" && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value as Record<string,unknown>)
        .sort(([a],[b])=>a<b?-1:a>b?1:0))
      : value
  );
  if(typeof canonical!=="string")throw new Error("Missing offer snapshot.");
  return createHash("sha256").update(canonical,"utf8").digest("hex");
}
