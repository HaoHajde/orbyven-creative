import { ControlCenterHttpError } from "@/lib/orbyven-control-center-server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireIntegrityOwner(userId: string) {
  const configuredOwnerId = process.env.ORBYVEN_INTEGRITY_OWNER_ID?.trim() ?? "";

  if (!UUID_PATTERN.test(configuredOwnerId)) {
    throw new ControlCenterHttpError(
      503,
      "integrity_owner_not_configured",
      "Integrity owner identity is not configured."
    );
  }

  if (userId !== configuredOwnerId) {
    throw new ControlCenterHttpError(
      403,
      "integrity_owner_required",
      "Only the configured ORBYVEN Integrity owner may access this resource."
    );
  }
}
