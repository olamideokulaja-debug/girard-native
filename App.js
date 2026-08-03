// Girard — native app root.
// Decides what to show based on whether the user is logged in:
//   not logged in  -> Sign In / Sign Up (native screens)
//   logged in      -> Home (placeholder for now; real screens come next)
import "react-native-url-polyfill/auto";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, AppState } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./src/lib/supabase";
import { colors } from "./src/theme";
import SignInScreen from "./src/screens/SignInScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import ListingsScreen from "./src/screens/ListingsScreen";
import PropertyDetailScreen from "./src/screens/PropertyDetailScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import MyListingsScreen from "./src/screens/MyListingsScreen";
import LockScreen from "./src/screens/LockScreen";
import MessagesScreen from "./src/screens/MessagesScreen";
import { isBioEnabled } from "./src/lib/lock";
import { registerForPush } from "./src/lib/push";

const Stack = createNativeStackNavigator();

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
    config: { screens: { Listings: "", PropertyDetail: "property/:id", Profile: "account", MyListings: "my-listings", Messages: "messages" } },
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {session ? (
            <>
              <Stack.Screen name="Listings" component={ListingsScreen} />
              <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="MyListings" component={MyListingsScreen} />
              <Stack.Screen name="Messages" component={MessagesScreen} />
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
