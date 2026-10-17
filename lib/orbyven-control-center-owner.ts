import {
  authorizeControlCenter,
  ControlCenterHttpError,
  type ControlCenterAuthorization,
} from "@/lib/orbyven-control-center-server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function configuredOwnerId() {
  const ownerId =
    process.env.ORBYVEN_CONTROL_CENTER_OWNER_ID?.trim() ||
    process.env.ORBYVEN_INTEGRITY_OWNER_ID?.trim() ||
    "";

  if (!UUID_PATTERN.test(ownerId)) {
    throw new ControlCenterHttpError(
      503,
      "control_center_owner_not_configured",
      "Control Center requires one exact owner UUID on the server."
    );
  }

  return ownerId;
}

export function requireControlCenterOwner(userId: string) {
  if (userId !== configuredOwnerId()) {
    throw new ControlCenterHttpError(
      403,
      "control_center_owner_required",
      "Control Center is restricted to its configured owner."
    );
  }
}

export async function authorizeOwnerControlCenter(
  request: Request
): Promise<ControlCenterAuthorization> {
  const authorization = await authorizeControlCenter(request);
  requireControlCenterOwner(authorization.user.id);

  // The exact owner is the only human principal allowed into Control Center.
  // Existing staff records remain operational metadata, not an alternate login path.
  return {
    ...authorization,
    staffRole: "platform_owner",
  };
}
