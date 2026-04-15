import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  Pressable
} from "react-native";
import * as Haptics from "expo-haptics";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import { AppButton, AppCard, AppInput, useThemeColors } from "../components/ui";
import { LinearGradient } from "expo-linear-gradient";
import { Sms, Lock, Call, ShieldTick } from "iconsax-react-native";
import { useTranslation } from "../i18n/useTranslation";
import { AppLogo } from "../components/ui/AppLogo";

const { width } = Dimensions.get("window");

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

const phoneSchema = z.object({
  phone: z.string().min(8, "Please enter a valid phone number"),
  token: z.string().optional()
});

export function AuthScreen() {
  const auth = useAuth();
  const theme = useThemeColors();
  const { t } = useTranslation();
  const [mode, setMode] = useState<"EMAIL" | "PHONE">("EMAIL");
  const [isSignUp, setIsSignUp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const segmentedAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse logo animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1, duration: 1500, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const switchMode = (newMode: "EMAIL" | "PHONE") => {
    if (mode === newMode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(segmentedAnim, { toValue: newMode === "EMAIL" ? 0 : 1, duration: 300, useNativeDriver: true })
    ]).start(() => {
      setMode(newMode);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "", password: "" }
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "", token: "" }
  });

  async function onSubmitEmail(values: z.infer<typeof emailSchema>) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    setLoading(true);
    try {
      if (isSignUp) {
        await auth.signUpWithEmail(values.email, values.password);
        Alert.alert("Success!", "Account created. Please check your email for confirmation.");
      } else {
        await auth.signInWithEmail(values.email, values.password);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
      Alert.alert("Authentication Error", error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitPhone(values: z.infer<typeof phoneSchema>) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    setLoading(true);
    try {
      if (!otpSent) {
        await auth.signInWithPhoneOtp(values.phone);
        setOtpSent(true);
        Alert.alert("Code Sent", "Check your messages for the verification code.");
      } else {
        await auth.verifyPhoneOtp(values.phone, values.token ?? "");
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
      Alert.alert("Authentication Error", error instanceof Error ? error.message : "Invalid code or phone number");
    } finally {
      setLoading(false);
    }
  }

  async function onGooglePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    setLoading(true);
    try {
      await auth.signInWithGoogle();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
      Alert.alert("Google Authentication Error", error instanceof Error ? error.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  const indicatorWidth = (width - 64) / 2;
  const indicatorTranslateX = segmentedAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, indicatorWidth - 4]
  });

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[theme.primarySoft, theme.bg, theme.bg]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <Animated.View style={[styles.headerArea, { transform: [{ scale: logoScale }] }]}>
            <AppLogo size={100} />
            <Text style={[styles.title, { color: theme.text }]}>PetFinder</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              {isSignUp ? t("CreatePostSubtitle") : t("WelcomeBack")}
            </Text>
          </Animated.View>

          {/* Custom Segmented Control */}
          <View style={[styles.segmentedWrapper, { backgroundColor: theme.border }]}>
            <Animated.View
              style={[
                styles.segmentedIndicator,
                {
                  width: indicatorWidth - 8,
                  backgroundColor: theme.surface,
                  transform: [{ translateX: indicatorTranslateX }]
                }
              ]}
            />
            <Pressable style={styles.segmentedTab} onPress={() => switchMode("EMAIL")}>
              <Text style={[styles.tabText, mode === "EMAIL" && { color: theme.primary, fontWeight: "800" }]}>Email</Text>
            </Pressable>
            <Pressable style={styles.segmentedTab} onPress={() => switchMode("PHONE")}>
              <Text style={[styles.tabText, mode === "PHONE" && { color: theme.primary, fontWeight: "800" }]}>Phone</Text>
            </Pressable>
          </View>

          <Animated.View style={{ opacity: fadeAnim }}>
            {mode === "EMAIL" ? (
              <AppCard style={styles.formCard}>
                <Controller
                  control={emailForm.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <AppInput
                      label="Email Address"
                      placeholder="name@example.com"
                      value={field.value}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onChangeText={field.onChange}
                      error={fieldState.error?.message}
                      icon={<Sms size={20} color={theme.primary} variant="Bulk" />}
                    />
                  )}
                />
                <View style={{ marginTop: 12 }}>
                  <Controller
                    control={emailForm.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <AppInput
                        label="Password"
                        placeholder="••••••••"
                        value={field.value}
                        secureTextEntry
                        onChangeText={field.onChange}
                        error={fieldState.error?.message}
                        icon={<Lock size={20} color={theme.primary} variant="Bulk" />}
                      />
                    )}
                  />
                </View>

                <AppButton
                  label={isSignUp ? "Create Account" : "Sign In"}
                  loading={loading}
                  onPress={emailForm.handleSubmit(onSubmitEmail)}
                  style={{ marginTop: 24 }}
                />

                {auth.usesSupabaseAuth ? (
                  <>
                    <View style={styles.oauthDivider}>
                      <View style={[styles.oauthDividerLine, { backgroundColor: theme.border }]} />
                      <Text style={[styles.oauthDividerText, { color: theme.muted }]}>or</Text>
                      <View style={[styles.oauthDividerLine, { backgroundColor: theme.border }]} />
                    </View>

                    <AppButton
                      label={isSignUp ? "Sign up with Google" : "Continue with Google"}
                      loading={loading}
                      tone="secondary"
                      onPress={onGooglePress}
                      icon={<Text style={[styles.googleIcon, { color: theme.primary }]}>G</Text>}
                    />
                  </>
                ) : null}

                <Pressable
                  style={styles.toggleMode}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setIsSignUp(!isSignUp);
                  }}
                >
                  <Text style={[styles.toggleText, { color: theme.muted }]}>
                    {isSignUp ? "Already have an account? " : "Don't have an account? "}
                    <Text style={{ color: theme.primary, fontWeight: "700" }}>
                      {isSignUp ? "Sign In" : "Register"}
                    </Text>
                  </Text>
                </Pressable>
              </AppCard>
            ) : (
              <AppCard style={styles.formCard}>
                <Controller
                  control={phoneForm.control}
                  name="phone"
                  render={({ field, fieldState }) => (
                    <AppInput
                      label="Phone Number"
                      placeholder="+972 50 000 0000"
                      value={field.value}
                      keyboardType="phone-pad"
                      onChangeText={field.onChange}
                      error={fieldState.error?.message}
                      icon={<Call size={20} color={theme.primary} variant="Bulk" />}
                    />
                  )}
                />
                {otpSent && (
                  <View style={{ marginTop: 12 }}>
                    <Controller
                      control={phoneForm.control}
                      name="token"
                      render={({ field }) => (
                        <AppInput
                          label="Enter SMS Code"
                          placeholder="000000"
                          value={field.value}
                          keyboardType="number-pad"
                          onChangeText={field.onChange}
                          icon={<ShieldTick size={20} color={theme.primary} variant="Bulk" />}
                        />
                      )}
                    />
                  </View>
                )}

                <AppButton
                  label={otpSent ? "Unlock Access" : "Get OTP Code"}
                  loading={loading}
                  onPress={phoneForm.handleSubmit(onSubmitPhone)}
                  style={{ marginTop: 24 }}
                />

                <Text style={[styles.disclaimer, { color: theme.muted }]}>
                  By continuing, you agree to receive an SMS for verification purposes.
                </Text>
              </AppCard>
            )}
          </Animated.View>

          {!auth.usesSupabaseAuth && (
            <View style={styles.demoBox}>
              <ShieldTick size={24} color={theme.accent} variant="Bulk" style={{ marginBottom: 8 }} />
              <Text style={[styles.demoText, { color: theme.muted }]}>
                Supabase keys not configured. Testing in <Text style={{ fontWeight: "700" }}>Demo Mode</Text>.
              </Text>
              <AppButton
                label="Quick Demo Entrance"
                tone="secondary"
                onPress={() => auth.continueInDemoMode()}
                style={{ marginTop: 12 }}
              />
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
    gap: 24,
  },
  headerArea: {
    alignItems: "center",
    marginBottom: 10
  },
  logoBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center"
  },
  segmentedWrapper: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    padding: 4,
    position: "relative",
    marginHorizontal: 8
  },
  segmentedIndicator: {
    position: "absolute",
    height: 46,
    top: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  segmentedTab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B"
  },
  oauthDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
    marginBottom: 14
  },
  oauthDividerLine: {
    flex: 1,
    height: 1
  },
  oauthDividerText: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  formCard: {
    padding: 24,
    borderRadius: 28,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: "900"
  },
  toggleMode: {
    marginTop: 20,
    alignItems: "center"
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500"
  },
  disclaimer: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
    opacity: 0.7
  },
  demoBox: {
    marginTop: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.4)"
  },
  demoText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18
  }
});
