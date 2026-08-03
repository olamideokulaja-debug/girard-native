import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { colors } from "../theme";
import { authenticate } from "../lib/lock";
import { supabase } from "../lib/supabase";

export default function LockScreen({ onUnlock }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const tryAuth = async () => {
    if (busy) return;
    setBusy(true); setMsg("");
    const r = await authenticate();
    setBusy(false);
    if (r && r.success) onUnlock();
    else setMsg(r && r.error ? r.error : "Couldn't verify. Tap Unlock to try again.");
  };
  useEffect(() => { tryAuth(); }, []);

  return (
    <View style={styles.wrap}>
      <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Girard is locked</Text>
      <Text style={styles.sub}>Unlock with Face ID or fingerprint to continue.</Text>
      {msg ? <Text style={styles.err}>{msg}</Text> : null}
      <TouchableOpacity style={styles.btn} onPress={tryAuth} disabled={busy}>
        <Text style={styles.btnText}>{busy ? "Verifying…" : "Unlock"}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ marginTop: 18 }} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.signout}>Sign out instead</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.deep, alignItems: "center", justifyContent: "center", padding: 34 },
  logo: { width: 96, height: 96, marginBottom: 22 },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  sub: { color: colors.slate, fontSize: 14.5, textAlign: "center", marginTop: 10, lineHeight: 21 },
  err: { color: "#E9A23B", fontSize: 13, textAlign: "center", marginTop: 14 },
  btn: { backgroundColor: colors.teal, borderRadius: 12, paddingVertical: 15, paddingHorizontal: 46, marginTop: 26 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  signout: { color: colors.slate, fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },
});
