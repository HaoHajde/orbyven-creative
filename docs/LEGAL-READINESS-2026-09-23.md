# ORBYVEN — Legal readiness, 23.09.2026

This is a prelaunch engineering and legal-review checklist; it is NOT legal certification. No legal entity, VAT status, user employment clearance, or payment activation is presumed. Legal and financial professionals must review the final customer-facing contract and tax configuration.

## Military-status decision gate

Romanian Law 550/2004 art. 23(3) applies Law 80/1995 to Jandarmerie military cadres. Art. 30(2) restricts holding other posts and prohibits sole-shareholder status and direct administration/management of commercial companies for active cadres, subject to statutory exceptions. Seek written guidance on: exact personnel category; minor shareholding without control; beneficial ownership; PFA/independent services; royalties and software IP; permitted unpaid preparatory work; business communication; recusal and use of institution equipment/time; reporting/authorization requirements. Do not suggest nominee arrangements or a sham owner.

Sources: https://legislatie.just.ro/Public/DetaliiDocument/215866 and https://legislatie.just.ro/Public/FormaPrintabila/00000G0RA0I4D3YBEHS2FF3HBB80TJFU .

## Hard gates before commercial activation

- Written eligibility/organizational structure clearance.
- Confirm company name, company registration, CUI, office, contact emails, beneficial ownership, CAEN scope, VAT status and required registrations with lawyer/accountant.
- Hosting terms must allow commercial projects. Vercel Hobby is personal/noncommercial: https://vercel.com/legal/terms .
- Confirm banking, Stripe merchant and verified account, recurring subscription configuration and customer cancellation/access.
- Confirm plan prices and VAT labels everywhere before charging; Stripe test-mode does not establish commercial readiness.
- Validate fiscal issue moment, series, customer identity, tax treatment, credit notes/refunds, Oblio configuration, SPV/e-Factura responsibilities with accountant; activate worker only after testing and controls.
- Finalize B2B order form + subscription terms, minimum term and total cost communication, SLA, termination and data export.
- Consumer invitation flow: separate B2C terms, total price, deliverables, withdrawal per OUG 34/2014 art. 16 as applicable, durable confirmation, complaints, digital service conformity, consumer information and SAL icon.
- Download the ORIGINAL ANPC SAL pictogram (250x50) from https://anpc.ro and link on homepage to https://reclamatiisal.anpc.ro per ANPC Order 270/2026. A text SAL link is an interim aid, NOT proof of pictogram compliance. Do not hand-recreate the official art.
- Inventory photo/music/font/brand licenses; replace third-party hotlinked demo photos where permission is unknown. Obtain clients' consent for logos, portfolio and case study metrics.
- Full GDPR records: ORBYVEN controller vs processor role per flow, art. 28 DPA, real subprocessors/regions and transfer mechanisms, retention schedule, backups, deletion/export process, DSAR handling, incident response and access audit.
- For AI live: vendor/model contracts and retention, data-handling, acceptable content and IP rights, AI user notice, rate limits and review/publish controls.
- Security: positive/negative two-tenant RLS and Storage testing, service-role restriction, SEC DEFINER function review, password security, audit trail and recovery drills.
- Verify final live site with authenticated browser, on desktop and mobile. Check every branded client site separately.

## Current implementation branch

- Consumer information and AI transparency pages deliberately labeled prelaunch. They do NOT enable ordering.
- Cookie preference reopening in footer, category checkboxes when optional-cookie feature flag is enabled; optional trackers still require their own consent gates.
- Corrected contact/project form language from accepting a privacy policy to acknowledging an information notice; marketing choice stays separate.
- SAL ANPC text link in common footer; official pictogram still outstanding.
- Kept billing/Oblio configuration and deployments unchanged. Do not enable production Stripe or Oblio until all gates close.
