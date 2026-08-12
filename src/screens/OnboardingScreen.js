import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme";

const SLIDES = [
  { title: "Verified property", body: "Browse rentals and homes Girard has verified. No fake listings, no guesswork." },
  { title: "Pay rent securely", body: "Pay in the app through Paystack. Your landlord is paid directly and the property is yours." },
  { title: "All in one place", body: "Save favourites, track your payments, and manage everything from your phone." },
];

export default function OnboardingScreen({ onDone }) {
  const insets = useSafeAreaInsets();
  // Read the width LIVE. Reading it once at module load broke iPad, where the
  // window can be rotated, resized or opened in Stage Manager after launch.
  const { width } = useWindowDimensions();
  const [idx, setIdx] = useState(0);
  const ref = useRef(null);
  const next = () => {
    if (idx < SLIDES.length - 1) { if (ref.current) ref.current.scrollTo({ x: width * (idx + 1), animated: true }); setIdx(idx + 1); }
    else onDone();
  };
  return (
    <View style={styles.wrap}>
      <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))} style={{ flex: 1 }}>
        {SLIDES.map((s, i) => (
          /* The PAGE must be exactly one screen wide or paging drifts. A previous
             version put maxWidth on this view, so each page rendered narrower than
             the distance the ScrollView paged by, and every slide after the first
             was offset: text ran off the edge and the next slide bled in. The width
             limit belongs on the inner column, never on the page. */
          <View key={i} style={[styles.page, { width, paddingTop: insets.top + 40 }]}>
            <View style={styles.column}>
              <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
              <Text style={styles.brand}>GIRARD PROPERTY</Text>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.body}>{s.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.footerInner}>
          <View style={styles.dots}>{SLIDES.map((_, i) => <View key={i} style={[styles.dot, i === idx && styles.dotOn]} />)}</View>
          <TouchableOpacity style={styles.btn} onPress={next} accessibilityRole="button">
            <Text style={styles.btnText}>{idx === SLIDES.length - 1 ? "Get started" : "Next"}</Text>
          </TouchableOpacity>
          {idx < SLIDES.length - 1
            ? <TouchableOpacity onPress={onDone} style={{ marginTop: 12 }} accessibilityRole="button"><Text style={styles.skip}>Skip</Text></TouchableOpacity>
            : <View style={{ height: 34 }} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.deep },
  page: { justifyContent: "center", alignItems: "center", paddingHorizontal: 34 },
  column: { width: "100%", maxWidth: 520, alignItems: "center" },
  logo: { width: 96, height: 96, marginBottom: 18 },
  brand: { color: colors.gold, fontSize: 15, fontWeight: "800", letterSpacing: 3, marginBottom: 40, textAlign: "center" },
  title: { color: "#fff", fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 14 },
  body: { color: colors.slate, fontSize: 15.5, lineHeight: 24, textAlign: "center" },
  footer: { paddingHorizontal: 30, alignItems: "center" },
  footerInner: { width: "100%", maxWidth: 520 },
  dots: { flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22405E", marginHorizontal: 4 },
  dotOn: { backgroundColor: colors.gold, width: 22 },
  btn: { backgroundColor: colors.teal, borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  skip: { color: colors.slate, fontSize: 14, textAlign: "center", fontWeight: "600" },
});
