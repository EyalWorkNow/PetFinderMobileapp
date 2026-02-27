import { createClient } from "@supabase/supabase-js";
import { appRuntimeConfig } from "./config";

export const supabase = appRuntimeConfig.usesSupabaseAuth
  ? createClient(appRuntimeConfig.supabaseUrl, appRuntimeConfig.supabaseAnonKey)
  : null;
