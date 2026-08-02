import React, { useState } from "react";
import {
  View, Text, Image, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";

export default function SignInScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signIn = async () => {
    setError("");
    if (!email || !password) { setError("Enter your email and password."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setError(error.message);
    // On success, App.js sees the session change and shows Home automatically.
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.deep }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 40 }]} keyboardShouldPersistTaps="handled">
        <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brand}>GIRARD PROPERTY</Text>
        <Text style={styles.brandSub}>ESTATE LIMITED</Text>
        <Text style={styles.h1}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to your Girard account.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail}
          autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com"
          placeholderTextColor={colors.slate} />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword}
          secureTextEntry placeholder="Your password" placeholderTextColor={colors.slate} />

        <TouchableOpacity style={styles.btn} onPress={signIn} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign in</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("SignUp")} style={{ marginTop: 22 }}>
          <Text style={styles.link}>New to Girard? <Text style={{ color: colors.gold }}>Create an account</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 26, paddingBottom: 60 },
  logo: { width: 120, height: 120, alignSelf: "center", marginBottom: 14 },
  brand: { color: colors.gold, fontSize: 20, fontWeight: "800", letterSpacing: 3, textAlign: "center" },
  brandSub: { color: colors.gold, fontSize: 11, letterSpacing: 5, marginBottom: 40, textAlign: "center", opacity: 0.9 },
  h1: { color: "#fff", fontSize: 28, fontWeight: "800", marginBottom: 6 },
  sub: { color: colors.slate, fontSize: 14, marginBottom: 26 },
  label: { color: "#C7D3E0", fontSize: 13, marginBottom: 7, marginTop: 14, fontWeight: "600" },
  input: { backgroundColor: "#16324F", color: "#fff", borderRadius: 11, paddingHorizontal: 15, paddingVertical: 14, fontSize: 15, borderWidth: 1, borderColor: "#22405E" },
  btn: { backgroundColor: colors.teal, borderRadius: 11, paddingVertical: 15, alignItems: "center", marginTop: 28 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  link: { color: "#C7D3E0", fontSize: 14, textAlign: "center" },
  error: { color: "#FF8A80", fontSize: 13, marginBottom: 8 },
});
