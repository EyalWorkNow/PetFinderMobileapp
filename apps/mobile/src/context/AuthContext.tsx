import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { appRuntimeConfig } from "../lib/config";
import { supabase } from "../lib/supabase";

interface AuthState {
  isReady: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  accessToken: string | null;
  usesSupabaseAuth: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<void>;
  continueInDemoMode: () => Promise<void>;
  signOut: () => Promise<void>;
}

const DEMO_USER_STORAGE_KEY = "petfind.demoUserId";

const AuthContext = createContext<AuthState | null>(null);

function sessionToState(session: Session | null) {
  if (!session?.access_token || !session.user?.id) {
    return { userId: null, accessToken: null };
  }
  return {
    userId: session.user.id,
    accessToken: session.access_token
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    async function bootstrap() {
      if (!appRuntimeConfig.usesSupabaseAuth || !supabase) {
        const storedDemoUser = (await AsyncStorage.getItem(DEMO_USER_STORAGE_KEY)) ?? "demo-mobile-user";
        await AsyncStorage.setItem(DEMO_USER_STORAGE_KEY, storedDemoUser);
        setUserId(storedDemoUser);
        setAccessToken(null);
        setIsReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const mapped = sessionToState(data.session);
      setUserId(mapped.userId);
      setAccessToken(mapped.accessToken);
      setIsReady(true);

      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
        const state = sessionToState(session);
        setUserId(state.userId);
        setAccessToken(state.accessToken);
      });

      return () => subscription.subscription.unsubscribe();
    }

    const cleanupPromise = bootstrap();
    return () => {
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, []);

  const value = useMemo<AuthState>(() => ({
    isReady,
    isAuthenticated: Boolean(userId),
    userId,
    accessToken,
    usesSupabaseAuth: appRuntimeConfig.usesSupabaseAuth,
    async signInWithEmail(email, password) {
      if (!supabase) {
        throw new Error("Supabase auth is not configured in this build.");
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
    },
    async signUpWithEmail(email, password) {
      if (!supabase) {
        throw new Error("Supabase auth is not configured in this build.");
      }
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        throw error;
      }
    },
    async signInWithPhoneOtp(phone) {
      if (!supabase) {
        throw new Error("Supabase auth is not configured in this build.");
      }
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) {
        throw error;
      }
    },
    async verifyPhoneOtp(phone, token) {
      if (!supabase) {
        throw new Error("Supabase auth is not configured in this build.");
      }
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms"
      });
      if (error) {
        throw error;
      }
    },
    async continueInDemoMode() {
      const demoUser = "demo-mobile-user";
      await AsyncStorage.setItem(DEMO_USER_STORAGE_KEY, demoUser);
      setUserId(demoUser);
      setAccessToken(null);
    },
    async signOut() {
      if (!appRuntimeConfig.usesSupabaseAuth || !supabase) {
        await AsyncStorage.removeItem(DEMO_USER_STORAGE_KEY);
        setUserId(null);
        return;
      }
      await supabase.auth.signOut();
    }
  }), [accessToken, isReady, userId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
