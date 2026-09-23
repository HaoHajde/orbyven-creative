/**
 * Transactional owner notification for a successfully stored public project request.
 *
 * This intentionally sends through Resend, not through the Namecheap IMAP mailbox.
 * DNS verification and RESEND_API_KEY are required before enabling the feature.
 * Failure to send never changes the status of the already persisted request.
 */
type RequestNotification = {
  requestId: string;
  requestNumber: string;
  contactName: string;
  email: string;
  phone: string;
  companyName: string;
  paymentMode: string;
  planId: string | null;
  projectTitle: string;
  projectDetails: string;
  source: string;
};

const MAILBOX = "contact@orbyven.ro";

export async function notifyNewProjectRequest(input: RequestNotification): Promise<void> {
  if (process.env.ORBYVEN_PROJECT_EMAIL_NOTIFICATIONS_ENABLED !== "true") {
    return;
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("ORBYVEN project email notification not configured: missing RESEND_API_KEY");
    return;
  }

  const from = process.env.ORBYVEN_NOTIFICATION_FROM?.trim() ||
    `ORBYVEN CREATIVE <${MAILBOX}>`;
  const to = process.env.ORBYVEN_PROJECT_NOTIFICATION_TO?.trim() || MAILBOX;

  const message = [
    "A fost primită o cerere nouă prin website-ul ORBYVEN.",
    "",
    `Referință: ${input.requestNumber}`,
    `Nume: ${input.contactName}`,
    `Email: ${input.email}`,
    `Telefon: ${input.phone || "Nespecificat"}`,
    `Firmă: ${input.companyName || "Nespecificată"}`,
    `Tip colaborare: ${input.paymentMode}`,
    `Plan: ${input.planId || "Nespecificat"}`,
    `Proiect: ${input.projectTitle}`,
    `Sursă: ${input.source}`,
    "",
    "Detalii:",
    input.projectDetails,
    "",
    "Poți răspunde direct la acest e-mail; Reply-To este adresa solicitantului.",
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `orbyven-project-request-${input.requestId}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: input.email,
        subject: `ORBYVEN · Cerere nouă ${input.requestNumber}`,
        text: message,
      }),
      signal: AbortSignal.timeout(4500),
      cache: "no-store",
    });

    if (!response.ok) {
      // Do not log message content, recipient details, or API credentials.
      console.error("ORBYVEN project email notification failed", response.status);
    }
  } catch {
    // The project request has already been stored; a transient mail outage
    // must not turn a successful submission into a customer-facing 500 error.
    console.error("ORBYVEN project email notification could not be delivered");
  }
}
