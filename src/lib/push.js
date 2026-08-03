import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

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
