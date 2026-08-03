// Add Property (landlord) — create a listing from the phone. It saves as
// "Pending Verification" for admin approval. Photos upload to the property-photos
// bucket (best-effort: the listing is created even if a photo fails; photos can
// also be added later on the website).
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

const TYPES = ["Apartment", "Flat", "Studio", "Terrace", "Duplex", "Detached", "Land", "Office"];
const AMENITIES = ["Elevator", "Borehole", "24/7 Power", "Parking", "Security", "Swimming pool", "Gym", "WiFi", "Air conditioning", "BQ"];

export default function AddPropertyScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [intent, setIntent] = useState("To let");
  const [letType, setLetType] = useState("Long let");
  const [type, setType] = useState("Apartment");
  const [beds, setBeds] = useState("2");
  const [area, setArea] = useState("");
  const [rent, setRent] = useState("");
  const [nightly, setNightly] = useState("");
  const [minNights, setMinNights] = useState("2");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isShortLet = intent === "To let" && letType === "Short let";

  const uploadOne = async (uri) => {
    try {
      const resp = await fetch(uri); const blob = await resp.blob();
      const path = "listings/" + Date.now() + "-" + Math.random().toString(36).slice(2) + ".jpg";
      const { error } = await supabase.storage.from("property-photos").upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });
      if (error) return null;
      const { data } = supabase.storage.from("property-photos").getPublicUrl(path);
      return data && data.publicUrl;
    } catch (e) { return null; }
  };

  const addPhotos = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert("Permission needed", "Allow photo access to add pictures."); return; }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, allowsMultipleSelection: true, selectionLimit: 6 });
      if (res.canceled) return;
      setUploading(true);
      for (const a of res.assets || []) {
        if (photos.length >= 6) break;
        const url = await uploadOne(a.uri);
        if (url) setPhotos(prev => [...prev, url]);
      }
      setUploading(false);
    } catch (e) { setUploading(false); Alert.alert("Photo error", "Couldn't add that photo. You can add photos on the website too."); }
  };

  const toggleAmenity = (a) => setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const save = async () => {
    if (!area.trim()) { Alert.alert("Area needed", "Enter the area (e.g. Lekki)."); return; }
    if (!isShortLet && intent === "To let" && !rent.trim()) { Alert.alert("Rent needed", "Enter the annual rent."); return; }
    if (isShortLet && !nightly.trim()) { Alert.alert("Nightly price needed", "Enter the price per night."); return; }
    if (intent === "For sale" && !rent.trim()) { Alert.alert("Price needed", "Enter the sale price."); return; }
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const email = (u && u.user && u.user.email) || "";
      const title = (beds === "0" ? "Studio " : beds + "-Bed ") + type;
      const data = {
        title, area: area.trim(), type, beds: Number(beds) || 0,
        rent: Number((isShortLet ? nightly : rent).replace(/[^0-9]/g, "")) || 0,
        intent, letType: intent === "To let" ? letType : undefined,
        ...(isShortLet ? { nightly: Number(nightly.replace(/[^0-9]/g, "")) || 0, minNights: Number(minNights) || 1 } : {}),
        address: address.trim(), description: description.trim(),
        amenities, photos, verified: false, owner_email: email,
      };
      const id = "PR-" + Date.now().toString().slice(-9);
      const { error } = await supabase.from("properties").insert({ id, owner_email: email, status: "Pending Verification", data });
      if (error) throw error;
      Alert.alert("Submitted", "Your listing has been submitted for verification. You'll see it under My listings.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert("Couldn't submit", String((e && e.message) || e));
    }
    setSaving(false);
  };

  const Chip = ({ label, active, onPress }) => (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
  const Field = ({ label, ...rest }) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.slate} {...rest} />
    </View>
  );

  return (
    <View style={styles.wrap}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>{"\u2039  Back"}</Text></TouchableOpacity>
        <Text style={styles.hTitle}>Add property</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 30 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Listing type</Text>
        <View style={styles.chipRow}>
          {["To let", "For sale"].map(x => <Chip key={x} label={x} active={intent === x} onPress={() => setIntent(x)} />)}
        </View>
        {intent === "To let" ? (
          <View style={styles.chipRow}>
            {["Long let", "Short let"].map(x => <Chip key={x} label={x} active={letType === x} onPress={() => setLetType(x)} />)}
          </View>
        ) : null}

        <Text style={[styles.label, { marginTop: 8 }]}>Property type</Text>
        <View style={styles.chipRow}>{TYPES.map(t => <Chip key={t} label={t} active={type === t} onPress={() => setType(t)} />)}</View>

        <Text style={[styles.label, { marginTop: 8 }]}>Bedrooms</Text>
        <View style={styles.chipRow}>{["0", "1", "2", "3", "4", "5"].map(b => <Chip key={b} label={b === "0" ? "Studio" : b} active={beds === b} onPress={() => setBeds(b)} />)}</View>

        <View style={{ height: 10 }} />
        <Field label="Area" value={area} onChangeText={setArea} placeholder="e.g. Lekki Phase 1" />
        {isShortLet ? (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}><Field label="Price / night (₦)" value={nightly} onChangeText={t => setNightly(t.replace(/[^0-9]/g, ""))} keyboardType="number-pad" placeholder="85000" /></View>
            <View style={{ flex: 1 }}><Field label="Min nights" value={minNights} onChangeText={t => setMinNights(t.replace(/[^0-9]/g, ""))} keyboardType="number-pad" placeholder="2" /></View>
          </View>
        ) : (
          <Field label={intent === "For sale" ? "Sale price (\u20a6)" : "Annual rent (\u20a6)"} value={rent} onChangeText={t => setRent(t.replace(/[^0-9]/g, ""))} keyboardType="number-pad" placeholder="9500000" />
        )}
        <Field label="Address" value={address} onChangeText={setAddress} placeholder="Street / building" />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Describe the property" multiline />

        <Text style={styles.label}>Amenities</Text>
        <View style={styles.chipRow}>{AMENITIES.map(a => <Chip key={a} label={a} active={amenities.includes(a)} onPress={() => toggleAmenity(a)} />)}</View>

        <Text style={[styles.label, { marginTop: 14 }]}>Photos {photos.length ? "(" + photos.length + ")" : ""}</Text>
        <View style={styles.photoRow}>
          {photos.map((u, i) => <Image key={i} source={{ uri: u }} style={styles.thumb} />)}
          {photos.length < 6 ? (
            <TouchableOpacity style={styles.addPhoto} onPress={addPhotos} disabled={uploading}>
              {uploading ? <ActivityIndicator color={colors.gold} /> : <Text style={styles.addPhotoText}>+</Text>}
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={[styles.submit, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
          <Text style={styles.submitText}>{saving ? "Submitting\u2026" : "Submit for verification"}</Text>
        </TouchableOpacity>
        <Text style={styles.note}>Listings are reviewed before going live. You can manage them under My listings.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.deep },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingBottom: 14, backgroundColor: colors.ink },
  back: { color: "#C7D3E0", fontSize: 14, fontWeight: "600", width: 60 },
  hTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  label: { color: colors.slate, fontSize: 12.5, fontWeight: "700", marginBottom: 8, letterSpacing: 0.3 },
  input: { backgroundColor: colors.ink, color: "#fff", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, borderWidth: 1, borderColor: "#22405E" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: { borderWidth: 1, borderColor: "#2C4A66", borderRadius: 20, paddingHorizontal: 13, paddingVertical: 7 },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: "#C7D3E0", fontSize: 13, fontWeight: "600" },
  chipTextOn: { color: colors.deep, fontWeight: "800" },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  thumb: { width: 70, height: 70, borderRadius: 8 },
  addPhoto: { width: 70, height: 70, borderRadius: 8, borderWidth: 1, borderColor: "#2C4A66", borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  addPhotoText: { color: colors.gold, fontSize: 30, fontWeight: "300" },
  submit: { backgroundColor: colors.teal, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 22 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  note: { color: colors.slate, fontSize: 12.5, textAlign: "center", marginTop: 12, lineHeight: 18 },
});
