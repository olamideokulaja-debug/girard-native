// My listings (landlord) + verify queue (admin). Landlords see their own
// properties and statuses; admins additionally see Pending listings and can
// approve them to go live.
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

const money = (n) => "\u20a6" + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const ADMIN_DOMAIN = "girardpropertylimited.com";
function rowToProp(r) { return { ...(r.data || {}), id: r.id, status: r.status, owner_email: r.owner_email }; }

export default function MyListingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mine, setMine] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const em = ((u && u.user && u.user.email) || "").toLowerCase();
    const admin = em.endsWith("@" + ADMIN_DOMAIN);
    setIsAdmin(admin);
    const { data } = await supabase.from("properties").select("*").order("updated_at", { ascending: false });
    const all = (data || []).map(rowToProp);
    setMine(all.filter(p => (p.owner_email || "").toLowerCase() === em));
    setPending(admin ? all.filter(p => p.status === "Pending Verification") : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const un = navigation.addListener("focus", load); return un; }, [navigation, load]);

  const approve = (id) => {
    Alert.alert("Verify & publish", "Approve this listing so tenants can see it?", [
      { text: "Cancel", style: "cancel" },
      { text: "Approve", onPress: async () => {
        try { await supabase.from("properties").update({ status: "Available", verified: true }).eq("id", id); load(); }
        catch (e) { Alert.alert("Error", "Couldn't update. Please try again."); }
      } },
    ]);
  };

  const Card = ({ p, showApprove }) => (
    <View style={styles.card}>
      <View style={{ flex: 1, marginRight: 10 }}>
        <Text style={styles.title} numberOfLines={1}>{p.title || "Untitled property"}</Text>
        <Text style={styles.meta} numberOfLines={1}>{[p.area, p.type, p.beds ? p.beds + " bed" : null].filter(Boolean).join("  \u00b7  ")}</Text>
        <Text style={styles.rent}>{p.rent ? money(p.rent) + " / yr" : "\u2014"}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={[styles.badge,
          p.status === "Available" && styles.bAvail,
          p.status === "Leased" && styles.bLeased,
          p.status === "Pending Verification" && styles.bPend]}>{p.status}</Text>
        {showApprove ? (
          <TouchableOpacity style={styles.approve} onPress={() => approve(p.id)}>
            <Text style={styles.approveText}>Approve</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.wrap}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>{"\u2039  Back"}</Text></TouchableOpacity>
        <Text style={styles.hTitle}>{isAdmin ? "Listings" : "My listings"}</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.gold} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30 }}>
          {isAdmin && pending.length > 0 ? (
            <View>
              <Text style={styles.section}>{"PENDING VERIFICATION (" + pending.length + ")"}</Text>
              {pending.map(p => <Card key={p.id} p={p} showApprove />)}
            </View>
          ) : null}

          <Text style={styles.section}>{isAdmin ? "MY OWN LISTINGS" : "YOUR LISTINGS"}</Text>
          {mine.length === 0 ? (
            <Text style={styles.empty}>You haven't listed any properties yet. Add one on girardpropertylimited.com and it will appear here.</Text>
          ) : mine.map(p => <Card key={p.id} p={p} />)}
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
  section: { color: colors.slate, fontSize: 12, fontWeight: "700", letterSpacing: 1, marginTop: 8, marginBottom: 10, marginLeft: 4 },
  card: { flexDirection: "row", backgroundColor: colors.ink, borderRadius: 12, borderWidth: 1, borderColor: "#22405E", padding: 14, marginBottom: 12 },
  title: { color: "#fff", fontSize: 15.5, fontWeight: "700" },
  meta: { color: colors.slate, fontSize: 12.5, marginTop: 4 },
  rent: { color: colors.teal, fontSize: 14, fontWeight: "800", marginTop: 8 },
  badge: { fontSize: 11, fontWeight: "800", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, overflow: "hidden", color: "#fff", backgroundColor: "#3A5470" },
  bAvail: { backgroundColor: colors.gold, color: colors.deep },
  bLeased: { backgroundColor: "#3A5470", color: "#fff" },
  bPend: { backgroundColor: "#7A5C00", color: "#fff" },
  approve: { marginTop: 10, backgroundColor: colors.teal, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  approveText: { color: "#fff", fontWeight: "800", fontSize: 12.5 },
  empty: { color: colors.slate, fontSize: 13.5, lineHeight: 20, padding: 4 },
});
