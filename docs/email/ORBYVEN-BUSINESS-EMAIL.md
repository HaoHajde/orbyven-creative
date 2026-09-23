# ORBYVEN · Business Email v1

## Confirmed manually, 23 September 2026

- Human inbox: `contact@orbyven.ro`, Namecheap Private Email Launch, 5 GB.
- Aliases: `office@`, `support@`, `billing@`, `florin@` on the same domain.
- DNS hosted in Vercel; Namecheap MX1/MX2, SPF, DKIM and DMARC records were entered.
- Gmail outbound authentication check: SPF PASS, DKIM PASS, DMARC PASS.
- Inbox successfully received a reply from Gmail.
- DMARC is initially `p=none`. Don't turn on enforcement before auditing every sender.

## Webmail signature — paste into Namecheap settings

ORBYVEN CREATIVE
Web design & digital experiences

contact@orbyven.ro
https://orbyven.ro

Website-uri și instrumente digitale pentru afaceri.

(Do not include unverified legal data, a personal telephone number or fabricated company registration details.)

## Security steps requiring the mailbox owner

1. Private Email settings → Security → enable two-factor authentication.
2. Pair the authenticator app and complete the code challenge personally.
3. Save recovery codes securely, outside the mailbox itself.
4. Never share passwords, 2FA codes or recovery codes in chat.

## Transactional web notifications

- Form submissions already persist via Supabase RPC `submit_project_request`.
- `lib/email/project-request-notification.ts` sends an owner notification ONLY after persistence.
- Default recipient: `contact@orbyven.ro`; Reply-To: the requester's email.
- Off by default: `ORBYVEN_PROJECT_EMAIL_NOTIFICATIONS_ENABLED=false`.
- When disabled or without `RESEND_API_KEY`, the request flow continues with no email.
- Mail failures do not change a successfully saved submission into a 500.
- Requests use a stable idempotency key to reduce duplicate provider sends.
- No Namecheap mailbox password is required or stored in the repository.

### Activation checklist

1. In the connected Resend account, sending for `orbyven.ro` must be VERIFIED.
2. Add only the requested Resend DNS records at Vercel. Do not remove Namecheap MX, its root SPF, or `privateemail._domainkey`. Resend uses `send` return path plus `resend._domainkey`.
3. Re-run provider verification. Do not add a second root SPF record.
4. Add `RESEND_API_KEY` as a Vercel server-side secret (not `NEXT_PUBLIC_`).
5. Set `ORBYVEN_PROJECT_EMAIL_NOTIFICATIONS_ENABLED=true` in the desired environment, and redeploy ONCE after the rate limit resets.
6. Send one test request via /contact, confirm request number and mailbox notification; then repeat via /cerere.
7. Test Reply-To and delivery authentication for both transactional and mailbox senders.

This file does not assert that Resend is verified or that production notifications are enabled.
