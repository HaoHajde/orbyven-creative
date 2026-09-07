type JsonObject = Record<string, unknown>;

const env = (name: string) => process.env[name]?.trim() ?? "";

export const oblioConfig = {
  enabled: env("ORBYVEN_OBLIO_ENABLED") === "true",
  email: env("OBLIO_EMAIL"),
  apiSecret: env("OBLIO_API_SECRET"),
  cif: env("OBLIO_CIF"),
  invoiceSeries: env("OBLIO_INVOICE_SERIES"),
  vatName: env("OBLIO_VAT_NAME"),
  vatPercentage: env("OBLIO_VAT_PERCENTAGE"),
  vatIncluded: env("OBLIO_VAT_INCLUDED") !== "false",
  spvSend: env("OBLIO_SPV_SEND") === "true",
  cronSecret: env("CRON_SECRET"),
} as const;

export function getOblioReadiness() {
  const missing: string[] = [];
  if (!oblioConfig.enabled) missing.push("ORBYVEN_OBLIO_ENABLED");
  if (!oblioConfig.email) missing.push("OBLIO_EMAIL");
  if (!oblioConfig.apiSecret) missing.push("OBLIO_API_SECRET");
  if (!oblioConfig.cif) missing.push("OBLIO_CIF");
  if (!oblioConfig.invoiceSeries) missing.push("OBLIO_INVOICE_SERIES");
  if (!oblioConfig.vatName) missing.push("OBLIO_VAT_NAME");
  if (!oblioConfig.vatPercentage) missing.push("OBLIO_VAT_PERCENTAGE");
  if (!oblioConfig.cronSecret) missing.push("CRON_SECRET");

  const percentage = Number(oblioConfig.vatPercentage);
  if (oblioConfig.vatPercentage && !Number.isFinite(percentage)) {
    missing.push("valid OBLIO_VAT_PERCENTAGE");
  }

  return { ready: missing.length === 0, enabled: oblioConfig.enabled, missing };
}

type OblioTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type OblioResponse<T> = {
  status?: number;
  statusMessage?: string;
  data?: T;
};

async function accessToken() {
  const body = new URLSearchParams();
  body.set("client_id", oblioConfig.email);
  body.set("client_secret", oblioConfig.apiSecret);

  const response = await fetch("https://www.oblio.eu/api/authorize/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const payload = (await response.json()) as OblioTokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "Oblio authorization failed.");
  }
  return payload.access_token;
}

async function oblioJson<T>(path: string, method: "POST" | "GET", body?: JsonObject) {
  const token = await accessToken();
  const response = await fetch(`https://www.oblio.eu/api/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const payload = (await response.json()) as OblioResponse<T>;
  if (!response.ok || payload.status === 400 || payload.status === 401) {
    throw new Error(payload.statusMessage || "Oblio request failed.");
  }
  return payload;
}

async function oblioForm<T>(path: string, body: URLSearchParams) {
  const token = await accessToken();
  const response = await fetch(`https://www.oblio.eu/api/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  const payload = (await response.json()) as OblioResponse<T>;
  if (!response.ok || payload.status === 400 || payload.status === 401) {
    throw new Error(payload.statusMessage || "Oblio request failed.");
  }
  return payload;
}

export type FiscalBillingAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
};

export async function issueOblioInvoice(input: {
  stripeInvoiceId: string;
  clientName: string;
  clientTaxId?: string | null;
  clientEmail?: string | null;
  address: FiscalBillingAddress;
  amountLei: number;
  planName: string;
  issueDate: string;
}) {
  const percentage = Number(oblioConfig.vatPercentage);
  const address = [input.address.line1, input.address.line2].filter(Boolean).join(", ");
  const country = input.address.country === "RO" ? "Romania" : input.address.country || "";

  const client: JsonObject = {
    cif: input.clientTaxId || "",
    name: input.clientName,
    address,
    state: input.address.state || "",
    city: input.address.city || "",
    country,
    email: input.clientEmail || "",
    save: 1,
  };
  if (input.clientTaxId && input.address.country === "RO") client.autocomplete = 1;

  const payload: JsonObject = {
    cif: oblioConfig.cif,
    client,
    issueDate: input.issueDate,
    dueDate: input.issueDate,
    seriesName: oblioConfig.invoiceSeries,
    language: "RO",
    precision: 2,
    currency: "RON",
    idempotencyKey: input.stripeInvoiceId,
    internalNote: `ORBYVEN Stripe invoice ${input.stripeInvoiceId}`,
    mentions: `Abonament ORBYVEN achitat online. Referință ${input.stripeInvoiceId}.`,
    sendEmail: input.clientEmail ? 1 : 0,
    products: [
      {
        name: `Abonament ORBYVEN ${input.planName}`,
        description: "Servicii software și digitale ORBYVEN",
        price: input.amountLei,
        measuringUnit: "buc",
        vatName: oblioConfig.vatName,
        vatPercentage: percentage,
        vatIncluded: oblioConfig.vatIncluded ? 1 : 0,
        quantity: 1,
        productType: "Serviciu",
        save: 0,
      },
    ],
    collect: {
      type: "Card",
      value: input.amountLei,
      issueDate: input.issueDate,
      mentions: `Stripe ${input.stripeInvoiceId}`,
    },
  };

  return oblioJson<{
    seriesName?: string;
    number?: string;
    link?: string;
  }>("docs/invoice", "POST", payload);
}

export async function sendOblioEinvoice(seriesName: string, number: string) {
  const body = new URLSearchParams();
  body.set("cif", oblioConfig.cif);
  body.set("seriesName", seriesName);
  body.set("number", number);
  return oblioForm<{ text?: string; sent?: boolean; code?: number }>("docs/einvoice", body);
}
