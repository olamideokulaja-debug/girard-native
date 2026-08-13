// Girard — native app root.
//   not logged in -> Sign In / Sign Up
//   logged in     -> bottom tabs (Home / Browse / Messages / Account),
//                    with Property detail + My listings stacked over them.
import "react-native-url-polyfill/auto";
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, AppState } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./src/lib/supabase";
import { colors } from "./src/theme";
import SignInScreen from "./src/screens/SignInScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import ListingsScreen from "./src/screens/ListingsScreen";
import PropertyDetailScreen from "./src/screens/PropertyDetailScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import MyListingsScreen from "./src/screens/MyListingsScreen";
import AddPropertyScreen from "./src/screens/AddPropertyScreen";
import EnquiriesScreen from "./src/screens/EnquiriesScreen";
import EarningsScreen from "./src/screens/EarningsScreen";
import SwapScreen from "./src/screens/SwapScreen";
import LockScreen from "./src/screens/LockScreen";
import MessagesScreen from "./src/screens/MessagesScreen";
import { isBioEnabled } from "./src/lib/lock";
import { registerForPush } from "./src/lib/push";
import ErrorBoundary from "./src/components/ErrorBoundary";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = { Home: "home", Browse: "search", Messages: "chatbubble-ellipses", Account: "person" };

/* What a signed-out visitor sees: the listings, and an invitation to join.
   Everything that genuinely needs an identity (paying, messaging, saving,
   listing a property) still asks them to sign in first. */
function GuestAccountScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.deep, alignItems: "center", justifyContent: "center", padding: 32 }}>
      <Ionicons name="person-circle-outline" size={64} color={colors.gold} />
      <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 18, textAlign: "center" }}>Create your Girard account</Text>
      <Text style={{ color: colors.slate, fontSize: 15, lineHeight: 23, textAlign: "center", marginTop: 10, maxWidth: 420 }}>
        Browsing is open to everyone. Sign in to save properties, message the Girard team, pay rent and manage a tenancy.
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate("SignUp")}
        style={{ backgroundColor: colors.teal, borderRadius: 12, paddingVertical: 15, paddingHorizontal: 40, marginTop: 26, minWidth: 240, alignItems: "center" }}>
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>Create account</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("SignIn")} style={{ marginTop: 16 }}>
        <Text style={{ color: colors.gold, fontSize: 15, fontWeight: "700" }}>I already have an account</Text>
      </TouchableOpacity>
    </View>
  );
}

function GuestTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      initialRouteName="Browse"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.ink, borderTopColor: "#22405E", borderTopWidth: 1, height: 60 + insets.bottom, paddingBottom: 8 + insets.bottom, paddingTop: 6 },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.slate,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarIcon: ({ color, size }) => <Ionicons name={TAB_ICONS[route.name] || "ellipse"} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Browse" component={ListingsScreen} />
      <Tab.Screen name="Account" component={GuestAccountScreen} />
    </Tab.Navigator>
  );
}

function Tabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.ink, borderTopColor: "#22405E", borderTopWidth: 1, height: 60 + insets.bottom, paddingBottom: 8 + insets.bottom, paddingTop: 8 },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.slate,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarIcon: ({ color, size }) => <Ionicons name={TAB_ICONS[route.name] || "ellipse"} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Browse" component={ListingsScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Account" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppInner() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(null);
  const [bioEnabled, setBioEnabled_] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("girard_onboarded").then(v => setOnboarded(!!v)).catch(() => setOnboarded(true));
    isBioEnabled().then(on => { setBioEnabled_(on); if (on) setLocked(true); }).catch(() => {});
    const appSub = AppState.addEventListener("change", (st) => {
      if (st === "active") isBioEnabled().then(on => { setBioEnabled_(on); if (on) setLocked(true); }).catch(() => {});
    });
    // The launch gate must ALWAYS resolve. If getSession rejects or never
    // settles (cold keychain, offline, slow network) the app used to sit on
    // the spinner forever, which is what App Review saw as a blank page.
    let settled = false;
    const finish = (sess) => {
      if (settled) return;
      settled = true;
      setSession(sess || null);
      setLoading(false);
      if (sess) { try { registerForPush(); } catch (e) {} }
    };
    const timeout = setTimeout(() => finish(null), 8000);
    supabase.auth.getSession()
      .then(({ data }) => finish(data && data.session))
      .catch(() => finish(null))
      .finally(() => clearTimeout(timeout));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) { try { registerForPush(); } catch (e) {} }
    });
    return () => { clearTimeout(timeout); sub.subscription.unsubscribe(); appSub.remove(); };
  }, []);

  if (loading || onboarded === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.deep, alignItems: "center", justifyContent: "center", padding: 30 }}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={{ color: colors.slate, marginTop: 16, fontSize: 14, fontWeight: "600" }}>Starting Girard</Text>
      </View>
    );
  }

  if (!onboarded && !session) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ErrorBoundary><OnboardingScreen onDone={() => { AsyncStorage.setItem("girard_onboarded", "1"); setOnboarded(true); }} /></ErrorBoundary>
      </SafeAreaProvider>
    );
  }

  if (session && bioEnabled && locked) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ErrorBoundary><LockScreen onUnlock={() => setLocked(false)} /></ErrorBoundary>
      </SafeAreaProvider>
    );
  }

  const linking = {
    prefixes: ["girard://", "https://girardpropertylimited.com"],
    config: {
      screens: {
        Tabs: { screens: { Home: "", Browse: "browse", Messages: "messages", Account: "account" } },
        PropertyDetail: "property/:id",
        MyListings: "my-listings",
      },
    },
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ErrorBoundary>
      <NavigationContainer linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {session ? (
            <>
              <Stack.Screen name="Tabs" component={Tabs} />
              <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
              <Stack.Screen name="MyListings" component={MyListingsScreen} />
              <Stack.Screen name="AddProperty" component={AddPropertyScreen} />
              <Stack.Screen name="Enquiries" component={EnquiriesScreen} />
              <Stack.Screen name="Earnings" component={EarningsScreen} />
              <Stack.Screen name="Swap" component={SwapScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="GuestTabs" component={GuestTabs} />
              <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
              <Stack.Screen name="SignIn" component={SignInScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

// Wrap the ENTIRE app, including the launch gate. Without this, anything that
// throws during first render produced a blank screen with no error at all.
export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
