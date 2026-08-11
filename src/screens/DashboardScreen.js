// Home / Dashboard — landing screen with a workspace switcher. The chosen
// workspace (Tenant / Landlord / Investor / Admin) reshapes the actions shown.
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Modal, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { loadFavs } from "../lib/favourites";
import { BarChart, SegmentBar, CountUp, FadeInUp, ProgressBar } from "../components/Charts";
import { DonutChart, LineChart } from "../components/SvgCharts";
import { colors } from "../theme";

const ADMIN_DOMAIN = "girardpropertylimited.com";
const WS_KEY = "girard_workspace";

const ACTIONS = {
  Tenant: [
    { key: "Browse", label: "Browse property", sub: "Find your next home", icon: "search", go: (n) => n.navigate("Browse") },
    { key: "Saved", label: "Saved listings", sub: "Your shortlist", icon: "heart", go: (n) => n.navigate("Browse", { showSaved: true }) },
    { key: "Msg", label: "Message Girard", sub: "Talk to our team", icon: "chatbubble-ellipses", go: (n) => n.navigate("Messages") },
    { key: "Book", label: "My bookings & payments", sub: "Receipts and history", icon: "receipt", go: (n) => n.navigate("Account") },
  ],
  Landlord: [
    { key: "Mine", label: "My listings", sub: "Manage your properties", icon: "business", go: (n) => n.navigate("MyListings") },
    { key: "Add", label: "Add a property", sub: "List a new property", icon: "add-circle", go: (n) => n.navigate("AddProperty") },
    { key: "Enq", label: "Enquiries", sub: "Leads on your listings", icon: "mail", go: (n) => n.navigate("Enquiries") },
    { key: "Earn", label: "Earnings", sub: "Received + payout account", icon: "cash", go: (n) => n.navigate("Earnings") },
  ],
  Investor: [
    { key: "Deals", label: "Investor deals", sub: "For-sale opportunities", icon: "trending-up", go: (n) => n.navigate("Browse", { initialIntent: "For sale" }) },
    { key: "Swap", label: "Property swap", sub: "Swap across cities & countries", icon: "swap-horizontal", go: (n) => n.navigate("Swap") },
    { key: "Saved", label: "Saved", sub: "Your shortlist", icon: "heart", go: (n) => n.navigate("Browse", { showSaved: true }) },
  ],
  Admin: [
    { key: "Verify", label: "Verify listings", sub: "Approve pending", icon: "shield-checkmark", go: (n) => n.navigate("MyListings") },
    { key: "Enq", label: "Enquiries", sub: "All leads", icon: "mail", go: (n) => n.navigate("Enquiries") },
    { key: "Add", label: "Add a property", sub: "List a new property", icon: "add-circle", go: (n) => n.navigate("AddProperty") },
    { key: "Earn", label: "Earnings", sub: "Payments overview", icon: "cash", go: (n) => n.navigate("Earnings") },
  ],
};

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [ownsListings, setOwnsListings] = useState(false);
  const [workspace, setWorkspace] = useState("Tenant");
  const [stats, setStats] = useState({ saved: 0, payments: 0, mine: 0, pending: 0 });
  const [chart, setChart] = useState({ avail: 0, pend: 0, leased: 0, areas: [], toLet: 0, forSale: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [wsOpen, setWsOpen] = useState(false);

  const load = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    const user = u && u.user;
    const email = (user && user.email) || "";
    const meta = (user && user.user_metadata) || {};
    setName(meta.full_name || meta.name || (email ? email.split("@")[0] : "there"));
    const admin = email.toLowerCase().endsWith("@" + ADMIN_DOMAIN);
    setIsAdmin(admin);

    let mine = 0, pending = 0, payments = 0, saved = 0;
    let avail = 0, pend = 0, leased = 0, toLet = 0, forSale = 0; const areaMap = {};
    try {
      const { data: props } = await supabase.from("properties").select("owner_email,status,data");
      (props || []).forEach(p => {
        if ((p.owner_email || "").toLowerCase() === email.toLowerCase()) mine++;
        if (admin && p.status === "Pending Verification") pending++;
        const d = p.data || {};
        if (p.status === "Available") {
          avail++;
          if (d.area) areaMap[d.area] = (areaMap[d.area] || 0) + 1;
          if (d.intent === "For sale") forSale++; else toLet++;
        } else if (p.status === "Pending Verification") pend++;
        // A lease has been issued but not yet signed by both parties. Counted
        // with leased so the chart still totals, but it is not income yet.
        else if (p.status === "Leased" || p.status === "Awaiting signatures") leased++;
      });
    } catch (e) {}
    const areas = Object.keys(areaMap).map(k => ({ label: k, value: areaMap[k] })).sort((a, b) => b.value - a.value).slice(0, 5);
    setChart({ avail, pend, leased, areas, toLet, forSale });
    try { const { data: pays } = await supabase.from("payments").select("id"); payments = (pays || []).length; } catch (e) {}
    try { saved = (await loadFavs()).length; } catch (e) {}
    setOwnsListings(mine > 0);
    setStats({ saved, payments, mine, pending });

    const savedWs = await AsyncStorage.getItem(WS_KEY);
    setWorkspace(savedWs || (admin ? "Admin" : mine > 0 ? "Landlord" : "Tenant"));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const un = navigation.addListener("focus", load); return un; }, [navigation, load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const chooseWs = async (w) => { setWorkspace(w); setWsOpen(false); try { await AsyncStorage.setItem(WS_KEY, w); } catch (e) {} };
  const available = ["Tenant", "Landlord", "Investor"].concat(isAdmin ? ["Admin"] : []);
  const actions = ACTIONS[workspace] || ACTIONS.Tenant;
  const statList = workspace === "Admin"
    ? [["To verify", stats.pending], ["Payments", stats.payments], ["Listings", stats.mine]]
    : workspace === "Landlord"
      ? [["Listings", stats.mine], ["Payments", stats.payments], ["Saved", stats.saved]]
      : [["Saved", stats.saved], ["Payments", stats.payments], ["Listings", stats.mine]];

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Hello, {name}</Text>
            <Text style={styles.sub}>Welcome back to Girard</Text>
          </View>
          <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        </View>

        <TouchableOpacity style={styles.wsPill} onPress={() => setWsOpen(true)}>
          <Ionicons name="grid-outline" size={15} color={colors.gold} />
          <Text style={styles.wsText}>Workspace: <Text style={{ color: "#fff" }}>{workspace}</Text></Text>
          <Ionicons name="chevron-down" size={16} color={colors.slate} />
        </TouchableOpacity>

        <View style={styles.statsRow}>
          {statList.map(([label, value]) => (
            <View key={label} style={styles.stat}>
              <CountUp value={value} style={styles.statValue} />
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>MARKET INSIGHTS</Text>
        <View style={{ paddingHorizontal: 16 }}>
          {chart.areas.length > 0 ? (
            <FadeInUp style={styles.chartCard}>
              <Text style={styles.chartTitle}>Available by area</Text>
              <BarChart data={chart.areas} height={150} />
            </FadeInUp>
          ) : null}
          <FadeInUp delay={80} style={styles.chartCard}>
            <Text style={styles.chartTitle}>Listings by status</Text>
            <DonutChart centerLabel="listings" segments={[
              { label: "Available", value: chart.avail, color: colors.gold },
              { label: "Pending", value: chart.pend, color: "#E9A23B" },
              { label: "Leased", value: chart.leased, color: colors.teal },
            ]} />
          </FadeInUp>
          {(chart.toLet + chart.forSale) > 0 ? (
            <FadeInUp delay={140} style={styles.chartCard}>
              <Text style={styles.chartTitle}>Available: to let vs for sale</Text>
              <SegmentBar segments={[
                { label: "To let", value: chart.toLet, color: colors.teal },
                { label: "For sale", value: chart.forSale, color: "#6E59C7" },
              ]} />
            </FadeInUp>
          ) : null}
        </View>

        <Text style={styles.section}>{workspace.toUpperCase()} TOOLS</Text>
        <View style={{ paddingHorizontal: 16 }}>
          {actions.map(a => (
            <TouchableOpacity key={a.key} style={styles.action} onPress={() => a.go(navigation)}>
              <View style={styles.actionIcon}><Ionicons name={a.icon} size={20} color={colors.gold} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionLabel}>{a.label}</Text>
                <Text style={styles.actionSub}>{a.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.slate} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal visible={wsOpen} transparent animationType="slide" onRequestClose={() => setWsOpen(false)}>
        <TouchableOpacity style={styles.mOverlay} activeOpacity={1} onPress={() => setWsOpen(false)}>
          <View style={[styles.mSheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.mTitle}>Switch workspace</Text>
            {available.map(w => (
              <TouchableOpacity key={w} style={styles.wsRow} onPress={() => chooseWs(w)}>
                <Text style={[styles.wsRowText, workspace === w && { color: colors.gold, fontWeight: "800" }]}>{w}</Text>
                {workspace === w ? <Ionicons name="checkmark" size={20} color={colors.gold} /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.deep },
  headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, marginBottom: 14 },
  hello: { color: "#fff", fontSize: 25, fontWeight: "800" },
  sub: { color: colors.slate, fontSize: 14, marginTop: 3 },
  logo: { width: 46, height: 46 },
  wsPill: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", marginHorizontal: 18, backgroundColor: colors.ink, borderWidth: 1, borderColor: "#22405E", borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9, marginBottom: 18 },
  wsText: { color: colors.slate, fontSize: 13.5, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  stat: { flex: 1, backgroundColor: colors.ink, borderRadius: 14, borderWidth: 1, borderColor: "#22405E", paddingVertical: 16, alignItems: "center" },
  statValue: { color: colors.gold, fontSize: 24, fontWeight: "800" },
  statLabel: { color: colors.slate, fontSize: 12, marginTop: 4 },
  section: { color: colors.slate, fontSize: 12, fontWeight: "700", letterSpacing: 1, marginTop: 22, marginBottom: 12, marginLeft: 18 },
  chartCard: { backgroundColor: colors.ink, borderRadius: 14, borderWidth: 1, borderColor: "#22405E", padding: 16, marginBottom: 12 },
  chartTitle: { color: "#fff", fontSize: 14.5, fontWeight: "700", marginBottom: 16 },
  action: { flexDirection: "row", alignItems: "center", backgroundColor: colors.ink, borderRadius: 14, borderWidth: 1, borderColor: "#22405E", padding: 14, marginBottom: 11 },
  actionIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(201,162,75,0.12)", alignItems: "center", justifyContent: "center", marginRight: 14 },
  actionLabel: { color: "#fff", fontSize: 15.5, fontWeight: "700" },
  actionSub: { color: colors.slate, fontSize: 13, marginTop: 3 },
  mOverlay: { flex: 1, backgroundColor: "rgba(6,14,24,0.6)", justifyContent: "flex-end" },
  mSheet: { backgroundColor: colors.deep, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, borderTopWidth: 1, borderColor: "#22405E" },
  mTitle: { color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 10 },
  wsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#1B3550" },
  wsRowText: { color: "#E7EEF5", fontSize: 16 },
});
