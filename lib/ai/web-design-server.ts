import {
  createBillingServiceClient,
  type BillingActor,
} from "@/lib/billing/supabase-server";
import {
  readSiteDraft,
  type EditableSite,
  type SiteContentItem,
  type SiteFaqItem,
} from "@/lib/ai/site-editor";

type WebDesignConfig = {
  provider: "openai";
  apiKey: string;
  model: string;
  dailyLimit: number;
  minuteLimit: number;
};

type OpenAiResponsePayload = {
  output_text?: unknown;
  output?: Array<{
    type?: unknown;
    content?: Array<{ type?: unknown; text?: unknown }>;
  }>;
  usage?: {
    input_tokens?: unknown;
    output_tokens?: unknown;
  };
};

type ModelWebDesignResult = {
  summary: string;
  draft: Omit<EditableSite, "preset">;
  suggestions: string[];
};

export type WebDesignGenerationResult = {
  draft: EditableSite;
  summary: string;
  suggestions: string[];
  remainingToday: number | null;
  generatedBy: "orbyven_web_design_ai";
};

const WEB_DESIGN_FORMAT = {
  type: "json_schema",
  name: "orbyven_web_design",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: { type: "string", minLength: 2, maxLength: 500 },
      draft: {
        type: "object",
        additionalProperties: false,
        properties: {
          layout: { type: "string", enum: ["split", "centered", "editorial"] },
          headlineSize: { type: "string", enum: ["normal", "large"] },
          visualTone: {
            type: "string",
            enum: ["minimal", "editorial", "luxury", "technical", "warm", "bold"],
          },
          density: { type: "string", enum: ["airy", "balanced", "compact"] },
          radius: { type: "string", enum: ["soft", "rounded", "sharp"] },
          sectionOrder: {
            type: "array",
            minItems: 8,
            maxItems: 8,
            items: {
              type: "string",
              enum: ["hero", "services", "benefits", "about", "gallery", "process", "faq", "contact"],
            },
          },
          hiddenSections: {
            type: "array",
            maxItems: 7,
            items: {
              type: "string",
              enum: ["services", "benefits", "about", "gallery", "process", "faq", "contact"],
            },
          },
          variants: {
            type: "object",
            additionalProperties: false,
            properties: {
              hero: { type: "string", enum: ["split", "centered", "editorial"] },
              services: { type: "string", enum: ["cards", "list", "spotlight"] },
              benefits: { type: "string", enum: ["cards", "strip"] },
              about: { type: "string", enum: ["split", "story"] },
              gallery: { type: "string", enum: ["grid", "mosaic"] },
              process: { type: "string", enum: ["steps", "timeline"] },
              faq: { type: "string", enum: ["stack", "columns"] },
              contact: { type: "string", enum: ["split", "compact"] },
            },
            required: ["hero", "services", "benefits", "about", "gallery", "process", "faq", "contact"],
          },
          brand: { type: "string", minLength: 1, maxLength: 70 },
          eyebrow: { type: "string", minLength: 1, maxLength: 90 },
          headline: { type: "string", minLength: 3, maxLength: 140 },
          description: { type: "string", minLength: 3, maxLength: 420 },
          cta: { type: "string", minLength: 2, maxLength: 45 },
          servicesTitle: { type: "string", minLength: 2, maxLength: 80 },
          services: {
            type: "array",
            minItems: 3,
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string", minLength: 2, maxLength: 100 },
                description: { type: "string", minLength: 3, maxLength: 360 },
              },
              required: ["title", "description"],
            },
          },
          benefitsTitle: { type: "string", minLength: 2, maxLength: 90 },
          benefits: {
            type: "array",
            minItems: 3,
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string", minLength: 2, maxLength: 100 },
                description: { type: "string", minLength: 3, maxLength: 360 },
              },
              required: ["title", "description"],
            },
          },
          aboutTitle: { type: "string", minLength: 2, maxLength: 100 },
          aboutDescription: { type: "string", minLength: 3, maxLength: 420 },
          galleryTitle: { type: "string", minLength: 2, maxLength: 90 },
          gallery: {
            type: "array",
            minItems: 3,
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string", minLength: 2, maxLength: 100 },
                description: { type: "string", minLength: 3, maxLength: 360 },
              },
              required: ["title", "description"],
            },
          },
          processTitle: { type: "string", minLength: 2, maxLength: 90 },
          process: {
            type: "array",
            minItems: 3,
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string", minLength: 2, maxLength: 100 },
                description: { type: "string", minLength: 3, maxLength: 360 },
              },
              required: ["title", "description"],
            },
          },
          faqTitle: { type: "string", minLength: 2, maxLength: 90 },
          faq: {
            type: "array",
            minItems: 2,
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                question: { type: "string", minLength: 3, maxLength: 140 },
                answer: { type: "string", minLength: 3, maxLength: 420 },
              },
              required: ["question", "answer"],
            },
          },
          contactTitle: { type: "string", minLength: 2, maxLength: 100 },
          contactDescription: { type: "string", minLength: 3, maxLength: 420 },
          accent: { type: "string", pattern: "^#[a-fA-F0-9]{6}$" },
          background: { type: "string", pattern: "^#[a-fA-F0-9]{6}$" },
          surface: { type: "string", pattern: "^#[a-fA-F0-9]{6}$" },
          textColor: { type: "string", pattern: "^#[a-fA-F0-9]{6}$" },
        },
        required: [
          "layout",
          "headlineSize",
          "visualTone",
          "density",
          "radius",
          "sectionOrder",
          "hiddenSections",
          "variants",
          "brand",
          "eyebrow",
          "headline",
          "description",
          "cta",
          "servicesTitle",
          "services",
          "benefitsTitle",
          "benefits",
          "aboutTitle",
          "aboutDescription",
          "galleryTitle",
          "gallery",
          "processTitle",
          "process",
          "faqTitle",
          "faq",
          "contactTitle",
          "contactDescription",
          "accent",
          "background",
          "surface",
          "textColor",
        ],
      },
      suggestions: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: { type: "string", minLength: 2, maxLength: 180 },
      },
    },
    required: ["summary", "draft", "suggestions"],
  },
} as const;

function boundedInt(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function webDesignConfig(): WebDesignConfig | null {
  if (process.env.ORBYVEN_WEB_DESIGN_AI_ENABLED?.trim().toLowerCase() !== "true") {
    return null;
  }
  if (process.env.ORBYVEN_WEB_DESIGN_PROVIDER?.trim().toLowerCase() !== "openai") {
    return null;
  }

  const apiKey = process.env.ORBYVEN_WEB_DESIGN_OPENAI_API_KEY?.trim() ?? "";
  const model = process.env.ORBYVEN_WEB_DESIGN_MODEL?.trim() ?? "";
  if (!apiKey || !model || model.length > 120) return null;

  return {
    provider: "openai",
    apiKey,
    model,
    dailyLimit: boundedInt(process.env.ORBYVEN_WEB_DESIGN_DAILY_LIMIT, 20, 1, 200),
    minuteLimit: boundedInt(process.env.ORBYVEN_WEB_DESIGN_MINUTE_LIMIT, 3, 1, 20),
  };
}

function extractOutputText(payload: OpenAiResponsePayload): string {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }
  const chunks: string[] = [];
  for (const item of payload.output ?? []) {
    if (item.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part.type === "output_text" && typeof part.text === "string") {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function usageFrom(payload: OpenAiResponsePayload) {
  const input = Number(payload.usage?.input_tokens ?? 0);
  const output = Number(payload.usage?.output_tokens ?? 0);
  return {
    input: Number.isSafeInteger(input) && input > 0 ? input : 0,
    output: Number.isSafeInteger(output) && output > 0 ? output : 0,
  };
}

function copyText(site: Omit<EditableSite, "preset"> | EditableSite) {
  const itemText = (items: SiteContentItem[]) =>
    items.flatMap((item) => [item.title, item.description]);
  const faqText = (items: SiteFaqItem[]) =>
    items.flatMap((item) => [item.question, item.answer]);

  return [
    site.brand,
    site.eyebrow,
    site.headline,
    site.description,
    site.cta,
    site.servicesTitle,
    ...itemText(site.services),
    site.benefitsTitle,
    ...itemText(site.benefits),
    site.aboutTitle,
    site.aboutDescription,
    site.galleryTitle,
    ...itemText(site.gallery),
    site.processTitle,
    ...itemText(site.process),
    site.faqTitle,
    ...faqText(site.faq),
    site.contactTitle,
    site.contactDescription,
  ].join("\n");
}

function normalizedNumbers(value: string) {
  return new Set(
    (value.match(/\d[\d.,]*/g) ?? []).map((token) => {
      const digits = token.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
      return digits || "0";
    })
  );
}

function generatedCopyPreservesFacts(
  generated: Omit<EditableSite, "preset">,
  prompt: string,
  current: EditableSite
) {
  const allowed = normalizedNumbers(prompt + "\n" + copyText(current));
  for (const token of normalizedNumbers(copyText(generated))) {
    if (!allowed.has(token)) return false;
  }
  if (/https?:\/\//i.test(copyText(generated))) return false;
  return true;
}

function parseModelResult(
  value: unknown,
  current: EditableSite,
  prompt: string
): ModelWebDesignResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const summary = typeof record.summary === "string" ? record.summary.trim().slice(0, 500) : "";
  const suggestions = Array.isArray(record.suggestions)
    ? record.suggestions
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, 180))
        .filter(Boolean)
        .slice(0, 4)
    : [];

  if (!summary || suggestions.length < 2) return null;
  const candidate = readSiteDraft({
    preset: current.preset,
    ...(record.draft && typeof record.draft === "object" ? record.draft : {}),
  });
  if (!candidate || !generatedCopyPreservesFacts(candidate, prompt, current)) return null;

  const normalizedPrompt = prompt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!/\b(brand|rebrand|rebranding|nume firma|numele firmei|denumire)\b/.test(normalizedPrompt)) {
    candidate.brand = current.brand;
  }

  const { preset, ...draft } = candidate;
  void preset;
  return { summary, draft, suggestions };
}

async function claimQuota(
  actor: BillingActor,
  config: WebDesignConfig
): Promise<{ requestId: string; remainingToday: number | null } | null> {
  const client = createBillingServiceClient();
  const { data, error } = await client.rpc("ai_web_design_claim", {
    p_organization_id: actor.organizationId,
    p_actor_id: actor.userId,
    p_provider: config.provider,
    p_model: config.model,
    p_daily_limit: config.dailyLimit,
    p_minute_limit: config.minuteLimit,
  });
  if (error) {
    console.error("ORBYVEN Web Design quota unavailable", error.code);
    return null;
  }
  const result = data as {
    allowed?: boolean;
    requestId?: string;
    remainingToday?: number;
  } | null;
  if (!result?.allowed || typeof result.requestId !== "string") return null;
  return {
    requestId: result.requestId,
    remainingToday:
      Number.isInteger(result.remainingToday) ? Number(result.remainingToday) : null,
  };
}

async function finishQuota(
  requestId: string,
  success: boolean,
  usage: { input: number; output: number },
  failureCode?: string
) {
  const client = createBillingServiceClient();
  const { error } = await client.rpc("ai_web_design_finish", {
    p_request_id: requestId,
    p_success: success,
    p_input_tokens: usage.input,
    p_output_tokens: usage.output,
    p_failure_code: failureCode ?? null,
  });
  if (error) console.error("ORBYVEN Web Design finalize failed", error.code);
}

export async function loadWebDesignDraft(actor: BillingActor) {
  const client = createBillingServiceClient();
  const { data, error } = await client
    .from("ai_web_design_drafts")
    .select("draft,revision,updated_at")
    .eq("organization_id", actor.organizationId)
    .eq("actor_id", actor.userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const draft = readSiteDraft(data.draft);
  if (!draft) return null;
  return {
    draft,
    revision: Number(data.revision) || 1,
    updatedAt: data.updated_at as string,
  };
}

export async function saveWebDesignDraft(
  actor: BillingActor,
  draft: EditableSite,
  source: "local" | "ai" | "preset",
  lastPrompt: string | null = null
) {
  if (actor.role === "viewer") throw new Error("WEB_DESIGN_EDIT_REQUIRED");
  const valid = readSiteDraft(draft);
  if (!valid) throw new Error("WEB_DESIGN_DRAFT_INVALID");

  const client = createBillingServiceClient();
  const { data: existing, error: existingError } = await client
    .from("ai_web_design_drafts")
    .select("revision")
    .eq("organization_id", actor.organizationId)
    .eq("actor_id", actor.userId)
    .maybeSingle();
  if (existingError) throw existingError;

  const revision = Math.max(1, Number(existing?.revision ?? 0) + 1);
  const { data, error } = await client
    .from("ai_web_design_drafts")
    .upsert(
      {
        organization_id: actor.organizationId,
        actor_id: actor.userId,
        draft: valid,
        source,
        last_prompt: lastPrompt?.trim().slice(0, 2000) || null,
        revision,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,actor_id" }
    )
    .select("revision,updated_at")
    .single();

  if (error) throw error;
  return {
    draft: valid,
    revision: Number(data.revision) || revision,
    updatedAt: data.updated_at as string,
  };
}

export async function generateWebDesignForActor(
  actor: BillingActor,
  prompt: string,
  current: EditableSite
): Promise<WebDesignGenerationResult> {
  if (actor.role === "viewer") throw new Error("WEB_DESIGN_EDIT_REQUIRED");

  const config = webDesignConfig();
  if (!config) throw new Error("WEB_DESIGN_AI_NOT_CONFIGURED");

  const quota = await claimQuota(actor, config);
  if (!quota) throw new Error("WEB_DESIGN_AI_QUOTA");

  const client = createBillingServiceClient();
  const { data: organization } = await client
    .from("organizations")
    .select("name,legal_name")
    .eq("id", actor.organizationId)
    .maybeSingle();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let usage = { input: 0, output: 0 };

  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model,
        store: false,
        instructions:
          "Ești ORBYVEN Web Design Intelligence. Transformă cererea într-un site coerent, mobile-first, premium și ușor de folosit. " +
          "Răspunsul trebuie să respecte exact schema JSON furnizată. Poți rescrie copy-ul și rearanja secțiunile, dar nu ai voie să inventezi fapte despre firmă. " +
          "Nu inventa recenzii, ratinguri, ani de experiență, număr de clienți, certificări, premii, prețuri, reduceri, adrese, telefoane, program, garanții, termene sau disponibilitate. " +
          "Orice cifră din copy trebuie să existe deja în cererea utilizatorului sau în draftul curent. Dacă lipsesc date reale pentru portofoliu, folosește etichete neutre precum «Exemplu vizual» și explică faptul că trebuie înlocuite. " +
          "Nu produce URL-uri, cod, JSX, JavaScript, CSS, HTML sau markdown. Alege numai variantele și câmpurile permise de schemă. " +
          "Păstrează un CTA principal clar, ierarhie vizuală bună, texte scurte, contrast bun și o paletă coerentă. Nu ascunde secțiunea hero.",
        input: JSON.stringify({
          user_request: prompt.slice(0, 2000),
          organization_name: organization?.name ?? null,
          legal_name: organization?.legal_name ?? null,
          current_site: current,
        }),
        max_output_tokens: 3600,
        text: { format: WEB_DESIGN_FORMAT },
      }),
    });

    if (!upstream.ok) {
      await finishQuota(quota.requestId, false, usage, `HTTP_${upstream.status}`);
      throw new Error("WEB_DESIGN_UPSTREAM");
    }

    const payload = (await upstream.json()) as OpenAiResponsePayload;
    usage = usageFrom(payload);
    const output = extractOutputText(payload);
    if (!output) {
      await finishQuota(quota.requestId, false, usage, "EMPTY_OUTPUT");
      throw new Error("WEB_DESIGN_EMPTY_OUTPUT");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(output);
    } catch {
      await finishQuota(quota.requestId, false, usage, "INVALID_JSON");
      throw new Error("WEB_DESIGN_INVALID_OUTPUT");
    }

    const result = parseModelResult(parsed, current, prompt);
    if (!result) {
      await finishQuota(quota.requestId, false, usage, "OUTPUT_GUARD");
      throw new Error("WEB_DESIGN_OUTPUT_GUARD");
    }

    const nextDraft = readSiteDraft({
      preset: current.preset,
      ...result.draft,
    });
    if (!nextDraft) {
      await finishQuota(quota.requestId, false, usage, "DRAFT_INVALID");
      throw new Error("WEB_DESIGN_DRAFT_INVALID");
    }

    await saveWebDesignDraft(actor, nextDraft, "ai", prompt);
    await finishQuota(quota.requestId, true, usage);

    return {
      draft: nextDraft,
      summary: result.summary,
      suggestions: result.suggestions,
      remainingToday: quota.remainingToday,
      generatedBy: "orbyven_web_design_ai",
    };
  } catch (error) {
    if (
      error instanceof Error &&
      ![
        "WEB_DESIGN_UPSTREAM",
        "WEB_DESIGN_EMPTY_OUTPUT",
        "WEB_DESIGN_INVALID_OUTPUT",
        "WEB_DESIGN_OUTPUT_GUARD",
        "WEB_DESIGN_DRAFT_INVALID",
      ].includes(error.message)
    ) {
      const code = error.name === "AbortError" ? "TIMEOUT" : "UPSTREAM_ERROR";
      await finishQuota(quota.requestId, false, usage, code);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
