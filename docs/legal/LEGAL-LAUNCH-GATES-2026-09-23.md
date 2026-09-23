# ORBYVEN — legal launch gates (draft, 2026-09-23)
Status: PRE-LAUNCH. Not a legal opinion or legal-compliance certification. No live billing, e-Factura, automatic AI-provider enablement or Vercel deploy authorized by this document.

## Mandatory external decisions
- Confirm professional-status compatibility with qualified Romanian counsel and the competent Jandarmerie/MAI unit in writing. Art. 23(3), Law 550/2004; Art. 30(2), Law 80/1995. Specifically ask about sole shareholder, minority shareholder, director, actual management, remunerated independent work, beneficial ownership and conflict-of-interest restrictions. Do not use a nominee to conceal actual management.
- Confirm real entity, company number, registered office, contact channels, beneficial ownership, relevant CAEN activities and business/brand authorizations with ONRC/counsel.
- Accountant signs off tax status, prices (including/excluding VAT), Stripe→Oblio invoice timing, numbering, cancellations/refunds, e-Factura scope and transmission deadlines.
- Confirm hosting plan expressly permits commercial use; Vercel scope currently inaccessible through connector (403).
- Obtain appropriate DPA/subprocessor terms, retention periods and cross-border data-transfer review for Supabase, Vercel, Stripe, email, invoicing and AI provider.
- Obtain documented photo, music, logos and case-study permissions; pilot florist uses third-party remote image URLs.
- Obtain OFFICIAL 250×50 ANPC SAL pictogram from anpc.ro for homepage (Ordin 449/2022 as amended by 270/2026). The currently implemented 250×50 textual SAL link is a temporary accessible fallback, NOT the official pictogram.

## Technical checks before commercialization
- Verify env vars against legal identity: ORBYVEN_LEGAL_NAME, ORBYVEN_TAX_ID, ORBYVEN_REGISTRATION_NUMBER, ORBYVEN_REGISTERED_OFFICE, ORBYVEN_VAT_LABEL, NEXT_PUBLIC_ORBYVEN_PRICE_TAX_LABEL. Never fill with placeholders in production.
- Keep ORBYVEN_BILLING_ENABLED, ORBYVEN_BILLING_LIVE_CONFIRMED, ORBYVEN_OBLIO_ENABLED and NEXT_PUBLIC_BILLING_ENTITLEMENTS_ENFORCED false until explicit sign-off.
- RLS negative tests across two authenticated tenants including document Storage URLs, RPC functions, service role routes; advisor warnings for SECURITY DEFINER and password protection need disposition. RLS-enabled/no-policy for server-only tables is intentional only if verified.
- Data subject request procedure, data retention table, backup deletion windows, incident response and processor notification, role records and functional export/deletion tests.
- AI prompts: approve AI provider/model, DPA, purpose, retention, international transfer and training settings, prompt-injection/content security controls, per-tenant isolation, abuse limits and transparent notices.
- B2C: final service terms, precontractual information, withdrawal and digital-content/start-of-service consent flow if applicable, durable order confirmation, mandatory pay-button language, complaints and accessible official ANPC icon.
- Document classification: native quote/estimate vs invoice. Do NOT describe sales_commercial_documents as accounting invoices or imply direct ANAF certification.
- Cookies: audit all optional scripts before enabling NEXT_PUBLIC_OPTIONAL_COOKIES_ENABLED; consent UI alone does not block third-party scripts.

## Legal sources
- https://legislatie.just.ro/Public/DetaliiDocument/221425
- https://legislatie.just.ro/Public/DetaliiDocument/268315
- https://legislatie.just.ro/Public/DetaliiDocument/257649
- https://legislatie.just.ro/Public/DetaliiDocument/310590
- https://legislatie.just.ro/Public/DetaliiDocument/307805

## Scope of this branch
Non-deployed legal-readiness changes for user-facing notices, cookie preference access, SAL link, 12-month indicative total and privacy-information wording. No claim of complete compliance. Require CI, design and lawyer/accountant review before merging.
