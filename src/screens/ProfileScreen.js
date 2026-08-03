// Account / Profile — native screen showing the signed-in user's details.
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Switch, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";
import { isBioEnabled, setBioEnabled, bioAvailable } from "../lib/lock";

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [bioOn, setBioOn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser((data && data.user) || null));
    isBioEnabled().then(setBioOn);
    supabase.from("payments").select("*").order("paid_at", { ascending: false }).limit(20)
      .then(({ data }) => setPayments(data || []))
      .catch(() => setPayments([]));
  }, []);

  const money = (kobo) => "\u20a6" + Number((kobo || 0) / 100).toLocaleString();
  const dateStr = (iso) => { try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; } };
  const onToggleBio = async (val) => {
    if (val) {
      const ok = await bioAvailable();
      if (!ok) { Alert.alert("Not available", "Set up Face ID or a fingerprint on your device first."); return; }
    }
    await setBioEnabled(val); setBioOn(val);
  };

  const meta = (user && user.user_metadata) || {};
  const name = meta.full_name || meta.name || "";
  const email = (user && user.email) || "";
  const role = meta.role || "Tenant";
  const initial = (name || email || "G").trim().slice(0, 1).toUpperCase();

  const Row = ({ label, value }) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value || "\u2014"}</Text>
    </View>
  );
  const Link = ({ label, onPress }) => (
    <TouchableOpacity style={styles.linkRow} onPress={onPress}>
      <Text style={styles.linkText}>{label}</Text>
      <Text style={styles.chev}>{"\u203A"}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrap}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>{"\u2039  Back"}</Text></TouchableOpacity>
        <Text style={styles.hTitle}>Account</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
          <Text style={styles.name}>{name || "Girard member"}</Text>
          {email ? <Text style={styles.email}>{email}</Text> : null}
        </View>

        <Text style={styles.section}>ACCOUNT</Text>
        <View style={styles.card}>
          <Row label="Name" value={name} />
          <View style={styles.divider} />
          <Row label="Email" value={email} />
          <View style={styles.divider} />
          <Row label="Role" value={role} />
        </View>

        <Text style={styles.section}>MY PAYMENTS</Text>
        <View style={styles.card}>
          {payments.length === 0 ? (
            <Text style={styles.emptyPay}>No payments yet. Rent you pay through the app will appear here.</Text>
          ) : payments.map((pmt, i) => (
            <View key={pmt.id || pmt.reference || i}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.payRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.payTitle} numberOfLines={1}>{pmt.title || pmt.property_id || "Payment"}</Text>
                  <Text style={styles.paySub}>{dateStr(pmt.paid_at)}{pmt.status ? "  \u00b7  " + pmt.status : ""}</Text>
                </View>
                <Text style={styles.payAmount}>{money(pmt.amount)}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.section}>LANDLORD</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate("MyListings")}>
            <Text style={styles.linkText}>My listings & verification</Text>
            <Text style={styles.chev}>{"\u203A"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>SECURITY</Text>
        <View style={styles.card}>
          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Require Face ID / fingerprint</Text>
            <Switch value={bioOn} onValueChange={onToggleBio} trackColor={{ true: colors.teal, false: "#33546F" }} thumbColor="#fff" />
          </View>
        </View>

        <Text style={styles.section}>SUPPORT</Text>
        <View style={styles.card}>
          <Link label="Message Girard" onPress={() => navigation.navigate("Messages")} />
          <View style={styles.divider} />
          <Link label="Contact support" onPress={() => Linking.openURL("mailto:support@girardpropertylimited.com")} />
          <View style={styles.divider} />
          <Link label="Visit girardpropertylimited.com" onPress={() => Linking.openURL("https://girardpropertylimited.com")} />
          <View style={styles.divider} />
          <Link label="Privacy policy" onPress={() => Linking.openURL("https://girardpropertylimited.com/privacy")} />
        </View>

        <TouchableOpacity style={styles.signOut} onPress={() => supabase.auth.signOut()}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Girard Property Estate Limited</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.deep },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingBottom: 14, backgroundColor: colors.ink },
  back: { color: "#C7D3E0", fontSize: 14, fontWeight: "600", width: 60 },
  hTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  avatarWrap: { alignItems: "center", marginTop: 8, marginBottom: 22 },
  avatar: { width: 84, height: 84, borderRadius: 999, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.gold, marginBottom: 12 },
  avatarText: { color: colors.gold, fontSize: 34, fontWeight: "800" },
  name: { color: "#fff", fontSize: 20, fontWeight: "800" },
  email: { color: colors.slate, fontSize: 14, marginTop: 3 },
  section: { color: colors.slate, fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: colors.ink, borderRadius: 14, borderWidth: 1, borderColor: "#22405E", marginBottom: 22, overflow: "hidden" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  rowLabel: { color: colors.slate, fontSize: 14 },
  rowValue: { color: "#fff", fontSize: 14, fontWeight: "600", flexShrink: 1, marginLeft: 12 },
  linkRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 15 },
  linkText: { color: "#fff", fontSize: 15 },
  chev: { color: colors.slate, fontSize: 22 },
  divider: { height: 1, backgroundColor: "#22405E", marginHorizontal: 16 },
  signOut: { backgroundColor: colors.ink, borderRadius: 12, paddingVertical: 15, alignItems: "center", borderWidth: 1, borderColor: colors.danger },
  signOutText: { color: colors.danger, fontSize: 15, fontWeight: "700" },
  emptyPay: { color: colors.slate, fontSize: 13.5, lineHeight: 20, padding: 16 },
  payRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13 },
  payTitle: { color: "#fff", fontSize: 14.5, fontWeight: "600" },
  paySub: { color: colors.slate, fontSize: 12, marginTop: 3 },
  payAmount: { color: colors.teal, fontSize: 15, fontWeight: "800" },
  version: { textAlign: "center", color: colors.slate, fontSize: 12, marginTop: 22 },
});
