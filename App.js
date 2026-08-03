// Girard — native app root.
//   not logged in -> Sign In / Sign Up
//   logged in     -> bottom tabs (Home / Browse / Messages / Account),
//                    with Property detail + My listings stacked over them.
import "react-native-url-polyfill/auto";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, AppState } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
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
import LockScreen from "./src/screens/LockScreen";
import MessagesScreen from "./src/screens/MessagesScreen";
import { isBioEnabled } from "./src/lib/lock";
import { registerForPush } from "./src/lib/push";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = { Home: "home", Browse: "search", Messages: "chatbubble-ellipses", Account: "person" };

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.ink, borderTopColor: "#22405E", borderTopWidth: 1, height: 62, paddingBottom: 8, paddingTop: 6 },
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

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(null);
  const [bioEnabled, setBioEnabled_] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("girard_onboarded").then(v => setOnboarded(!!v)).catch(() => setOnboarded(true));
    isBioEnabled().then(on => { setBioEnabled_(on); if (on) setLocked(true); });
    const appSub = AppState.addEventListener("change", (st) => {
      if (st === "active") isBioEnabled().then(on => { setBioEnabled_(on); if (on) setLocked(true); });
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session) registerForPush();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) registerForPush();
    });
    return () => { sub.subscription.unsubscribe(); appSub.remove(); };
  }, []);

  if (loading || onboarded === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.deep, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (!onboarded && !session) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <OnboardingScreen onDone={() => { AsyncStorage.setItem("girard_onboarded", "1"); setOnboarded(true); }} />
      </SafeAreaProvider>
    );
  }

  if (session && bioEnabled && locked) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LockScreen onUnlock={() => setLocked(false)} />
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
            </>
          ) : (
            <>
              <Stack.Screen name="SignIn" component={SignInScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
