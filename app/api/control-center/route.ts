import { NextResponse } from "next/server";
import { loadControlCenterBillingSnapshots } from "@/lib/billing/control-center";
import {
  assignControlCenterMember,
  authorizeControlCenter,
  ControlCenterHttpError,
  createControlCenterOrganization,
  inviteControlCenterMember,
  loadControlCenterPayload,
  removeControlCenterMember,
  removePlatformStaff,
  requireStaffRole,
  sendControlCenterAccessEmail,
  setControlCenterModules,
  setMemberAccessStatus,
  setOrganizationLifecycle,
  updateControlCenterOrganization,
  upsertPlatformStaff,
} from "@/lib/orbyven-control-center-server";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  console.error(error);

  if (error instanceof ControlCenterHttpError) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: error.status }
    );
  }

  const maybeCode =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  if (maybeCode === "23505") {
    return NextResponse.json(
      {
        error: "duplicate_value",
        message: "Există deja o înregistrare cu această valoare unică.",
      },
      { status: 409 }
    );
  }

  return NextResponse.json(
    {
      error: "control_center_operation_failed",
      message: "Operația Control Center nu a putut fi finalizată.",
    },
    { status: 500 }
  );
}

export async function GET(request: Request) {
  try {
    const { admin, user, staffRole, staffSource } = await authorizeControlCenter(request);
    const payload = await loadControlCenterPayload(
      admin,
      user,
      staffRole,
      staffSource
    );

    // Chat 3 owns the commercial state. Platform Core consumes its adapter and
    // never recreates subscription/entitlement logic.
    const billing = await loadControlCenterBillingSnapshots(
      admin,
      payload.organizations.map((organization) => organization.id)
    );
    const organizations = payload.organizations.map((organization) => ({
      ...organization,
      subscription:
        billing.snapshots.get(organization.id) ?? organization.subscription,
    }));

    // Until Chat 1 introduces an explicit organization switcher, client accounts
    // remain single-organization. Existing members are not offered as assignable.
    const assignedUserIds = new Set(
      organizations.flatMap((organization) =>
        organization.members.map((member) => member.user_id)
      )
    );

    return NextResponse.json(
      {
        ...payload,
        organizations,
        entitlement_source: billing.source,
        auth_users: payload.auth_users.filter(
          (authUser) => !assignedUserIds.has(authUser.id)
        ),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { admin, user, staffRole } = await authorizeControlCenter(request);
    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";
    const origin = new URL(request.url).origin;

    const requireAdmin = () =>
      requireStaffRole(staffRole, ["platform_owner", "platform_admin"]);

    switch (action) {
      case "create_organization": {
        requireAdmin();
        const organizationId = await createControlCenterOrganization(
          admin,
          user,
          staffRole,
          body
        );
        return NextResponse.json({ ok: true, organization_id: organizationId });
      }
      case "update_organization":
        requireAdmin();
        await updateControlCenterOrganization(admin, user, staffRole, body);
        return NextResponse.json({ ok: true });
      case "assign_member":
      case "update_member_role":
        requireAdmin();
        await assignControlCenterMember(admin, user, staffRole, body);
        return NextResponse.json({ ok: true });
      case "remove_member":
        requireAdmin();
        await removeControlCenterMember(admin, user, staffRole, body);
        return NextResponse.json({ ok: true });
      case "set_modules":
        requireAdmin();
        await setControlCenterModules(admin, user, staffRole, body);
        return NextResponse.json({ ok: true });
      case "set_organization_lifecycle":
        requireAdmin();
        await setOrganizationLifecycle(admin, user, staffRole, body);
        return NextResponse.json({ ok: true });
      case "set_member_access":
        requireAdmin();
        await setMemberAccessStatus(admin, user, staffRole, body);
        return NextResponse.json({ ok: true });
      case "invite_member": {
        requireAdmin();
        const result = await inviteControlCenterMember(
          admin,
          user,
          staffRole,
          body,
          origin
        );
        return NextResponse.json({ ok: true, ...result });
      }
      case "send_access_email":
        requireStaffRole(staffRole, ["platform_owner", "platform_admin", "support"]);
        await sendControlCenterAccessEmail(
          admin,
          user,
          staffRole,
          body,
          origin
        );
        return NextResponse.json({ ok: true });
      case "upsert_platform_staff":
        requireStaffRole(staffRole, ["platform_owner"]);
        await upsertPlatformStaff(admin, user, staffRole, body);
        return NextResponse.json({ ok: true });
      case "remove_platform_staff":
        requireStaffRole(staffRole, ["platform_owner"]);
        await removePlatformStaff(admin, user, staffRole, body);
        return NextResponse.json({ ok: true });
      default:
        throw new ControlCenterHttpError(
          400,
          "unknown_action",
          "Unknown Control Center action."
        );
    }
  } catch (error) {
    return errorResponse(error);
  }
}
