import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Session } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { appRuntimeConfig } from "../lib/config";
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  isReady: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  accessToken: string | null;
  role: "USER" | "ADMIN" | null;
  usesSupabaseAuth: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<void>;
  continueInDemoMode: () => Promise<void>;
  signOut: () => Promise<void>;
}

const DEMO_USER_STORAGE_KEY = "petfind.demoUserId";

const AuthContext = createContext<AuthState | null>(null);

function getAuthParamsFromUrl(url: string) {
  const params = new URLSearchParams();
  const queryIndex = url.indexOf("?");
  const hashIndex = url.indexOf("#");

  if (queryIndex >= 0) {
    const query = url.slice(queryIndex + 1, hashIndex >= 0 ? hashIndex : undefined);
    for (const [key, value] of new URLSearchParams(query)) {
      params.set(key, value);
    }
  }

  if (hashIndex >= 0) {
    const hash = url.slice(hashIndex + 1);
    for (const [key, value] of new URLSearchParams(hash)) {
      params.set(key, value);
    }
  }

  return params;
}

function sessionToState(session: Session | null) {
  if (!session?.access_token || !session.user?.id) {
    return { userId: null, accessToken: null, role: null };
  }
  return {
    userId: session.user.id,
    accessToken: session.access_token,
    role: (session.user.user_metadata?.role as "USER" | "ADMIN") || "USER"
  };
}

const ADMIN_STORAGE_KEY = "petfind.adminSession";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [role, setRole] = useState<"USER" | "ADMIN" | null>(null);

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

      try {
        const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
          const state = sessionToState(session);

          if (state.userId) {
            // If we have a Supabase user, we MUST ensure the local admin bypass is cleared
            await AsyncStorage.removeItem(ADMIN_STORAGE_KEY).catch(() => { });
            setUserId(state.userId);
            setAccessToken(state.accessToken);
            setRole(state.role);
          } else if (_event === "SIGNED_OUT") {
            // Only clear if we're not currently in a local admin session
            const hasAdmin = await AsyncStorage.getItem(ADMIN_STORAGE_KEY);
            if (!hasAdmin) {
              setUserId(null);
              setAccessToken(null);
              setRole(null);
            }
          }
        });

        const storedAdminStr = await AsyncStorage.getItem(ADMIN_STORAGE_KEY);
        if (storedAdminStr) {
          try {
            const { user, token } = JSON.parse(storedAdminStr);
            setUserId(user.id);
            setAccessToken(token);
            setRole(user.role);
            setIsReady(true);
            // Do not unsubscribe here, onAuthStateChange should remain active
          } catch (e) {
            console.warn("[AuthContext] Error parsing stored admin session, clearing it.", e);
            await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);
          }
        }

        // 5s timeout for session check
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Session check timed out")), 5000)
        );

        const { data } = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: Session | null } };
        const mapped = sessionToState(data.session);
        if (mapped.userId) {
          // Verify we don't have an admin session that would override this
          const hasAdmin = await AsyncStorage.getItem(ADMIN_STORAGE_KEY);
          if (!hasAdmin) {
            setUserId(mapped.userId);
            setAccessToken(mapped.accessToken);
            setRole(mapped.role);
          }
        }

        return () => {
          subscription.subscription.unsubscribe();
        };
      } catch {
        setUserId(null);
        setAccessToken(null);
        setRole(null);
      } finally {
        setIsReady(true);
      }
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
    role,
    usesSupabaseAuth: appRuntimeConfig.usesSupabaseAuth,
    async signInWithEmail(email, password) {
      // Local Admin Bypass
      if (email.toLowerCase() === "admin@admin.com") {
        const response = await fetch(`${appRuntimeConfig.apiUrl}/auth/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Invalid admin credentials");
        }

        const data = await response.json();
        await AsyncStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data));
        setUserId(data.user.id);
        setAccessToken(data.token);
        setRole(data.user.role);
        return;
      }

      // If logging in via Supabase, clear any local admin sessions
      await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);

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
    async signInWithGoogle() {
      if (!supabase) {
        throw new Error("Supabase auth is not configured in this build.");
      }

      await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);

      const redirectTo = Linking.createURL("auth/callback");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: "offline",
            prompt: "consent"
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.url) {
        throw new Error("Google sign-in could not be started.");
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== "success" || !result.url) {
        throw new Error("Google sign-in was cancelled.");
      }

      const params = getAuthParamsFromUrl(result.url);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const authCode = params.get("code");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        if (sessionError) {
          throw sessionError;
        }
        return;
      }

      if (authCode) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
        if (exchangeError) {
          throw exchangeError;
        }
        return;
      }

      throw new Error("Google sign-in completed without a session.");
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
        setRole(null);
        return;
      }
      await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);
      await supabase.auth.signOut();
      setUserId(null);
      setAccessToken(null);
      setRole(null);
    }
  }), [accessToken, isReady, userId, role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
