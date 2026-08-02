// Property detail — full listing page. Opened by tapping a card in the feed.
import React, { useState } from "react";
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

const { width } = Dimensions.get("window");
const money = (n) => "₦" + Number(n || 0).toLocaleString();

function photoList(p) {
  const out = [];
  const ph = p.photos;
  if (Array.isArray(ph)) for (const f of ph) {
    if (typeof f === "string" && (f.startsWith("http") || f.startsWith("data:"))) out.push(f);
    else if (f && typeof f === "object" && typeof f.url === "string") out.push(f.url);
  }
  return out;
}

export default function PropertyDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const p = (route.params && route.params.property) || {};
  const photos = photoList(p);
  const verified = p.status && p.status !== "Pending Verification";
  const amenities = Array.isArray(p.amenities) ? p.amenities : [];
  const [paying, setPaying] = useState(false);

  const SITE = "https://girardpropertylimited.com";
  const onPayBook = async () => {
    if (paying) return;
    const amountKobo = Math.round(Number(p.rent || 0) * 100);
    if (!amountKobo) { Alert.alert("No price set", "This listing has no rent to pay yet."); return; }
    setPaying(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const email = (u && u.user && u.user.email) || "customer@girardpropertylimited.com";
      const initRes = await fetch(SITE + "/api/paystack-initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amount: amountKobo,
          subaccount: p.subaccount || undefined,
          split_code: p.split_code || undefined,
          metadata: { property: p.id, title: p.title },
        }),
      });
      const init = await initRes.json();
      if (!init || !init.authorization_url) {
        Alert.alert("Payment error", (init && init.error) || "Could not start the payment.");
        setPaying(false); return;
      }
      await WebBrowser.openBrowserAsync(init.authorization_url);
      // After the checkout closes, confirm the payment really went through.
      const vRes = await fetch(SITE + "/api/paystack-verify?reference=" + encodeURIComponent(init.reference));
      const v = await vRes.json();
      if (v && v.status === "success") {
        Alert.alert("Payment successful", "Your payment for " + (p.title || "this property") + " was received.");
      } else {
        Alert.alert("Not confirmed", "We couldn't confirm the payment. If you completed it, it will reflect shortly.");
      }
    } catch (e) {
      Alert.alert("Payment error", String((e && e.message) || e));
    }
    setPaying(false);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        {photos.length ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {photos.map((u, i) => (
              <Image key={i} source={{ uri: u }} style={{ width, height: 290 }} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.photoPh, { width, height: 290 }]}>
            <Text style={styles.phText}>GIRARD</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.back, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹  Back</Text>
        </TouchableOpacity>

        <View style={styles.body}>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>{p.title || "Untitled property"}</Text>
            {verified ? <Text style={styles.badge}>Verified</Text> : null}
          </View>
          <Text style={styles.meta}>
            {[p.area, p.type, p.beds ? p.beds + " bed" : null].filter(Boolean).join("  ·  ")}
          </Text>
          {p.address ? <Text style={styles.address}>{p.address}</Text> : null}

          <Text style={styles.rent}>{p.rent ? money(p.rent) + " / yr" : "Price on request"}</Text>
          {(p.letType || p.term) ? (
            <Text style={styles.subline}>{[p.letType, p.term].filter(Boolean).join("  ·  ")}</Text>
          ) : null}

          {amenities.length ? (
            <View>
              <Text style={styles.h2}>Amenities</Text>
              <View style={styles.chips}>
                {amenities.map((a, i) => <Text key={i} style={styles.chip}>{a}</Text>)}
              </View>
            </View>
          ) : null}

          {p.description ? (
            <View>
              <Text style={styles.h2}>About this property</Text>
              <Text style={styles.desc}>{p.description}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.payBtn} onPress={onPayBook} disabled={paying}>
          <Text style={styles.payText}>{paying ? "Starting payment\u2026" : (p.rent ? "Pay " + money(p.rent) + " / yr" : "Pay / Book")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.deep },
  photoPh: { backgroundColor: "#12293F", alignItems: "center", justifyContent: "center" },
  phText: { color: colors.gold, fontSize: 26, fontWeight: "800", letterSpacing: 4, opacity: 0.5 },
  back: { position: "absolute", left: 14, backgroundColor: "rgba(15,36,56,0.7)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  backText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  body: { padding: 20 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { color: "#fff", fontSize: 22, fontWeight: "800", flex: 1, marginRight: 10 },
  badge: { color: colors.deep, backgroundColor: colors.gold, fontSize: 11, fontWeight: "800", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, overflow: "hidden", marginTop: 4 },
  meta: { color: colors.slate, fontSize: 14, marginTop: 8 },
  address: { color: colors.slate, fontSize: 13, marginTop: 4 },
  rent: { color: colors.teal, fontSize: 22, fontWeight: "800", marginTop: 18 },
  subline: { color: colors.slate, fontSize: 13, marginTop: 4 },
  h2: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 24, marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap" },
  chip: { color: "#C7D3E0", backgroundColor: colors.ink, borderColor: "#22405E", borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, fontSize: 13, marginRight: 8, marginBottom: 8, overflow: "hidden" },
  desc: { color: "#C7D3E0", fontSize: 14, lineHeight: 22 },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.ink, borderTopWidth: 1, borderTopColor: "#22405E", paddingHorizontal: 16, paddingTop: 12 },
  payBtn: { backgroundColor: colors.teal, borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  payText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
