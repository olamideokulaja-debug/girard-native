import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
const KEY = "girard_biometric_v1";
export async function isBioEnabled() { try { return (await AsyncStorage.getItem(KEY)) === "1"; } catch (e) { return false; } }
export async function setBioEnabled(on) { try { await AsyncStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {} }
export async function bioAvailable() {
  try { return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync()); }
  catch (e) { return false; }
}
export async function authenticate() {
  try { const r = await LocalAuthentication.authenticateAsync({ promptMessage: "Unlock Girard", fallbackLabel: "Use passcode" }); return !!(r && r.success); }
  catch (e) { return false; }
}
