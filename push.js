import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { supabase } from "./supabase";

// This used to run bare at module scope. App.js imports this file, so if the
// call threw, the whole bundle failed to evaluate BEFORE React rendered and
// iOS showed a plain white root view with no error anywhere. It is now
// guarded, and uses the SDK 54 keys (shouldShowAlert was deprecated).
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {}

export async function registerForPush() {
  try {
    if (!Device.isDevice) return;
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") { const r = await Notifications.requestPermissionsAsync(); status = r.status; }
    if (status !== "granted") return;
    const projectId = Constants.expoConfig && Constants.expoConfig.extra && Constants.expoConfig.extra.eas && Constants.expoConfig.extra.eas.projectId;
    const tok = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const token = tok && tok.data;
    const { data: u } = await supabase.auth.getUser();
    const email = (u && u.user && u.user.email) || null;
    if (token && email) { try { await supabase.from("push_tokens").upsert({ email, token }, { onConflict: "token" }); } catch (e) {} }
  } catch (e) {}
}
