import { orbyvenSupabase } from "@/lib/orbyven-supabase";

export const NOTIFICATION_CHANNELS = ["push"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export type NotificationPreference = {
  channel: NotificationChannel;
  enabled: boolean;
  updatedAt: string | null;
};

const isNotificationChannel = (channel: string): channel is NotificationChannel =>
  NOTIFICATION_CHANNELS.includes(channel as NotificationChannel);

function assertNotificationChannel(channel: string): asserts channel is NotificationChannel {
  if (!isNotificationChannel(channel)) {
    throw new Error("Unsupported notification channel.");
  }
}

function emitPreferenceChanged(preference: NotificationPreference) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("orbyven:notification-preference-changed", {
      detail: {
        channel: preference.channel,
        enabled: preference.enabled,
      },
    })
  );
}

async function currentUserId() {
  const { data, error } = await orbyvenSupabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("User not authenticated.");
  return data.user.id;
}

export async function loadNotificationPreference(
  organizationId: string,
  channelInput: string
): Promise<NotificationPreference> {
  const organization = organizationId.trim();
  if (!organization) throw new Error("organization_id is required.");
  assertNotificationChannel(channelInput);

  const userId = await currentUserId();
  const { data, error } = await orbyvenSupabase
    .from("user_notification_preferences")
    .select("channel,enabled,updated_at")
    .eq("organization_id", organization)
    .eq("user_id", userId)
    .eq("channel", channelInput)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    return { channel: channelInput, enabled: false, updatedAt: null };
  }

  return {
    channel: channelInput,
    enabled: data.enabled === true,
    updatedAt: typeof data.updated_at === "string" ? data.updated_at : null,
  };
}

export async function setNotificationPreference(
  organizationId: string,
  channelInput: string,
  enabled: boolean
): Promise<NotificationPreference> {
  const organization = organizationId.trim();
  if (!organization) throw new Error("organization_id is required.");
  assertNotificationChannel(channelInput);

  const userId = await currentUserId();
  const { data, error } = await orbyvenSupabase
    .from("user_notification_preferences")
    .upsert(
      {
        organization_id: organization,
        user_id: userId,
        channel: channelInput,
        enabled: enabled === true,
      },
      { onConflict: "organization_id,user_id,channel" }
    )
    .select("channel,enabled,updated_at")
    .single();

  if (error) throw error;

  const preference: NotificationPreference = {
    channel: channelInput,
    enabled: data.enabled === true,
    updatedAt: typeof data.updated_at === "string" ? data.updated_at : null,
  };
  emitPreferenceChanged(preference);
  return preference;
}
