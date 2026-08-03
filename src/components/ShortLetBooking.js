// Short-let booking: a date-range calendar that blocks already-booked nights,
// computes nights x nightly, and pays via Paystack. On success the server
// creates a "bookings" row (same table the website uses).
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

const SITE = "https://girardpropertylimited.com";
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONF = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const money = (n) => "\u20a6" + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const fmtShort = (d) => { const x = new Date(d); return x.getDate() + " " + MON[x.getMonth()]; };
const fmtMonth = (d) => MONF[d.getMonth()] + " " + d.getFullYear();
const dOnly = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
const nightsBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export default function ShortLetBooking({ p }) {
  const [taken, setTaken] = useState({});
  const [ci, setCi] = useState(null);
  const [co, setCo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [base, setBase] = useState(new Date());
  const nightly = Number(p.nightly || p.rent || 0);
  const minNights = Number(p.minNights || 1);
  const todayK = dOnly(new Date());

  const loadBookings = async () => {
    try {
      const { data } = await supabase.from("bookings").select("checkin,checkout,status").eq("property_id", p.id).eq("status", "Confirmed");
      const t = {};
      (data || []).forEach(b => { let d = new Date(b.checkin); const end = new Date(b.checkout); while (d < end) { t[dOnly(d)] = true; d = addDays(d, 1); } });
      setTaken(t);
    } catch (e) {}
  };
  useEffect(() => { loadBookings(); }, [p.id]);

  const nights = (ci && co) ? nightsBetween(ci, co) : 0;
  const total = nights * nightly;

  const onDay = (d) => {
    const k = dOnly(d);
    if (taken[k] || k < todayK) return;
    if (!ci || (ci && co)) { setCi(d); setCo(null); return; }
    if (d <= ci) { setCi(d); setCo(null); return; }
    let x = new Date(ci); while (x < d) { if (taken[dOnly(x)]) { Alert.alert("Unavailable", "Some nights in that range are already booked."); return; } x = addDays(x, 1); }
    setCo(d);
  };

  const inRange = (k) => ci && co && k > dOnly(ci) && k < dOnly(co);

  const Month = ({ m }) => {
    const first = new Date(m.getFullYear(), m.getMonth(), 1);
    const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    const lead = first.getDay();
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(<View key={"b" + i} style={styles.cell} />);
    for (let day = 1; day <= days; day++) {
      const d = new Date(m.getFullYear(), m.getMonth(), day);
      const k = dOnly(d);
      const isCi = ci && k === dOnly(ci), isCo = co && k === dOnly(co);
      const disabled = taken[k] || k < todayK;
      cells.push(
        <TouchableOpacity key={k} style={styles.cell} onPress={() => onDay(d)} disabled={disabled}>
          <View style={[styles.day, (isCi || isCo) && styles.dayPick, inRange(k) && styles.dayRange, disabled && styles.dayOff]}>
            <Text style={[styles.dayText, (isCi || isCo) && styles.dayTextPick, disabled && styles.dayTextOff]}>{day}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    return (
      <View style={{ marginBottom: 14 }}>
        <Text style={styles.monthLabel}>{fmtMonth(m)}</Text>
        <View style={styles.dow}>{DOW.map((x, i) => <Text key={i} style={styles.dowText}>{x}</Text>)}</View>
        <View style={styles.grid}>{cells}</View>
      </View>
    );
  };

  const book = async () => {
    if (!ci || !co) { Alert.alert("Pick dates", "Choose your check-in and check-out."); return; }
    if (nights < minNights) { Alert.alert("Minimum stay", "This place needs at least " + minNights + " night" + (minNights > 1 ? "s" : "") + "."); return; }
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const email = (u && u.user && u.user.email) || "guest@girardpropertylimited.com";
      const initRes = await fetch(SITE + "/api/paystack-initialize", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, property: p.id, booking: true, checkin: dOnly(ci), checkout: dOnly(co),
          metadata: { property: p.id, title: p.title, checkin: dOnly(ci), checkout: dOnly(co), nights } }),
      });
      const init = await initRes.json();
      if (!init || !init.authorization_url) { Alert.alert("Booking error", (init && init.error) || "Couldn't start the booking."); setBusy(false); return; }
      await WebBrowser.openAuthSessionAsync(init.authorization_url, "girard://pay-return");
      const v = await (await fetch(SITE + "/api/paystack-verify?reference=" + encodeURIComponent(init.reference))).json();
      if (v && v.status === "success") { Alert.alert("Booking confirmed", nights + " night" + (nights > 1 ? "s" : "") + " at " + (p.title || "this property") + " is booked."); setCi(null); setCo(null); loadBookings(); }
      else Alert.alert("Not confirmed", "We couldn't confirm the booking. If you paid, it will reflect shortly.");
    } catch (e) { Alert.alert("Booking error", String((e && e.message) || e)); }
    setBusy(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.h2}>Book your stay</Text>
      <Text style={styles.nightly}>{money(nightly)} <Text style={styles.per}>/ night</Text>{minNights > 1 ? "  \u00b7  min " + minNights + " nights" : ""}</Text>
      <Month m={base} />
      <Month m={addMonths(base, 1)} />
      <TouchableOpacity onPress={() => setBase(addMonths(base, 1))}><Text style={styles.more}>Show later dates \u203A</Text></TouchableOpacity>
      {ci && co ? (
        <View style={styles.summary}>
          <Text style={styles.sumLine}>{fmtShort(ci)} \u2192 {fmtShort(co)}  \u00b7  {nights} night{nights > 1 ? "s" : ""}</Text>
          <Text style={styles.sumTotal}>{money(total)}</Text>
        </View>
      ) : <Text style={styles.hint}>Tap a check-in date, then a check-out date.</Text>}
      <TouchableOpacity style={[styles.btn, (!ci || !co || busy) && { backgroundColor: "#3A5470" }]} onPress={book} disabled={!ci || !co || busy}>
        <Text style={styles.btnText}>{busy ? "Starting\u2026" : (ci && co ? "Book \u00b7 pay " + money(total) : "Select dates")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 6 },
  h2: { color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 4 },
  nightly: { color: colors.teal, fontSize: 18, fontWeight: "800", marginBottom: 14 },
  per: { color: colors.slate, fontSize: 13, fontWeight: "600" },
  monthLabel: { color: "#fff", fontSize: 14.5, fontWeight: "700", marginBottom: 8 },
  dow: { flexDirection: "row" },
  dowText: { color: colors.slate, fontSize: 11, fontWeight: "700", width: `${100 / 7}%`, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center", padding: 2 },
  day: { width: "92%", aspectRatio: 1, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  dayPick: { backgroundColor: colors.gold },
  dayRange: { backgroundColor: "#1D4460" },
  dayOff: { opacity: 0.3 },
  dayText: { color: "#E7EEF5", fontSize: 13.5, fontWeight: "600" },
  dayTextPick: { color: colors.deep, fontWeight: "800" },
  dayTextOff: { color: colors.slate, textDecorationLine: "line-through" },
  more: { color: colors.gold, fontSize: 13, fontWeight: "700", marginBottom: 10 },
  summary: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.ink, borderRadius: 10, padding: 14, marginTop: 6, marginBottom: 12, borderWidth: 1, borderColor: "#22405E" },
  sumLine: { color: "#E7EEF5", fontSize: 13.5, fontWeight: "600", flex: 1 },
  sumTotal: { color: colors.teal, fontSize: 16, fontWeight: "800" },
  hint: { color: colors.slate, fontSize: 13, marginTop: 6, marginBottom: 12 },
  btn: { backgroundColor: colors.gold, borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  btnText: { color: colors.deep, fontSize: 16, fontWeight: "800" },
});
