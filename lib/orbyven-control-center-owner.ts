import { ControlCenterHttpError } from "@/lib/orbyven-control-center-server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireControlCenterOwner(userId: string) {
  const configuredOwnerId = process.env.ORBYVEN_CONTROL_CENTER_OWNER_ID?.trim() ?? "";

  if (!UUID_PATTERN.test(configuredOwnerId)) {
    throw new ControlCenterHttpError(
      503,
      "control_center_owner_not_configured",
      "Control Center owner boundary is not configured."
    );
  }

  if (userId !== configuredOwnerId) {
    throw new ControlCenterHttpError(
      403,
      "control_center_owner_required",
      "Control Center access is restricted to the configured owner."
    );
  }
}
