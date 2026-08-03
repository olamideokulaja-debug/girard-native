// Earnings (landlord) — what you've received across your listings, plus your
// payout account status. Reads a secure server endpoint (payments are settled
// to your Paystack subaccount automatically; this is the record of it).
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

const SITE = "https://girardpropertylimited.com";
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const money = (kobo) => "\u20a6" + String(Math.round(Number(kobo || 0) / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const dateStr = (iso) => { try { const x = new Date(iso); if (isNaN(x)) return ""; return x.getDate() + " " + MON[x.getMonth()] + " " + x.getFullYear(); } catch (e) { return ""; } };

export default function EarningsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: u } = await supabase.auth.getUser();
      const email = (u && u.user && u.user.email) || "";
      const r = await fetch(SITE + "/api/landlord-earnings?email=" + encodeURIComponent(email));
      setData(await r.json());
    } catch (e) { setData({ total: 0, net: 0, count: 0, listings: 0, recent: [], account: null }); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const acct = data && data.account;

  return (
    <View style={styles.wrap}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>{"\u2039  Back"}</Text></TouchableOpacity>
        <Text style={styles.hTitle}>Earnings</Text>
        <View style={{ width: 60 }} />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.gold} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}>
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>Your share received (after Girard 5%)</Text>
            <Text style={styles.heroValue}>{money(data.net)}</Text>
            <Text style={styles.heroSub}>{money(data.total)} gross  \u00b7  {data.count} payment{data.count === 1 ? "" : "s"}  \u00b7  {data.listings} listing{data.listings === 1 ? "" : "s"}</Text>
          </View>

          <Text style={styles.section}>PAYOUT ACCOUNT</Text>
          <View style={styles.card}>
            {acct && (acct.acct_no || acct.subaccount) ? (
              <View>
                <Text style={styles.acctName}>{acct.bank_name || "Bank"}  \u00b7  {acct.acct_no || ""}</Text>
                <Text style={styles.acctSub}>{acct.acct_name || ""}{acct.bvn_verified ? "  \u00b7  Verified" : "  \u00b7  Pending verification"}</Text>
                <Text style={styles.acctNote}>Your 95% is settled here automatically by Paystack after each payment.</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.acctSub}>No payout account set up yet.</Text>
                <TouchableOpacity onPress={() => Linking.openURL(SITE)}><Text style={styles.link}>Set up your payout account on the website \u203A</Text></TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={styles.section}>RECENT PAYMENTS</Text>
          <View style={styles.card}>
            {(!data.recent || data.recent.length === 0) ? (
              <Text style={styles.empty}>No payments yet. When a tenant pays on your listing, it appears here.</Text>
            ) : data.recent.map((p, i) => (
              <View key={i}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.payRow}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.payTitle} numberOfLines={1}>{p.title || "Payment"}</Text>
                    <Text style={styles.paySub}>{dateStr(p.paid_at)}</Text>
                  </View>
                  <Text style={styles.payAmount}>{money(p.amount)}</Text>
                </View>
              </View>
            ))}
          </View>
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
  hero: { backgroundColor: colors.ink, borderRadius: 16, borderWidth: 1, borderColor: "#22405E", padding: 20, marginBottom: 8 },
  heroLabel: { color: colors.slate, fontSize: 12.5, fontWeight: "600" },
  heroValue: { color: colors.gold, fontSize: 34, fontWeight: "800", marginTop: 6 },
  heroSub: { color: colors.slate, fontSize: 13, marginTop: 6 },
  section: { color: colors.slate, fontSize: 12, fontWeight: "700", letterSpacing: 1, marginTop: 22, marginBottom: 10, marginLeft: 2 },
  card: { backgroundColor: colors.ink, borderRadius: 14, borderWidth: 1, borderColor: "#22405E", padding: 16 },
  acctName: { color: "#fff", fontSize: 15, fontWeight: "700" },
  acctSub: { color: colors.slate, fontSize: 13, marginTop: 4 },
  acctNote: { color: colors.slate, fontSize: 12.5, marginTop: 10, lineHeight: 18 },
  link: { color: colors.gold, fontSize: 14, fontWeight: "700", marginTop: 10 },
  empty: { color: colors.slate, fontSize: 13.5, lineHeight: 20 },
  divider: { height: 1, backgroundColor: "#22405E", marginVertical: 2 },
  payRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  payTitle: { color: "#fff", fontSize: 14.5, fontWeight: "600" },
  paySub: { color: colors.slate, fontSize: 12, marginTop: 3 },
  payAmount: { color: colors.teal, fontSize: 15, fontWeight: "800" },
});
