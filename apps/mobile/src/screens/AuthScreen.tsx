import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import { AppButton, AppCard, AppInput, colors } from "../components/ui";

const emailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const phoneSchema = z.object({
  phone: z.string().min(8),
  token: z.string().optional()
});

export function AuthScreen() {
  const auth = useAuth();
  const [mode, setMode] = useState<"EMAIL" | "PHONE">("EMAIL");
  const [isSignUp, setIsSignUp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "", password: "" }
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "", token: "" }
  });

  async function onSubmitEmail(values: z.infer<typeof emailSchema>) {
    setLoading(true);
    try {
      if (isSignUp) {
        await auth.signUpWithEmail(values.email, values.password);
        Alert.alert("Check your inbox", "Sign-up succeeded. Use email confirmation if enabled.");
      } else {
        await auth.signInWithEmail(values.email, values.password);
      }
    } catch (error) {
      Alert.alert("Auth failed", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitPhone(values: z.infer<typeof phoneSchema>) {
    setLoading(true);
    try {
      if (!otpSent) {
        await auth.signInWithPhoneOtp(values.phone);
        setOtpSent(true);
        Alert.alert("OTP sent", "Enter the verification code from SMS.");
      } else {
        await auth.verifyPhoneOtp(values.phone, values.token ?? "");
      }
    } catch (error) {
      Alert.alert("Auth failed", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to PetFind</Text>
      <Text style={styles.subtitle}>Sign in with email/password or phone OTP.</Text>

      <View style={styles.modeRow}>
        <AppButton label="Email" tone={mode === "EMAIL" ? "primary" : "secondary"} onPress={() => setMode("EMAIL")} />
        <AppButton label="Phone OTP" tone={mode === "PHONE" ? "primary" : "secondary"} onPress={() => setMode("PHONE")} />
      </View>

      {mode === "EMAIL" ? (
        <AppCard>
          <Controller
            control={emailForm.control}
            name="email"
            render={({ field, fieldState }) => (
              <AppInput
                label="Email"
                value={field.value}
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={emailForm.control}
            name="password"
            render={({ field, fieldState }) => (
              <AppInput
                label="Password"
                value={field.value}
                secureTextEntry
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <AppButton
            label={isSignUp ? "Create Account" : "Sign In"}
            loading={loading}
            onPress={emailForm.handleSubmit(onSubmitEmail)}
          />
          <AppButton
            label={isSignUp ? "Have account? Sign In" : "Need account? Sign Up"}
            tone="secondary"
            onPress={() => setIsSignUp((value) => !value)}
          />
        </AppCard>
      ) : (
        <AppCard>
          <Controller
            control={phoneForm.control}
            name="phone"
            render={({ field, fieldState }) => (
              <AppInput
                label="Phone (+country code)"
                value={field.value}
                keyboardType="phone-pad"
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          {otpSent ? (
            <Controller
              control={phoneForm.control}
              name="token"
              render={({ field }) => (
                <AppInput
                  label="OTP Code"
                  value={field.value}
                  keyboardType="number-pad"
                  onChangeText={field.onChange}
                />
              )}
            />
          ) : null}
          <AppButton
            label={otpSent ? "Verify OTP" : "Send OTP"}
            loading={loading}
            onPress={phoneForm.handleSubmit(onSubmitPhone)}
          />
        </AppCard>
      )}

      {!auth.usesSupabaseAuth ? (
        <AppCard>
          <Text style={styles.demoText}>
            Supabase keys are not configured. Demo mode is enabled for local development.
          </Text>
          <AppButton label="Continue in demo mode" onPress={() => auth.continueInDemoMode()} />
        </AppCard>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 16,
    gap: 14,
    justifyContent: "center"
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text
  },
  subtitle: {
    color: colors.muted,
    marginBottom: 4
  },
  modeRow: {
    flexDirection: "row",
    gap: 8
  },
  demoText: {
    color: colors.muted,
    lineHeight: 19
  }
});
