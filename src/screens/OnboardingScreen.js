import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme";

const { width } = Dimensions.get("window");
const SLIDES = [
  { title: "Verified property", body: "Browse rentals and homes Girard has verified. No fake listings, no guesswork." },
  { title: "Pay rent securely", body: "Pay in the app through Paystack. Your landlord is paid directly and the property is yours." },
  { title: "All in one place", body: "Save favourites, track your payments, and manage everything from your phone." },
];

export default function OnboardingScreen({ onDone }) {
  const insets = useSafeAreaInsets();
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
          <View key={i} style={[styles.slide, { width, paddingTop: insets.top + 70 }]}>
            <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brand}>GIRARD PROPERTY</Text>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.dots}>{SLIDES.map((_, i) => <View key={i} style={[styles.dot, i === idx && styles.dotOn]} />)}</View>
        <TouchableOpacity style={styles.btn} onPress={next}>
          <Text style={styles.btnText}>{idx === SLIDES.length - 1 ? "Get started" : "Next"}</Text>
        </TouchableOpacity>
        {idx < SLIDES.length - 1
          ? <TouchableOpacity onPress={onDone} style={{ marginTop: 12 }}><Text style={styles.skip}>Skip</Text></TouchableOpacity>
          : <View style={{ height: 34 }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.deep },
  slide: { alignItems: "center", paddingHorizontal: 34 },
  logo: { width: 96, height: 96, marginBottom: 18 },
  brand: { color: colors.gold, fontSize: 15, fontWeight: "800", letterSpacing: 3, marginBottom: 40 },
  title: { color: "#fff", fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 14 },
  body: { color: colors.slate, fontSize: 15.5, lineHeight: 24, textAlign: "center" },
  footer: { paddingHorizontal: 30 },
  dots: { flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22405E", marginHorizontal: 4 },
  dotOn: { backgroundColor: colors.gold, width: 22 },
  btn: { backgroundColor: colors.teal, borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  skip: { color: colors.slate, fontSize: 14, textAlign: "center", fontWeight: "600" },
});
