// Lightweight animated charts built on React Native's Animated (no chart lib,
// no native deps). Bars grow, numbers count up, segments slide in on mount.
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { colors } from "../theme";

// Number that counts up to `value` on mount / change.
export function CountUp({ value, style, format }) {
  const [n, setN] = useState(0);
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    a.setValue(0);
    const id = a.addListener(({ value: v }) => setN(Math.round(v)));
    Animated.timing(a, { toValue: Number(value) || 0, duration: 850, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => a.removeListener(id);
  }, [value]);
  return <Text style={style}>{format ? format(n) : String(n)}</Text>;
}

// Fades + slides its children up on mount (subtle entrance).
export function FadeInUp({ children, delay = 0, style }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 500, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

function Bar({ value, max, color, chartH, label, delay }) {
  const grow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(grow, { toValue: 1, duration: 750, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [value]);
  const h = grow.interpolate({ inputRange: [0, 1], outputRange: [2, Math.max(3, (value / max) * (chartH - 30))] });
  return (
    <View style={styles.barCol}>
      <Text style={styles.barVal}>{value}</Text>
      <Animated.View style={{ width: "66%", maxWidth: 34, height: h, backgroundColor: color, borderRadius: 7 }} />
      <Text style={styles.barLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// Vertical animated bar chart. data = [{ label, value }]
export function BarChart({ data, color = colors.gold, height = 150 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <View style={[styles.barRow, { height }]}>
      {data.map((d, i) => <Bar key={i} value={d.value} max={max} color={color} chartH={height} label={d.label} delay={i * 90} />)}
    </View>
  );
}

// Horizontal stacked breakdown bar + legend. segments = [{ label, value, color }]
export function SegmentBar({ segments }) {
  const shown = (segments || []).filter(s => s.value > 0);
  const total = Math.max(1, shown.reduce((s, x) => s + x.value, 0));
  return (
    <FadeInUp>
      <View style={styles.segTrack}>
        {shown.map((s, i) => (
          <View key={i} style={{ flex: s.value / total, backgroundColor: s.color,
            borderTopLeftRadius: i === 0 ? 8 : 0, borderBottomLeftRadius: i === 0 ? 8 : 0,
            borderTopRightRadius: i === shown.length - 1 ? 8 : 0, borderBottomRightRadius: i === shown.length - 1 ? 8 : 0 }} />
        ))}
      </View>
      <View style={styles.legend}>
        {(segments || []).map((s, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={styles.legendText}>{s.label} · {s.value}</Text>
          </View>
        ))}
      </View>
    </FadeInUp>
  );
}

// Thin animated progress bar (0..1)
export function ProgressBar({ pct, color = colors.teal }) {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, { toValue: Math.max(0, Math.min(1, pct)), duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [pct]);
  return (
    <View style={styles.progTrack}>
      <Animated.View style={{ height: "100%", borderRadius: 5, backgroundColor: color, width: w.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }} />
    </View>
  );
}

const styles = StyleSheet.create({
  barRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", gap: 8 },
  barCol: { flex: 1, alignItems: "center", height: "100%", justifyContent: "flex-end" },
  barVal: { color: "#C7D3E0", fontSize: 11, fontWeight: "700", marginBottom: 5 },
  barLabel: { color: colors.slate, fontSize: 11, marginTop: 7 },
  segTrack: { flexDirection: "row", height: 16, borderRadius: 8, overflow: "hidden", backgroundColor: "#16324F" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { color: colors.slate, fontSize: 12.5 },
  progTrack: { height: 9, borderRadius: 5, backgroundColor: "#16324F", overflow: "hidden" },
});
