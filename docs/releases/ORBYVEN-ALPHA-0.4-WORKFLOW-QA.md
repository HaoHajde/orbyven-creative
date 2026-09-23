# ORBYVEN Alpha 0.4 — Business Workflow QA

Checkpoint after Alpha 0.3. No production fixture data has been inserted by this work.

## Implemented workflow

- CRM record → new work, estimate or appointment, with client context.
- Work → estimate, appointment or expense with task and client context.
- Estimate → client, work, appointment or expense; appointment → client or work.
- Task-specific client is preselected and locked in estimate, calendar and expense forms.
- Data functions verify organization-scoped client/work/document links before creating a related record. Supabase RLS remains the authorization boundary.
- CRM follow-up can be rescheduled or marked resolved; a history item is attempted and partial failure is disclosed.
- Global +Creează and related shortcuts obey enabled modules and finance role permissions.
- Overview/search deep links focus the exact selected CRM/work/offer record after loading.

## Verification performed

- Read-only Supabase inspection: crm_leads, crm_lead_activities, ops_tasks, sales_estimates,
  sales_estimate_items, calendar_events, finance_expenses and supporting business tables
  had RLS enabled and role-specific policies at inspection time (23 September 2026).
- Supabase reported **zero business records** for CRM, work, estimates, calendar and expenses.
  This is NOT an authenticated two-tenant or full pilot E2E test.
- GitHub CI checks lint, TypeScript and production build on the PR. Record the final check status before merging.

## Required authenticated pilot acceptance (no credentials in GitHub)

Use **two separately authorized test organizations** and at least the roles
Owner, Manager, Member and Viewer. Use temporary data clearly marked as test;
remove it after acceptance if required.

1. Log in on desktop and mobile. Check /workspace redirects unauthenticated users.
2. Verify Owner and Manager can create and manage expenses. Verify Member sees
   business-create actions but not finance-create actions; Viewer sees no write actions.
3. For Org A: create a lead with follow-up, mark resolved, reschedule a second follow-up;
   verify Overview no longer shows the resolved alert.
4. Convert lead to client; open contextual create work; confirm the correct client is
   selected and retained in the saved work record.
5. Create estimate from work, add an item, save, change status. Verify client_id and
   task_id match; open the client and work from the saved estimate.
6. Create calendar event from work/estimate. Confirm client and task persist; return
   to the linked client and work from the event.
7. With Owner/Manager create expense from work/estimate, confirm linked client and
   work, and verify expense is visible in summary.
8. Open overdue work/lead/estimate alert and a global search result. Confirm exact
   record detail is visible without searching the list.
9. On Org B, try URLs or IDs from Org A using an authenticated Org B session.
   Org A records must not appear or be modified. Check forbidden writes show feedback.
10. Check keyboard search, Escape dismiss, touch navigation, mobile safe areas and
    browser reduced-motion scrolling. Confirm light/dark readability.
11. Re-check access after module disable and after membership role changes.

**Release note:** A green CI validates static checks and production compilation, not
authenticated browser flows. Do not mark the pilot acceptance complete without
the steps above.
