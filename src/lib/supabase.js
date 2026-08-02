// Supabase client for the native Girard app.
// This connects the app to your EXISTING Girard database and logins —
// the same backend the website uses. Nothing is duplicated server-side.
//
// The anon key below is the PUBLIC key. It is designed to ship inside apps
// and is safe to commit. Never put the "service_role" secret key here.
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qphpdczthyuzrfurimeh.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwaHBkY3p0aHl1enJmdXJpbWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMDA3OTQsImV4cCI6MjA5ODU3Njc5NH0.0a2972BZy5aaAvUGaAY6PdyV5H-d_CAZdUaJl-J13l0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,      // keeps the user logged in between app opens
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // required for React Native
  },
});
