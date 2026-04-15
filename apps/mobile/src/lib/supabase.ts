import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { appRuntimeConfig } from "./config";

export const supabase = appRuntimeConfig.usesSupabaseAuth
  ? createClient(appRuntimeConfig.supabaseUrl, appRuntimeConfig.supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  })
  : null;
