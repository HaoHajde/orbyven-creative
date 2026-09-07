import { NextResponse } from "next/server";
import { loadControlCenterBillingSnapshots } from "@/lib/billing/control-center";
import {
  assignControlCenterMember,
  authorizeControlCenter,
  ControlCenterHttpError,
  createControlCenterOrganization,
  loadControlCenterPayload,
  removeControlCenterMember,
  setControlCenterModules,
  updateControlCenterOrganization,
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
    const { admin } = await authorizeControlCenter(request);
    const payload = await loadControlCenterPayload(admin);
    const billingState = await loadControlCenterBillingSnapshots(
      admin,
      payload.organizations.map((organization) => organization.id)
    );

    const organizations = payload.organizations.map((organization) => ({
      ...organization,
      subscription:
        billingState.snapshots.get(organization.id) ?? organization.subscription,
    }));

    // Until the client workspace has an explicit organization switcher,
    // a client account is assignable to one organization only.
    const assignedUserIds = new Set(
      organizations.flatMap((organization) =>
        organization.members.map((member) => member.user_id)
      )
    );

    return NextResponse.json(
      {
        ...payload,
        organizations,
        entitlement_source: billingState.source,
        auth_users: payload.auth_users.filter(
          (user) => !assignedUserIds.has(user.id)
        ),
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { admin, user } = await authorizeControlCenter(request);
    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";

    switch (action) {
      case "create_organization": {
        const organizationId = await createControlCenterOrganization(admin, user, body);
        return NextResponse.json({ ok: true, organization_id: organizationId });
      }
      case "update_organization":
        await updateControlCenterOrganization(admin, body);
        return NextResponse.json({ ok: true });
      case "assign_member": {
        const organizationId =
          typeof body.organization_id === "string" ? body.organization_id : "";
        const userId = typeof body.user_id === "string" ? body.user_id : "";

        if (!organizationId || !userId) {
          throw new ControlCenterHttpError(
            400,
            "invalid_assignment",
            "organization_id și user_id sunt obligatorii."
          );
        }

        const { data: existingMemberships, error: membershipError } = await admin
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", userId)
          .neq("organization_id", organizationId)
          .limit(1);

        if (membershipError) throw membershipError;

        if (existingMemberships?.length) {
          throw new ControlCenterHttpError(
            409,
            "user_already_assigned",
            "Utilizatorul este deja atribuit altei organizații. Conturile client rămân single-organization până există un switcher explicit în workspace."
          );
        }

        await assignControlCenterMember(admin, body);
        return NextResponse.json({ ok: true });
      }
      case "update_member_role": {
        const organizationId =
          typeof body.organization_id === "string" ? body.organization_id : "";
        const userId = typeof body.user_id === "string" ? body.user_id : "";

        if (!organizationId || !userId) {
          throw new ControlCenterHttpError(
            400,
            "invalid_assignment",
            "organization_id și user_id sunt obligatorii."
          );
        }

        const { data: membership, error: membershipError } = await admin
          .from("organization_members")
          .select("organization_id")
          .eq("organization_id", organizationId)
          .eq("user_id", userId)
          .maybeSingle();

        if (membershipError) throw membershipError;
        if (!membership) {
          throw new ControlCenterHttpError(
            404,
            "membership_not_found",
            "Membership-ul nu există în organizația selectată."
          );
        }

        await assignControlCenterMember(admin, body);
        return NextResponse.json({ ok: true });
      }
      case "remove_member":
        await removeControlCenterMember(admin, body);
        return NextResponse.json({ ok: true });
      case "set_modules":
        await setControlCenterModules(admin, body);
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
