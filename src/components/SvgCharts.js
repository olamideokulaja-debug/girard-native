// Richer charts using react-native-svg: a donut breakdown and a smooth line
// trend with a gradient area fill. Kept separate from the zero-dep Charts.js.
import React from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Circle, G, Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { FadeInUp } from "./Charts";
import { colors } from "../theme";

// Donut breakdown. segments = [{ label, value, color }]
export function DonutChart({ segments, size = 168, thickness = 24, centerLabel }) {
  const shown = (segments || []).filter(s => s.value > 0);
  const total = shown.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <FadeInUp>
      <View style={{ alignItems: "center" }}>
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size}>
            <G rotation="-90" origin={cx + "," + cy}>
              <Circle cx={cx} cy={cy} r={r} stroke="#16324F" strokeWidth={thickness} fill="none" />
              {total > 0 ? shown.map((s, i) => {
                const len = (s.value / total) * C;
                const el = (
                  <Circle key={i} cx={cx} cy={cy} r={r} stroke={s.color} strokeWidth={thickness} fill="none"
                    strokeDasharray={len + " " + (C - len)} strokeDashoffset={-offset} strokeLinecap="butt" />
                );
                offset += len; return el;
              }) : null}
            </G>
          </Svg>
          <View style={styles.donutCenter}>
            <Text style={styles.donutTotal}>{total}</Text>
            <Text style={styles.donutLabel}>{centerLabel || "total"}</Text>
          </View>
        </View>
        <View style={styles.legend}>
          {(segments || []).map((s, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <Text style={styles.legendText}>{s.label} · {s.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </FadeInUp>
  );
}

// Smooth-ish line trend with gradient area. data = [{ label, value }]
export function LineChart({ data, height = 170, color = colors.gold }) {
  if (!data || data.length === 0) return null;
  const { width: winW } = useWindowDimensions();
  const width = winW - 64;
  const pad = 22;
  const n = data.length;
  const max = Math.max(1, ...data.map(d => d.value));
  const x = (i) => pad + (n <= 1 ? (width - 2 * pad) / 2 : i * ((width - 2 * pad) / (n - 1)));
  const y = (v) => (height - pad) - (v / max) * (height - 2 * pad);
  const line = data.map((d, i) => (i === 0 ? "M" : "L") + x(i) + "," + y(d.value)).join(" ");
  const area = line + " L" + x(n - 1) + "," + (height - pad) + " L" + x(0) + "," + (height - pad) + " Z";
  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.35" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#areaGrad)" />
        <Path d={line} stroke={color} strokeWidth="2.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => <Circle key={i} cx={x(i)} cy={y(d.value)} r="3.5" fill={color} />)}
      </Svg>
      <View style={[styles.xAxis, { width }]}>
        {data.map((d, i) => <Text key={i} style={styles.xLabel}>{d.label}</Text>)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  donutCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  donutTotal: { color: "#fff", fontSize: 30, fontWeight: "800" },
  donutLabel: { color: colors.slate, fontSize: 12, marginTop: 2 },
  legend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14, marginTop: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { color: colors.slate, fontSize: 12.5 },
  xAxis: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, marginTop: 6 },
  xLabel: { color: colors.slate, fontSize: 11, flex: 1, textAlign: "center" },
});
