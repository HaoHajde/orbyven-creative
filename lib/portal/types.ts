export type CustomerPortalOperation = {
  id: string;
  kind: "work" | "order";
  title: string;
  status: "planned" | "in_progress" | "blocked" | "done" | "cancelled";
  progress: number;
  scheduledAt: string | null;
  dueAt: string | null;
  location: string | null;
};

export type CustomerPortalEstimateItem = {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  position: number;
};

export type CustomerPortalEstimate = {
  id: string;
  reference: string;
  title: string;
  status: "sent" | "accepted" | "rejected" | "expired";
  currency: string;
  subtotalCents: number;
  discountCents: number;
  taxRate: number | null;
  totalCents: number;
  validUntil: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  items: CustomerPortalEstimateItem[];
};

export type CustomerPortalDocument = {
  id: string;
  name: string;
  category: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
};

export type CustomerPortalPayment = {
  id: string;
  occurredOn: string;
  amountCents: number;
  currency: string;
  reference: string | null;
};

export type CustomerPortalSnapshot = {
  organization: {
    name: string;
    legalName: string | null;
  };
  client: {
    name: string;
    company: string | null;
  };
  link: {
    expiresAt: string;
  };
  operations: CustomerPortalOperation[];
  estimates: CustomerPortalEstimate[];
  documents: CustomerPortalDocument[];
  payments: CustomerPortalPayment[];
};
