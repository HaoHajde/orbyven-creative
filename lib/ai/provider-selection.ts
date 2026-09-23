export type RemoteAiProvider = "openai" | "cloudflare";
export type EditorAiProvider = "local" | RemoteAiProvider;

/** Explicit opt-in. Missing/invalid config always selects free local mode. */
export function editorAiProvider(): EditorAiProvider {
  const configured = process.env.ORBYVEN_AI_PROVIDER?.trim().toLowerCase();
  return configured === "openai" || configured === "cloudflare"
    ? configured : "local";
}

export function cloudflareAiReady(): boolean {
  return /^[a-f0-9]{32}$/i.test(process.env.CLOUDFLARE_AI_ACCOUNT_ID?.trim() ?? "") &&
    Boolean(process.env.CLOUDFLARE_AI_API_TOKEN?.trim());
}
