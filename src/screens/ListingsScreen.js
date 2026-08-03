// Browse listings — native property feed reading your real `properties` table.
// Mirrors the website's rowToProp: spread row.data, then id + status on top.
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, ScrollView, Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { loadFavs, toggleFav } from "../lib/favourites";

const money = (n) => "\u20a6" + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function rowToProp(r) {
  return { ...(r.data || {}), id: r.id, status: r.status, girardManaged: !!r.girard_managed };
}

function thumb(url, w) {
  if (typeof url === "string" && url.indexOf("/storage/v1/object/public/") !== -1) {
    return url.replace("/object/public/", "/render/image/public/") + (url.indexOf("?") !== -1 ? "&" : "?") + "width=" + w + "&quality=70";
  }
  return url; // base64 / non-storage: leave as-is
}

function firstPhoto(p) {
  const ph = p.photos;
  if (Array.isArray(ph) && ph.length) {
    const f = ph[0];
    if (typeof f === "string" && (f.startsWith("http") || f.startsWith("data:"))) return thumb(f, 600);
    if (f && typeof f === "object" && typeof f.url === "string") return f.url;
  }
  return null;
}

function SkeletonCard() {
  const a = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 750, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.4, duration: 750, useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, [a]);
  return (
    <Animated.View style={[styles.card, { opacity: a }]}>
      <View style={[styles.photo, { backgroundColor: "#14314C" }]} />
      <View style={styles.cardBody}>
        <View style={{ height: 16, width: "70%", backgroundColor: "#16324F", borderRadius: 6 }} />
        <View style={{ height: 12, width: "45%", backgroundColor: "#16324F", borderRadius: 6, marginTop: 12 }} />
      </View>
    </Animated.View>
  );
}

export default function ListingsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [intent, setIntent] = useState((route && route.params && route.params.initialIntent) || "All");
  const [beds, setBeds] = useState("Any");
  const [favs, setFavs] = useState([]);
  const [savedOnly, setSavedOnly] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) { setError(error.message); setItems([]); }
    else setItems((data || []).map(rowToProp).filter(p => p.status === "Available"));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); loadFavs().then(setFavs); }, [load]);
  useEffect(() => { const it = route && route.params && route.params.initialIntent; if (it) setIntent(it); }, [route && route.params && route.params.initialIntent]);
  useEffect(() => { const sv = route && route.params && route.params.showSaved; if (sv) setSavedOnly(true); }, [route && route.params && route.params.showSaved]);
  useEffect(() => {
    const unsub = navigation.addListener("focus", () => { load(); loadFavs().then(setFavs); });
    return unsub;
  }, [navigation, load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const renderItem = ({ item }) => {
    const photo = firstPhoto(item);
    const verified = item.status && item.status !== "Pending Verification";
    const saved = favs.includes(item.id);
    const isSale = item.intent === "For sale";
    const isShort = item.letType === "Short let" || item.letType === "Holiday stay / serviced";
    const priceLabel = item.rent
      ? money(isShort ? (item.nightly || item.rent) : item.rent) + (isSale ? "" : isShort ? " / night" : " / yr")
      : "Price on request";
    const pillColor = item.status === "Leased" ? "#3A5470" : isSale ? "#6E59C7" : colors.gold;
    const pillTextColor = (item.status === "Leased" || isSale) ? "#fff" : colors.deep;
    return (
      <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={() => navigation.navigate("PropertyDetail", { property: item })}>
        <View style={styles.imgWrap}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}><Text style={styles.placeholderText}>GIRARD</Text></View>
          )}
          <View style={styles.scrim} />
          <View style={[styles.pill, { backgroundColor: pillColor }]}><Text style={[styles.pillText, { color: pillTextColor }]}>{isSale ? "For sale" : (item.status || "Available")}</Text></View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={saved ? "Remove from saved" : "Save listing"} style={styles.heart} onPress={() => toggleFav(item.id).then(setFavs)}>
            <Ionicons name={saved ? "heart" : "heart-outline"} size={18} color={saved ? colors.gold : "#fff"} />
          </TouchableOpacity>
          <Text style={styles.priceOverlay}>{priceLabel}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.rowBetween}>
            <Text style={styles.title} numberOfLines={1}>{item.title || "Untitled property"}</Text>
            {verified ? <Ionicons name="shield-checkmark" size={16} color={colors.teal} /> : null}
          </View>
          <View style={styles.metaRow}>
            {item.area ? <View style={styles.metaChip}><Ionicons name="location-outline" size={13} color={colors.slate} /><Text style={styles.metaText}>{item.area}</Text></View> : null}
            {item.beds ? <View style={styles.metaChip}><Ionicons name="bed-outline" size={13} color={colors.slate} /><Text style={styles.metaText}>{item.beds} bed</Text></View> : null}
            {item.type ? <View style={styles.metaChip}><Ionicons name="home-outline" size={13} color={colors.slate} /><Text style={styles.metaText}>{item.type}</Text></View> : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filtered = items.filter(p => {
    if (q) { const hay = ((p.title || "") + " " + (p.area || "") + " " + (p.type || "")).toLowerCase(); if (!hay.includes(q.toLowerCase())) return false; }
    if (intent !== "All") { const pi = p.intent || "To let"; if (intent === "For sale" && pi !== "For sale") return false; if (intent === "To let" && pi === "For sale") return false; }
    if (beds !== "Any") { const b = Number(p.beds || 0); if (beds === "3+") { if (b < 3) return false; } else if (String(b) !== beds) return false; }
    if (savedOnly && !favs.includes(p.id)) return false;
    return true;
  });
  const Chip = ({ label, active, onPress }) => (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrap}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.hTitle}>Browse</Text>
        <Text style={styles.hSub}>Verified property, ready to view</Text>
      </View>

      {!loading && !error && (
        <View style={styles.filterBar}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={17} color={colors.slate} style={{ marginRight: 8 }} />
            <TextInput style={styles.searchInput} value={q} onChangeText={setQ} placeholder="Search area, title or type" placeholderTextColor={colors.slate} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10 }}>
            {["All", "To let", "For sale"].map(x => <Chip key={x} label={x} active={intent === x} onPress={() => setIntent(x)} />)}
            {["Any", "1", "2", "3+"].map(x => <Chip key={"b" + x} label={x === "Any" ? "Any beds" : x + " bed"} active={beds === x} onPress={() => setBeds(x)} />)}
            <Chip label={"\u2665 Saved"} active={savedOnly} onPress={() => setSavedOnly(v => !v)} />
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={{ padding: 16 }}>{[0, 1, 2].map(i => <SkeletonCard key={i} />)}</View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={44} color={colors.slate} />
          <Text style={styles.emptyTitle}>Couldn't load listings</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={load}><Text style={styles.retryText}>Try again</Text></TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name={items.length === 0 ? "home-outline" : "search-outline"} size={44} color={colors.slate} />
          <Text style={styles.emptyTitle}>{items.length === 0 ? "No listings yet" : "No matches"}</Text>
          <Text style={styles.emptySub}>{items.length === 0 ? "New verified properties will appear here." : "Try a different search or filter."}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.deep },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
    paddingHorizontal: 18, paddingBottom: 14, backgroundColor: colors.ink },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerLogo: { width: 40, height: 40, marginRight: 10 },
  brandSub: { color: colors.slate, fontSize: 12, marginTop: 2 },
  signout: { color: "#C7D3E0", fontSize: 13, fontWeight: "600" },
  hTitle: { color: "#fff", fontSize: 25, fontWeight: "800" },
  hSub: { color: colors.slate, fontSize: 13.5, marginTop: 3 },
  filterBar: { backgroundColor: colors.ink, paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#22405E" },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.deep, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: "#22405E" },
  searchInput: { flex: 1, color: "#fff", paddingVertical: 10, fontSize: 14 },
  chip: { borderWidth: 1, borderColor: "#2C4A66", borderRadius: 20, paddingHorizontal: 13, paddingVertical: 6, marginRight: 2 },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: "#C7D3E0", fontSize: 12.5, fontWeight: "600" },
  chipTextOn: { color: colors.deep, fontWeight: "800" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  card: { backgroundColor: colors.ink, borderRadius: 14, overflow: "hidden", marginBottom: 14,
    borderWidth: 1, borderColor: "#22405E" },
  imgWrap: { position: "relative" },
  photo: { width: "100%", height: 200, backgroundColor: "#12293F" },
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 92, backgroundColor: "rgba(6,14,24,0.55)" },
  heart: { position: "absolute", top: 10, right: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(6,14,24,0.5)", alignItems: "center", justifyContent: "center" },
  pill: { position: "absolute", top: 12, left: 12, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 11, fontWeight: "800" },
  priceOverlay: { position: "absolute", left: 14, bottom: 12, color: "#fff", fontSize: 19, fontWeight: "800", textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 6 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 8 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: colors.slate, fontSize: 13 },
  emptyTitle: { color: "#fff", fontSize: 17, fontWeight: "700", marginTop: 14 },
  emptySub: { color: colors.slate, fontSize: 13.5, marginTop: 6, textAlign: "center", paddingHorizontal: 30, lineHeight: 20 },
  photoPlaceholder: { alignItems: "center", justifyContent: "center" },
  placeholderText: { color: colors.gold, fontSize: 20, fontWeight: "800", letterSpacing: 3, opacity: 0.5 },
  cardBody: { padding: 14 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#fff", fontSize: 16, fontWeight: "700", flex: 1, marginRight: 8 },
  badge: { color: colors.deep, backgroundColor: colors.gold, fontSize: 11, fontWeight: "800",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, overflow: "hidden" },
  meta: { color: colors.slate, fontSize: 13, marginTop: 5 },
  rent: { color: colors.teal, fontSize: 15, fontWeight: "800", marginTop: 10 },
  status: { color: colors.slate, fontSize: 12, marginTop: 10 },
  errText: { color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "center" },
  errSub: { color: colors.slate, fontSize: 12, marginTop: 6, textAlign: "center" },
  retry: { marginTop: 16, backgroundColor: colors.teal, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: "#fff", fontWeight: "700" },
});
