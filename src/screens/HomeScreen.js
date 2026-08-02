// Placeholder home screen — proves native login works end to end.
// The real screens (browse listings, property detail, pay/book) replace this
// in the next sessions. Everything below is native, talking to your Supabase.
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email || ""));
  }, []);

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 40 }]}>
      <Text style={styles.brand}>GIRARD</Text>
      <Text style={styles.h1}>You're signed in</Text>
      <Text style={styles.sub}>{email}</Text>
      <Text style={styles.note}>
        This is the native Girard app foundation. Native listings, property
        details and payments come next.
      </Text>
      <TouchableOpacity style={styles.btn} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.btnText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.deep, paddingHorizontal: 26 },
  brand: { color: colors.gold, fontSize: 24, fontWeight: "800", letterSpacing: 2, marginBottom: 30 },
  h1: { color: "#fff", fontSize: 30, fontWeight: "800", marginBottom: 6 },
  sub: { color: colors.teal, fontSize: 15, marginBottom: 24 },
  note: { color: colors.slate, fontSize: 14, lineHeight: 21 },
  btn: { backgroundColor: "#16324F", borderRadius: 11, paddingVertical: 15, alignItems: "center", marginTop: 34, borderWidth: 1, borderColor: "#22405E" },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
