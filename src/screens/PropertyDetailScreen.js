// Property detail — full listing page. Opened by tapping a card in the feed.
import React, { useState, useEffect } from "react";
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Alert, Share, Modal, TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import ShortLetBooking from "../components/ShortLetBooking";

const { width } = Dimensions.get("window");
const money = (n) => "\u20a6" + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function thumb(url, w) {
  if (typeof url === "string" && url.indexOf("/storage/v1/object/public/") !== -1) {
    return url.replace("/object/public/", "/render/image/public/") + (url.indexOf("?") !== -1 ? "&" : "?") + "width=" + w + "&quality=75";
  }
  return url;
}

function photoList(p) {
  const out = [];
  const ph = p.photos;
  if (Array.isArray(ph)) for (const f of ph) {
    if (typeof f === "string" && (f.startsWith("http") || f.startsWith("data:"))) out.push(thumb(f, 1000));
    else if (f && typeof f === "object" && typeof f.url === "string") out.push(f.url);
  }
  return out;
}

export default function PropertyDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const initial = (route.params && route.params.property) || {};
  const [p, setP] = useState(initial);
  const [status, setStatus] = useState(initial.status);
  const [paying, setPaying] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [enqOpen, setEnqOpen] = useState(false);
  const [enqPhone, setEnqPhone] = useState("");
  const [enqMsg, setEnqMsg] = useState("");
  const [enqSending, setEnqSending] = useState(false);

  const sendEnquiry = async () => {
    if (!enqMsg.trim()) { Alert.alert("Add a message", "Tell us what you'd like to know."); return; }
    setEnqSending(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const user = u && u.user;
      const email = (user && user.email) || null;
      const meta = (user && user.user_metadata) || {};
      const name = meta.full_name || meta.name || (email ? email.split("@")[0] : "Guest");
      const { error } = await supabase.from("enquiries").insert([{
        id: "EN-" + Date.now(), type: "Enquiry", prop_id: p.id, prop_title: p.title || null,
        area: p.area || null, name, phone: enqPhone || null, email, message: enqMsg.trim(), status: "New",
      }]);
      if (error) throw error;
      setEnqOpen(false); setEnqMsg(""); setEnqPhone("");
      Alert.alert("Enquiry sent", "Girard will get back to you shortly.");
    } catch (e) { Alert.alert("Couldn't send", String((e && e.message) || e)); }
    setEnqSending(false);
  };
  const routeId = (route.params && route.params.id) || (p && p.id);
  useEffect(() => {
    if ((!p || !p.title) && routeId) {
      supabase.from("properties").select("*").eq("id", routeId).single().then(({ data }) => {
        if (data) { const prop = { ...(data.data || {}), id: data.id, status: data.status, owner_email: data.owner_email }; setP(prop); setStatus(prop.status); }
      });
    }
  }, [routeId]);
  const photos = photoList(p);
  const verified = status && status !== "Pending Verification";
  const amenities = Array.isArray(p.amenities) ? p.amenities : [];
  const isShortLet = p.letType === "Short let" || p.letType === "Holiday stay / serviced";

  const onReport = () => {
    const reasons = ["Not available / already taken", "Suspected fraud or fake", "Wrong price or details", "Other"];
    Alert.alert("Report this listing", "What's the problem?",
      [...reasons.map(reason => ({ text: reason, onPress: async () => {
        try {
          const { data: u } = await supabase.auth.getUser();
          await supabase.from("reports").insert({ property_id: p.id, reporter_email: (u && u.user && u.user.email) || null, reason });
          Alert.alert("Thank you", "Girard will review this listing.");
        } catch (e) { Alert.alert("Couldn't send", "Please try again later."); }
      }})), { text: "Cancel", style: "cancel" }]);
  };

  const onShare = async () => {
    try {
      await Share.share({ message: (p.title || "Property") + " \u00b7 " + (p.area || "") + (p.rent ? " \u00b7 " + money(p.rent) + "/yr" : "") + "\nOpen in Girard: girard://property/" + (p.id || "") + "\nhttps://girardpropertylimited.com" });
    } catch (e) {}
  };

  const SITE = "https://girardpropertylimited.com";
  const startPayment = async () => {
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
          property: p.id,
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
      // Opens Paystack checkout and auto-returns when it redirects to girard://pay-return
      await WebBrowser.openAuthSessionAsync(init.authorization_url, "girard://pay-return");
      // After the checkout closes, confirm the payment really went through.
      const vRes = await fetch(SITE + "/api/paystack-verify?reference=" + encodeURIComponent(init.reference));
      const v = await vRes.json();
      if (v && v.status === "success") {
        setStatus("Leased");
        Alert.alert("Payment successful", "Your payment for " + (p.title || "this property") + " was received.", [{ text: "OK", onPress: () => navigation.goBack() }]);
      } else {
        Alert.alert("Not confirmed", "We couldn't confirm the payment. If you completed it, it will reflect shortly.");
      }
    } catch (e) {
      Alert.alert("Payment error", String((e && e.message) || e));
    }
    setPaying(false);
  };

  const onPayBook = () => {
    if (paying) return;
    if (!p.rent) { Alert.alert("No price set", "This listing has no rent to pay yet."); return; }
    const fee = Math.round(Number(p.rent) * 0.05);
    Alert.alert(
      "Confirm payment",
      "Property: " + (p.title || "this property") + "\n\nAnnual rent: " + money(p.rent) +
      "\n\nYou pay the rent in full. Girard's 5% (" + money(fee) + ") is settled from the landlord's proceeds, not added to your total.",
      [{ text: "Cancel", style: "cancel" }, { text: "Pay " + money(p.rent), onPress: startPayment }]
    );
  };

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        {photos.length ? (
          <View>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / width))}>
              {photos.map((u, i) => (
                <Image key={i} source={{ uri: u }} style={{ width, height: 290 }} resizeMode="cover" />
              ))}
            </ScrollView>
            {photos.length > 1 ? (
              <View style={styles.counter}><Text style={styles.counterText}>{(photoIdx + 1) + " / " + photos.length}</Text></View>
            ) : null}
          </View>
        ) : (
          <View style={[styles.photoPh, { width, height: 290 }]}>
            <Text style={styles.phText}>GIRARD</Text>
          </View>
        )}

        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" style={[styles.iconBtn, { top: insets.top + 10, left: 14 }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.body}>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>{p.title || "Untitled property"}</Text>
            {verified ? <Text style={styles.badge}>Verified</Text> : null}
          </View>
          <Text style={styles.meta}>
            {[p.area, p.type, p.beds ? p.beds + " bed" : null].filter(Boolean).join("  ·  ")}
          </Text>
          {p.address ? <View style={styles.addrRow}><Ionicons name="location-outline" size={15} color={colors.slate} /><Text style={styles.address}>{p.address}</Text></View> : null}

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

          {isShortLet ? <ShortLetBooking p={p} /> : null}

          <TouchableOpacity style={styles.enquire} onPress={() => setEnqOpen(true)}>
            <Ionicons name="chatbubble-ellipses-outline" size={17} color={colors.gold} style={{ marginRight: 8 }} />
            <Text style={styles.enquireText}>Enquire about this property</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onReport} style={{ marginTop: 22, alignSelf: "flex-start" }}>
            <Text style={{ color: colors.slate, fontSize: 13, textDecorationLine: "underline" }}>Report this listing</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={enqOpen} transparent animationType="slide" onRequestClose={() => setEnqOpen(false)}>
        <View style={styles.mOverlay}>
          <View style={styles.mCard}>
            <Text style={styles.mTitle}>Enquire</Text>
            <Text style={styles.mSub} numberOfLines={1}>{p.title || "This property"}</Text>
            <TextInput style={styles.mInput} value={enqPhone} onChangeText={setEnqPhone} placeholder="Your phone (optional)" placeholderTextColor={colors.slate} keyboardType="phone-pad" />
            <TextInput style={[styles.mInput, { height: 96, textAlignVertical: "top" }]} value={enqMsg} onChangeText={setEnqMsg} placeholder="Your message" placeholderTextColor={colors.slate} multiline />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
              <TouchableOpacity style={[styles.mBtn, styles.mCancel]} onPress={() => setEnqOpen(false)}><Text style={styles.mCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.mBtn, styles.mSend]} onPress={sendEnquiry} disabled={enqSending}><Text style={styles.mSendText}>{enqSending ? "Sending\u2026" : "Send"}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {!isShortLet && <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={status !== "Available" ? "Property leased" : (p.rent ? "Pay " + money(p.rent) + " per year" : "Pay or book")} style={[styles.payBtn, status !== "Available" && { backgroundColor: "#3A5470" }]} onPress={onPayBook} disabled={paying || status !== "Available"}>
          <Text style={styles.payText}>{status !== "Available" ? "Leased" : (paying ? "Starting payment\u2026" : (p.rent ? "Pay " + money(p.rent) + " / yr" : "Pay / Book"))}</Text>
        </TouchableOpacity>
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.deep },
  photoPh: { backgroundColor: "#12293F", alignItems: "center", justifyContent: "center" },
  phText: { color: colors.gold, fontSize: 26, fontWeight: "800", letterSpacing: 4, opacity: 0.5 },
  iconBtn: { position: "absolute", width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(15,36,56,0.72)", alignItems: "center", justifyContent: "center" },
  addrRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 8 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: colors.slate, fontSize: 13.5 },
  enquire: { marginTop: 18, borderWidth: 1, borderColor: colors.gold, borderRadius: 12, paddingVertical: 13, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  enquireText: { color: colors.gold, fontSize: 15, fontWeight: "800" },
  mOverlay: { flex: 1, backgroundColor: "rgba(6,14,24,0.6)", justifyContent: "flex-end" },
  mCard: { backgroundColor: colors.deep, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, borderTopWidth: 1, borderColor: "#22405E" },
  mTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  mSub: { color: colors.slate, fontSize: 13.5, marginTop: 2, marginBottom: 14 },
  mInput: { backgroundColor: colors.ink, color: "#fff", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, borderWidth: 1, borderColor: "#22405E", marginBottom: 10 },
  mBtn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  mCancel: { backgroundColor: colors.ink, borderWidth: 1, borderColor: "#22405E" },
  mCancelText: { color: "#C7D3E0", fontWeight: "700" },
  mSend: { backgroundColor: colors.gold },
  mSendText: { color: colors.deep, fontWeight: "800" },
  counter: { position: "absolute", bottom: 12, right: 12, backgroundColor: "rgba(15,36,56,0.75)", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  counterText: { color: "#fff", fontSize: 12, fontWeight: "700" },
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
