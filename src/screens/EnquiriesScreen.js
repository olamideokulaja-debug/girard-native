// Enquiries inbox (landlord/admin). Reads the same "enquiries" table the website
// writes to. Landlords see enquiries for their own listings; admins see all.
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Linking, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

const ADMIN_DOMAIN = "girardpropertylimited.com";

export default function EnquiriesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const email = ((u && u.user && u.user.email) || "").toLowerCase();
    const admin = email.endsWith("@" + ADMIN_DOMAIN);
    let myIds = [];
    if (!admin) {
      try {
        const { data: props } = await supabase.from("properties").select("id,owner_email");
        myIds = (props || []).filter(p => (p.owner_email || "").toLowerCase() === email).map(p => p.id);
      } catch (e) {}
    }
    try {
      const { data } = await supabase.from("enquiries").select("*").order("created_at", { ascending: false });
      let list = data || [];
      if (!admin) list = list.filter(e => myIds.includes(e.prop_id));
      setRows(list);
    } catch (e) { setRows([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const un = navigation.addListener("focus", load); return un; }, [navigation, load]);

  const markHandled = async (id) => {
    try { await supabase.from("enquiries").update({ status: "Handled" }).eq("id", id); load(); }
    catch (e) { Alert.alert("Error", "Couldn't update."); }
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>{"\u2039  Back"}</Text></TouchableOpacity>
        <Text style={styles.hTitle}>Enquiries</Text>
        <View style={{ width: 60 }} />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.gold} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30 }}>
          {rows.length === 0 ? (
            <Text style={styles.empty}>No enquiries yet. When someone enquires about a listing, it will appear here.</Text>
          ) : rows.map(e => (
            <View key={e.id} style={styles.card}>
              <View style={styles.rowTop}>
                <Text style={styles.prop} numberOfLines={1}>{e.prop_title || e.area || "Enquiry"}</Text>
                <Text style={[styles.badge, e.status === "Handled" && styles.badgeDone]}>{e.status || "New"}</Text>
              </View>
              <Text style={styles.who}>{e.name || "Someone"}{e.type ? "  \u00b7  " + e.type : ""}</Text>
              {e.message ? <Text style={styles.msg}>{e.message}</Text> : null}
              <View style={styles.actions}>
                {e.phone ? <TouchableOpacity onPress={() => Linking.openURL("tel:" + e.phone)}><Text style={styles.link}>Call</Text></TouchableOpacity> : null}
                {e.email ? <TouchableOpacity onPress={() => Linking.openURL("mailto:" + e.email)}><Text style={styles.link}>Email</Text></TouchableOpacity> : null}
                {e.status !== "Handled" ? <TouchableOpacity onPress={() => markHandled(e.id)}><Text style={[styles.link, { color: colors.teal }]}>Mark handled</Text></TouchableOpacity> : null}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.deep },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingBottom: 14, backgroundColor: colors.ink },
  back: { color: "#C7D3E0", fontSize: 14, fontWeight: "600", width: 60 },
  hTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { color: colors.slate, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 50, paddingHorizontal: 20 },
  card: { backgroundColor: colors.ink, borderRadius: 12, borderWidth: 1, borderColor: "#22405E", padding: 14, marginBottom: 12 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  prop: { color: "#fff", fontSize: 15, fontWeight: "700", flex: 1, marginRight: 8 },
  badge: { fontSize: 11, fontWeight: "800", color: colors.deep, backgroundColor: colors.gold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, overflow: "hidden" },
  badgeDone: { backgroundColor: "#3A5470", color: "#fff" },
  who: { color: colors.slate, fontSize: 13, marginTop: 6 },
  msg: { color: "#E7EEF5", fontSize: 14, lineHeight: 20, marginTop: 8 },
  actions: { flexDirection: "row", gap: 20, marginTop: 12 },
  link: { color: colors.gold, fontSize: 13.5, fontWeight: "700" },
});
