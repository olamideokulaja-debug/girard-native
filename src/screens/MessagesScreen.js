// Tenant <-> Girard chat. Uses the same "messages" table the website admin uses:
// { id, tenant (email = thread key), sender ("tenant"|"girard"), body, created_at }.
import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

export default function MessagesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const listRef = useRef(null);

  const load = useCallback(async (em) => {
    const e = em || email;
    if (!e) return;
    const { data } = await supabase.from("messages").select("*").eq("tenant", e).order("created_at", { ascending: true });
    if (data) setMsgs(data);
  }, [email]);

  useEffect(() => {
    let channel;
    supabase.auth.getUser().then(({ data }) => {
      const e = (data && data.user && data.user.email) || "";
      setEmail(e); load(e);
      channel = supabase.channel("msgs-" + e)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "tenant=eq." + e }, (payload) => {
          setMsgs(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
        }).subscribe();
    });
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { const un = navigation.addListener("focus", () => load()); return un; }, [navigation, load]);

  const send = async () => {
    const body = text.trim();
    if (!body || !email) return;
    setText("");
    const row = { id: "MSG-" + Date.now(), tenant: email, sender: "tenant", body };
    setMsgs(prev => [...prev, { ...row, created_at: new Date().toISOString() }]);
    try { await supabase.from("messages").insert([row]); } catch (e) {}
  };

  const Bubble = ({ m }) => {
    const mine = m.sender === "tenant";
    return (
      <View style={[styles.row, { justifyContent: mine ? "flex-end" : "flex-start" }]}>
        <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
          {!mine ? <Text style={styles.who}>Girard</Text> : null}
          <Text style={[styles.body, mine && { color: "#fff" }]}>{m.body}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>{"\u2039  Back"}</Text></TouchableOpacity>
        <Text style={styles.hTitle}>Messages</Text>
        <View style={{ width: 60 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={80}>
        <FlatList ref={listRef} data={msgs} keyExtractor={(m, i) => m.id || String(i)}
          renderItem={({ item }) => <Bubble m={item} />}
          contentContainerStyle={{ padding: 14, paddingBottom: 20 }}
          onContentSizeChange={() => { if (listRef.current && msgs.length) listRef.current.scrollToEnd({ animated: true }); }}
          ListEmptyComponent={<Text style={styles.empty}>Start a conversation with the Girard team. We usually reply within a day.</Text>} />
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Message Girard\u2026" placeholderTextColor={colors.slate} multiline />
          <TouchableOpacity style={styles.sendBtn} onPress={send}><Text style={styles.sendText}>Send</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.deep },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingBottom: 14, backgroundColor: colors.ink },
  back: { color: "#C7D3E0", fontSize: 14, fontWeight: "600", width: 60 },
  hTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  row: { flexDirection: "row", marginBottom: 10 },
  bubble: { maxWidth: "80%", borderRadius: 14, paddingHorizontal: 13, paddingVertical: 9 },
  mine: { backgroundColor: colors.teal, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.ink, borderWidth: 1, borderColor: "#22405E", borderBottomLeftRadius: 4 },
  who: { color: colors.gold, fontSize: 11, fontWeight: "800", marginBottom: 3 },
  body: { color: "#E7EEF5", fontSize: 14.5, lineHeight: 20 },
  empty: { color: colors.slate, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 60, paddingHorizontal: 30 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", padding: 10, backgroundColor: colors.ink, borderTopWidth: 1, borderTopColor: "#22405E" },
  input: { flex: 1, color: "#fff", backgroundColor: colors.deep, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 110, borderWidth: 1, borderColor: "#22405E", fontSize: 14.5 },
  sendBtn: { backgroundColor: colors.gold, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 11, marginLeft: 8 },
  sendText: { color: colors.deep, fontWeight: "800", fontSize: 14 },
});
