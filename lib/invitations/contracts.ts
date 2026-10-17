export const INVITATION_PROJECT_TYPES = ["wedding", "baptism", "event"] as const;

export type InvitationProjectType = (typeof INVITATION_PROJECT_TYPES)[number];

export type InvitationRsvpInput = {
  slug: string;
  guestName: string;
  attending: boolean;
  guestCount: number;
  message?: string;
  website?: string;
  startedAt?: number;
};

export function isInvitationProjectType(value: unknown): value is InvitationProjectType {
  return typeof value === "string" && INVITATION_PROJECT_TYPES.includes(value as InvitationProjectType);
}

export function isInvitationSlug(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]{5,79}$/.test(value);
}

export function invitationSourceKey(type: InvitationProjectType) {
  return `ai-web-design-${type}`;
}
