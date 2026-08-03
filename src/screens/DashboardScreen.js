// Home / Dashboard — the landing screen. Role-aware: everyone gets quick actions;
// landlords/admins get listing + verification widgets; investor/swap link out to
// the website until those are built natively.
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { loadFavs } from "../lib/favourites";
import { colors } from "../theme";

const ADMIN_DOMAIN = "girardpropertylimited.com";

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [role, setRole] = useState("Tenant");
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({ mine: 0, pending: 0, payments: 0, saved: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    const user = u && u.user;
    const email = (user && user.email) || "";
    const meta = (user && user.user_metadata) || {};
    setName(meta.full_name || meta.name || (email ? email.split("@")[0] : "there"));
    setRole(meta.role || "Tenant");
    const admin = email.toLowerCase().endsWith("@" + ADMIN_DOMAIN);
    setIsAdmin(admin);

    let mine = 0, pending = 0, payments = 0, saved = 0;
    try {
      const { data: props } = await supabase.from("properties").select("owner_email,status");
      (props || []).forEach(p => {
        if ((p.owner_email || "").toLowerCase() === email.toLowerCase()) mine++;
        if (admin && p.status === "Pending Verification") pending++;
      });
    } catch (e) {}
    try { const { data: pays } = await supabase.from("payments").select("id"); payments = (pays || []).length; } catch (e) {}
    try { saved = (await loadFavs()).length; } catch (e) {}
    setStats({ mine, pending, payments, saved });
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const un = navigation.addListener("focus", load); return un; }, [navigation, load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const isLandlord = stats.mine > 0 || /land|owner|agent/i.test(role);
  const isInvestor = /investor/i.test(role);

  const Stat = ({ label, value, onPress }) => (
    <TouchableOpacity style={styles.stat} onPress={onPress} disabled={!onPress}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
  const Action = ({ label, sub, onPress }) => (
    <TouchableOpacity style={styles.action} onPress={onPress}>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionSub}>{sub}</Text>
      <Text style={styles.actionChev}>{"\u203A"}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: insets.top + 18, paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}>
        <Text style={styles.hello}>Hello, {name}</Text>
        <Text style={styles.sub}>Welcome back to Girard{isAdmin ? "  \u00b7  Admin" : ""}</Text>

        <View style={styles.statsRow}>
          <Stat label="Saved" value={stats.saved} onPress={() => navigation.navigate("Browse")} />
          <Stat label="Payments" value={stats.payments} onPress={() => navigation.navigate("Account")} />
          {isLandlord || isAdmin ? <Stat label={isAdmin ? "To verify" : "My listings"} value={isAdmin ? stats.pending : stats.mine} onPress={() => navigation.navigate("MyListings")} /> : <Stat label="Messages" value={"\u2022"} onPress={() => navigation.navigate("Messages")} />}
        </View>

        <Text style={styles.section}>QUICK ACTIONS</Text>
        <Action label="Browse property" sub="Find your next home or investment" onPress={() => navigation.navigate("Browse")} />
        <Action label="Saved listings" sub="Your shortlist" onPress={() => navigation.navigate("Browse")} />
        <Action label="Message Girard" sub="Talk to our team" onPress={() => navigation.navigate("Messages")} />

        {(isLandlord || isAdmin) ? (
          <View>
            <Text style={styles.section}>{isAdmin ? "ADMIN" : "LANDLORD"}</Text>
            <Action label={isAdmin ? "Verify listings" : "My listings"} sub={isAdmin ? (stats.pending + " pending verification") : (stats.mine + " listed")} onPress={() => navigation.navigate("MyListings")} />
            <Action label="Add a property" sub="List a new property" onPress={() => navigation.navigate("AddProperty")} />
          </View>
        ) : null}

        <Text style={styles.section}>MORE ON GIRARD</Text>
        <Action label="Investor deals" sub={isInvestor ? "Your opportunities" : "Available on the website"} onPress={() => Linking.openURL("https://girardpropertylimited.com")} />
        <Action label="Property swap" sub="Available on the website" onPress={() => Linking.openURL("https://girardpropertylimited.com")} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.deep },
  hello: { color: "#fff", fontSize: 26, fontWeight: "800" },
  sub: { color: colors.slate, fontSize: 14, marginTop: 4, marginBottom: 18 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
  stat: { flex: 1, backgroundColor: colors.ink, borderRadius: 14, borderWidth: 1, borderColor: "#22405E", paddingVertical: 16, alignItems: "center" },
  statValue: { color: colors.gold, fontSize: 24, fontWeight: "800" },
  statLabel: { color: colors.slate, fontSize: 12, marginTop: 4 },
  section: { color: colors.slate, fontSize: 12, fontWeight: "700", letterSpacing: 1, marginTop: 24, marginBottom: 10, marginLeft: 2 },
  action: { backgroundColor: colors.ink, borderRadius: 14, borderWidth: 1, borderColor: "#22405E", padding: 16, marginBottom: 10 },
  actionLabel: { color: "#fff", fontSize: 15.5, fontWeight: "700" },
  actionSub: { color: colors.slate, fontSize: 13, marginTop: 3 },
  actionChev: { position: "absolute", right: 16, top: 18, color: colors.slate, fontSize: 22 },
});
