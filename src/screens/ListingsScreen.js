// Browse listings — native property feed reading your real `properties` table.
// Mirrors the website's rowToProp: spread row.data, then id + status on top.
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

const money = (n) => "₦" + Number(n || 0).toLocaleString();

function rowToProp(r) {
  return { ...(r.data || {}), id: r.id, status: r.status, girardManaged: !!r.girard_managed };
}

function firstPhoto(p) {
  const ph = p.photos;
  if (Array.isArray(ph) && ph.length) {
    const f = ph[0];
    if (typeof f === "string" && f.startsWith("http")) return f;
    if (f && typeof f === "object" && typeof f.url === "string") return f.url;
  }
  return null;
}

export default function ListingsScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) { setError(error.message); setItems([]); }
    else setItems((data || []).map(rowToProp));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const renderItem = ({ item }) => {
    const photo = firstPhoto(item);
    const verified = item.status && item.status !== "Pending Verification";
    return (
      <TouchableOpacity activeOpacity={0.85} style={styles.card}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.placeholderText}>GIRARD</Text>
          </View>
        )}
        <View style={styles.cardBody}>
          <View style={styles.rowBetween}>
            <Text style={styles.title} numberOfLines={1}>{item.title || "Untitled property"}</Text>
            {verified ? <Text style={styles.badge}>Verified</Text> : null}
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {[item.area, item.type, item.beds ? item.beds + " bed" : null].filter(Boolean).join("  ·  ")}
          </Text>
          <View style={styles.rowBetween}>
            <Text style={styles.rent}>{item.rent ? money(item.rent) + " / yr" : "Price on request"}</Text>
            {item.status ? <Text style={styles.status}>{item.status}</Text> : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.brand}>GIRARD</Text>
          <Text style={styles.brandSub}>Browse verified property</Text>
        </View>
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <Text style={styles.signout}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.gold} /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errText}>Couldn't load listings.</Text>
          <Text style={styles.errSub}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={load}><Text style={styles.retryText}>Try again</Text></TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}><Text style={styles.errText}>No listings yet.</Text></View>
      ) : (
        <FlatList
          data={items}
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
  brand: { color: colors.gold, fontSize: 22, fontWeight: "800", letterSpacing: 2 },
  brandSub: { color: colors.slate, fontSize: 12, marginTop: 2 },
  signout: { color: "#C7D3E0", fontSize: 13, fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  card: { backgroundColor: colors.ink, borderRadius: 14, overflow: "hidden", marginBottom: 14,
    borderWidth: 1, borderColor: "#22405E" },
  photo: { width: "100%", height: 180, backgroundColor: "#12293F" },
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
