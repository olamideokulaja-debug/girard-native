// Property Swap (native entry + status). Registers a property for swap and tracks
// progress against the same "swaps" table the website uses. The heavy legal/escrow
// stages (matching, negotiation, contracts, digital signing, escrow) continue on
// the website, which is the right place for them.
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

const SITE = "https://girardpropertylimited.com";
const STEPS = ["Register", "Your property", "Document checks", "Browse & match", "Negotiate", "Agreement", "Escrow & completion"];
const MARKETS = [
  { name: "Nigeria", cur: "\u20a6" }, { name: "United Kingdom", cur: "\u00a3" },
  { name: "UAE", cur: "AED " }, { name: "USA", cur: "$" },
];

function journeyDefault() {
  return { stage: 0, paid: false, prop: { market: "Nigeria", area: "", value: "", currency: "\u20a6", photos: [], docs: [] },
    verified: false, targets: [], match: null, chat: [], agreementText: "", signedMe: false, signedThem: false,
    escrowFunded: false, balanceValue: "", finalMe: false, finalThem: false, revealed: false, swapType: "Permanent",
    contractText: "", payoutName: "", payoutNum: "", payoutBank: "", stopped: false, flagged: false };
}
// map internal stage (0-11) to a user step index (0-6)
function stepFromStage(stage) {
  if (stage <= 0) return 0;
  if (stage === 1) return 1;
  if (stage <= 3) return 2;
  if (stage <= 5) return 3;
  if (stage <= 7) return 4;
  if (stage <= 9) return 5;
  return 6;
}

export default function SwapScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [market, setMarket] = useState("Nigeria");
  const [area, setArea] = useState("");
  const [value, setValue] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const em = (u && u.user && u.user.email) || "";
    setEmail(em);
    try {
      const { data } = await supabase.from("swaps").select("data,stage").eq("id", em).maybeSingle();
      if (data && data.data) setJourney({ ...journeyDefault(), ...data.data, prop: { ...journeyDefault().prop, ...(data.data.prop || {}) } });
      else setJourney(null);
    } catch (e) { setJourney(null); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const startSwap = async () => {
    if (!area.trim() || !value.trim()) { Alert.alert("Fill your property", "Enter the area and estimated value."); return; }
    setSaving(true);
    const cur = (MARKETS.find(m => m.name === market) || MARKETS[0]).cur;
    const j = { ...journeyDefault(), stage: 1, prop: { market, area: area.trim(), value: value.replace(/[^0-9]/g, ""), currency: cur, photos: [], docs: [] } };
    try {
      const { error } = await supabase.from("swaps").upsert([{ id: email, owner: email, stage: 1, value: cur + j.prop.value, flagged: false, stopped: false, data: j, updated_at: new Date().toISOString() }]);
      if (error) throw error;
      setJourney(j);
      Alert.alert("Registered for swap", "Your property is registered. Continue the document checks and matching on the website.");
    } catch (e) { Alert.alert("Couldn't register", String((e && e.message) || e)); }
    setSaving(false);
  };

  const started = journey && journey.stage >= 1;
  const step = started ? stepFromStage(journey.stage) : 0;

  return (
    <View style={styles.wrap}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>{"\u2039  Back"}</Text></TouchableOpacity>
        <Text style={styles.hTitle}>Property swap</Text>
        <View style={{ width: 60 }} />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.gold} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 30 }}>
          <Text style={styles.intro}>Swap your property for one in another city or country. Girard verifies both sides and handles escrow.</Text>

          <View style={styles.steps}>
            {STEPS.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.dot, i < step && styles.dotDone, i === step && styles.dotNow]}>
                  <Text style={[styles.dotText, i <= step && { color: colors.deep }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, i === step && { color: "#fff", fontWeight: "800" }]}>{s}</Text>
              </View>
            ))}
          </View>

          {!started ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Register your property</Text>
              <Text style={styles.label}>Market</Text>
              <View style={styles.chipRow}>{MARKETS.map(m => (
                <TouchableOpacity key={m.name} style={[styles.chip, market === m.name && styles.chipOn]} onPress={() => setMarket(m.name)}>
                  <Text style={[styles.chipText, market === m.name && styles.chipTextOn]}>{m.name}</Text>
                </TouchableOpacity>
              ))}</View>
              <Text style={[styles.label, { marginTop: 12 }]}>Area / city</Text>
              <TextInput style={styles.input} value={area} onChangeText={setArea} placeholder="e.g. Lekki, Lagos" placeholderTextColor={colors.slate} />
              <Text style={[styles.label, { marginTop: 12 }]}>Estimated value</Text>
              <TextInput style={styles.input} value={value} onChangeText={t => setValue(t.replace(/[^0-9]/g, ""))} keyboardType="number-pad" placeholder="e.g. 120000000" placeholderTextColor={colors.slate} />
              <TouchableOpacity style={[styles.btn, saving && { opacity: 0.6 }]} onPress={startSwap} disabled={saving}>
                <Text style={styles.btnText}>{saving ? "Registering\u2026" : "Register for swap"}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your swap is in progress</Text>
              <Text style={styles.propLine}>{journey.prop.market + "  \u00b7  " + journey.prop.area}</Text>
              <Text style={styles.propVal}>{journey.prop.currency}{Number(journey.prop.value || 0).toLocaleString ? String(journey.prop.value).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : journey.prop.value}</Text>
              <Text style={styles.stageNow}>Current step: {STEPS[step]}</Text>
              <Text style={styles.propNote}>Document checks, matching, negotiation, contracts and escrow are handled on the website for security and legal signing.</Text>
              <TouchableOpacity style={styles.btn} onPress={() => Linking.openURL(SITE)}>
                <Text style={styles.btnText}>Continue on the website</Text>
              </TouchableOpacity>
            </View>
          )}
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
  intro: { color: colors.slate, fontSize: 14, lineHeight: 21, marginBottom: 18 },
  steps: { backgroundColor: colors.ink, borderRadius: 14, borderWidth: 1, borderColor: "#22405E", padding: 16, marginBottom: 16 },
  stepRow: { flexDirection: "row", alignItems: "center", marginVertical: 5 },
  dot: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#22405E", alignItems: "center", justifyContent: "center", marginRight: 12 },
  dotDone: { backgroundColor: "#1F9D57" }, dotNow: { backgroundColor: colors.gold },
  dotText: { color: "#C7D3E0", fontSize: 12, fontWeight: "800" },
  stepText: { color: colors.slate, fontSize: 14 },
  card: { backgroundColor: colors.ink, borderRadius: 14, borderWidth: 1, borderColor: "#22405E", padding: 18 },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 12 },
  label: { color: colors.slate, fontSize: 12.5, fontWeight: "700" },
  input: { backgroundColor: colors.deep, color: "#fff", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, borderWidth: 1, borderColor: "#22405E", marginTop: 6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: { borderWidth: 1, borderColor: "#2C4A66", borderRadius: 20, paddingHorizontal: 13, paddingVertical: 7 },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: "#C7D3E0", fontSize: 13, fontWeight: "600" }, chipTextOn: { color: colors.deep, fontWeight: "800" },
  btn: { backgroundColor: colors.teal, borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 18 },
  btnText: { color: "#fff", fontSize: 15.5, fontWeight: "800" },
  propLine: { color: colors.slate, fontSize: 14 },
  propVal: { color: colors.gold, fontSize: 22, fontWeight: "800", marginTop: 4 },
  stageNow: { color: "#fff", fontSize: 14.5, fontWeight: "700", marginTop: 14 },
  propNote: { color: colors.slate, fontSize: 13, lineHeight: 19, marginTop: 8 },
});
