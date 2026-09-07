import { NextResponse } from "next/server";
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
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
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
      case "assign_member":
      case "update_member_role":
        await assignControlCenterMember(admin, body);
        return NextResponse.json({ ok: true });
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
