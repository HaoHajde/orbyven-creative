/**
 * Temporary ORBYVEN-facing export.
 *
 * The original Supabase client file still uses the historical
 * `orbita-supabase` filename. Keeping this shim lets the public app
 * use ORBYVEN naming without duplicating or changing the working client.
 *
 * Later, the underlying file can be renamed safely in one dedicated pass.
 */
export { orbitaSupabase as orbyvenSupabase } from "@/lib/orbita-supabase";
