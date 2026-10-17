import { orbyvenSupabase } from "@/lib/orbyven-supabase";
import { setNotificationPreference } from "@/lib/modules/notification-preferences";

export type PushDeviceRegistrationInput = {
  expoPushToken: string;
  platform: "ios" | "android";
  appVersion?: string | null;
};

export async function registerPushDevice(
  organizationId: string,
  input: PushDeviceRegistrationInput
) {
  const token = input.expoPushToken.trim();
  if (!organizationId.trim()) throw new Error("organization_id is required.");
  if (token.length < 16 || token.length > 512) throw new Error("Push token invalid.");

  const { data: authData, error: authError } = await orbyvenSupabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("User not authenticated.");

  const { data, error } = await orbyvenSupabase
    .from("user_push_devices")
    .upsert(
      {
        organization_id: organizationId,
        user_id: authData.user.id,
        expo_push_token: token,
        platform: input.platform,
        app_version: input.appVersion?.trim() || null,
        enabled: true,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,user_id,expo_push_token" }
    )
    .select("id")
    .single();

  if (error) throw error;

  // Device registration and delivery consent are separate concerns. A registered
  // token is not delivery permission until the per-user/per-organization preference
  // has been persisted. If this write fails, the preference remains fail-closed.
  await setNotificationPreference(organizationId, "push", true);
  return data;
}
