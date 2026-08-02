import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

export default function SignUpScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const signUp = async () => {
    setError(""); setNotice("");
    if (!name || !email || !password) { setError("Please fill in every field."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim(), role: "tenant" } },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) return; // logged straight in -> App.js shows Home
    setNotice("Account created. Please check your email to confirm, then sign in.");
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.deep }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 30 }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>GIRARD</Text>
        <Text style={styles.brandSub}>PROPERTY LIMITED</Text>
        <Text style={styles.h1}>Create your account</Text>
        <Text style={styles.sub}>Join Girard to browse and manage verified property.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <Text style={styles.label}>Full name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName}
          placeholder="Your name" placeholderTextColor={colors.slate} />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail}
          autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com"
          placeholderTextColor={colors.slate} />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword}
          secureTextEntry placeholder="At least 6 characters" placeholderTextColor={colors.slate} />

        <TouchableOpacity style={styles.btn} onPress={signUp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("SignIn")} style={{ marginTop: 22 }}>
          <Text style={styles.link}>Already have an account? <Text style={{ color: colors.gold }}>Sign in</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 26, paddingBottom: 60 },
  brand: { color: colors.gold, fontSize: 26, fontWeight: "800", letterSpacing: 2 },
  brandSub: { color: colors.slate, fontSize: 11, letterSpacing: 4, marginBottom: 30 },
  h1: { color: "#fff", fontSize: 28, fontWeight: "800", marginBottom: 6 },
  sub: { color: colors.slate, fontSize: 14, marginBottom: 20 },
  label: { color: "#C7D3E0", fontSize: 13, marginBottom: 7, marginTop: 12, fontWeight: "600" },
  input: { backgroundColor: "#16324F", color: "#fff", borderRadius: 11, paddingHorizontal: 15, paddingVertical: 14, fontSize: 15, borderWidth: 1, borderColor: "#22405E" },
  btn: { backgroundColor: colors.teal, borderRadius: 11, paddingVertical: 15, alignItems: "center", marginTop: 26 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  link: { color: "#C7D3E0", fontSize: 14, textAlign: "center" },
  error: { color: "#FF8A80", fontSize: 13, marginBottom: 8 },
  notice: { color: colors.gold, fontSize: 13, marginBottom: 8 },
});
