import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { colors } from "../theme";
import { authenticate } from "../lib/lock";

export default function LockScreen({ onUnlock }) {
  const tryAuth = async () => { if (await authenticate()) onUnlock(); };
  useEffect(() => { tryAuth(); }, []);
  return (
    <View style={styles.wrap}>
      <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Girard is locked</Text>
      <Text style={styles.sub}>Unlock with Face ID or fingerprint to continue.</Text>
      <TouchableOpacity style={styles.btn} onPress={tryAuth}><Text style={styles.btnText}>Unlock</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.deep, alignItems: "center", justifyContent: "center", padding: 34 },
  logo: { width: 96, height: 96, marginBottom: 22 },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  sub: { color: colors.slate, fontSize: 14.5, textAlign: "center", marginTop: 10, lineHeight: 21 },
  btn: { backgroundColor: colors.teal, borderRadius: 12, paddingVertical: 15, paddingHorizontal: 40, marginTop: 28 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
