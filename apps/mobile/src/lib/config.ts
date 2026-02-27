import Constants from "expo-constants";

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const appRuntimeConfig = {
  apiUrl,
  supabaseUrl,
  supabaseAnonKey,
  usesSupabaseAuth: Boolean(supabaseUrl && supabaseAnonKey),
  googlePlacesApiKey: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? "",
  appVersion: Constants.expoConfig?.version ?? "dev"
};
