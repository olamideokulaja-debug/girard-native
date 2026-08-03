// Catches render/lifecycle crashes anywhere below it and shows the real error
// on screen (screenshot it) instead of a blank/crash. Does not catch errors in
// async callbacks — those are handled with try/catch in each screen.
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme";

export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null, stack: "" }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { this.setState({ stack: (info && info.componentStack) || "" }); }
  reset = () => this.setState({ error: null, stack: "" });

  render() {
    if (!this.state.error) return this.props.children;
    const msg = String((this.state.error && (this.state.error.message || this.state.error)) || "Unknown error");
    return (
      <View style={styles.wrap}>
        <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 70, paddingBottom: 40 }}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.sub}>This screen hit an error. Please screenshot this and send it — it names the exact problem.</Text>
          <View style={styles.box}><Text style={styles.err}>{msg}</Text></View>
          {this.state.stack ? (
            <View style={styles.box}><Text style={styles.stack}>{this.state.stack.trim().split("\n").slice(0, 12).join("\n")}</Text></View>
          ) : null}
          <TouchableOpacity style={styles.btn} onPress={this.reset}><Text style={styles.btnText}>Try again</Text></TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.deep },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  sub: { color: colors.slate, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 18 },
  box: { backgroundColor: colors.ink, borderRadius: 10, borderWidth: 1, borderColor: "#22405E", padding: 14, marginBottom: 12 },
  err: { color: "#E9A23B", fontSize: 14, fontWeight: "700", lineHeight: 20 },
  stack: { color: colors.slate, fontSize: 11.5, lineHeight: 17, fontFamily: "monospace" },
  btn: { backgroundColor: colors.teal, borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
