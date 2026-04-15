import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  type PressableProps,
  type TextInputProps,
  type ViewProps
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme, type PrimaryColorPreset, type ResolvedTheme } from "../context/ThemeContext";

export const colorPresets: Record<PrimaryColorPreset, { primary: string; primarySoft: string; primaryDark: string }> = {
  purple: { primary: "#9153F4", primarySoft: "#F3E8FF", primaryDark: "#7C3AED" },
  blue: { primary: "#2F89FC", primarySoft: "#E0F2FE", primaryDark: "#1D4ED8" },
  green: { primary: "#393E46", primarySoft: "#E5E7EB", primaryDark: "#222831" },
  custom: { primary: "#F78F1E", primarySoft: "#FFF7ED", primaryDark: "#C2410C" },
  rose: { primary: "#F02A71", primarySoft: "#FFF1F2", primaryDark: "#BE123C" },
  sky: { primary: "#0EA5E9", primarySoft: "#E0F2FE", primaryDark: "#0369A1" },
  matcha: { primary: "#84CC16", primarySoft: "#F7FEE7", primaryDark: "#4D7C0F" },
  honey: { primary: "#F59E0B", primarySoft: "#FFFBEB", primaryDark: "#B45309" },
  grape: { primary: "#8B5CF6", primarySoft: "#F5F3FF", primaryDark: "#6D28D9" },
  coral: { primary: "#FF7F50", primarySoft: "#FFF1EB", primaryDark: "#E76F51" }
};
export const darkColorPresets: Record<PrimaryColorPreset, { primary: string; primarySoft: string; primaryDark: string }> = {
  purple: { primary: "#A78BFA", primarySoft: "rgba(167, 139, 250, 0.15)", primaryDark: "#7C3AED" },
  blue: { primary: "#60A5FA", primarySoft: "rgba(96, 165, 250, 0.15)", primaryDark: "#1D4ED8" },
  green: { primary: "#4B5563", primarySoft: "rgba(75, 85, 99, 0.15)", primaryDark: "#1F2937" },
  custom: { primary: "#FB923C", primarySoft: "rgba(251, 146, 60, 0.15)", primaryDark: "#C2410C" },
  rose: { primary: "#FB7185", primarySoft: "rgba(251, 113, 133, 0.15)", primaryDark: "#BE123C" },
  sky: { primary: "#38BDF8", primarySoft: "rgba(56, 189, 248, 0.15)", primaryDark: "#0369A1" },
  matcha: { primary: "#A3E635", primarySoft: "rgba(163, 230, 53, 0.15)", primaryDark: "#4D7C0F" },
  honey: { primary: "#FBBF24", primarySoft: "rgba(251, 191, 36, 0.15)", primaryDark: "#B45309" },
  grape: { primary: "#A78BFA", primarySoft: "rgba(167, 139, 250, 0.15)", primaryDark: "#6D28D9" },
  coral: { primary: "#FB923C", primarySoft: "rgba(251, 146, 60, 0.15)", primaryDark: "#E76F51" }
};

export const lightColors = {
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  primary: "#9153F4",
  primarySoft: "#F3E8FF",
  accent: "#F02A71",
  text: "#0F172A",
  muted: "#64748B",
  danger: "#E11D48",
  dangerSoft: "#FFE4E6",
  border: "#E2E8F0",
  success: "#10B981",
  successSoft: "#D1FAE5"
};

export const darkColors = {
  bg: "#0A0A0A", // Deeper OLED black
  surface: "#171717",
  primary: "#A78BFA",
  primarySoft: "rgba(167, 139, 250, 0.15)",
  accent: "#FB7185",
  text: "#F8FAFC",
  muted: "#A3A3A3",
  danger: "#F43F5E",
  dangerSoft: "rgba(244, 63, 94, 0.15)",
  border: "#262626",
  success: "#34D399",
  successSoft: "rgba(52, 211, 153, 0.15)"
};

export function useThemeColors() {
  const { resolvedTheme, primaryColor, customHex } = useTheme();
  const base = resolvedTheme === "dark" ? darkColors : lightColors;
  let preset = resolvedTheme === "dark" ? darkColorPresets[primaryColor] : colorPresets[primaryColor];

  // If custom, generate colors from the user's chosen hex
  if (primaryColor === "custom" && customHex) {
    const softOpacity = resolvedTheme === "dark" ? 0.15 : 1;
    const softColor = resolvedTheme === "dark"
      ? `rgba(${parseInt(customHex.slice(1, 3), 16)}, ${parseInt(customHex.slice(3, 5), 16)}, ${parseInt(customHex.slice(5, 7), 16)}, 0.15)`
      : customHex + "1A";
    // Darken the hex by reducing each channel by ~30%
    const r = Math.max(0, Math.round(parseInt(customHex.slice(1, 3), 16) * 0.7));
    const g = Math.max(0, Math.round(parseInt(customHex.slice(3, 5), 16) * 0.7));
    const b = Math.max(0, Math.round(parseInt(customHex.slice(5, 7), 16) * 0.7));
    const darkHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    preset = { primary: customHex, primarySoft: softColor, primaryDark: darkHex };
  }

  return { ...base, ...preset };
}

// Keep the legacy export for compatibility, but recommend useThemeColors. Fallback to light/purple.
export const colors = { ...lightColors, ...colorPresets.purple };

export function AppCard({ onPress, ...props }: ViewProps & { onPress?: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10
    }).start();
  };

  const colors = useThemeColors();
  const styles = getStyles(colors);
  const Container = onPress ? Pressable : View;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      {/* @ts-ignore - Container types are tricky here but works at runtime */}
      <Container
        {...props}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.primary }, props.style]}
      />
    </Animated.View>
  );
}

interface AppButtonProps extends PressableProps {
  label: string;
  loading?: boolean;
  tone?: "primary" | "secondary" | "danger";
  icon?: React.ReactNode;
}

export function AppButton({ label, loading, tone = "primary", style, icon, onPress, ...props }: AppButtonProps) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const palette = tone === "primary"
    ? { backgroundColor: colors.primary, color: "#FFFFFF" }
    : tone === "danger"
      ? { backgroundColor: colors.danger, color: "#FFFFFF" }
      : { backgroundColor: colors.primarySoft, color: colors.primary };

  const handlePress = (e: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    if (onPress) onPress(e);
  };

  return (
    <Pressable
      {...props}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.backgroundColor, opacity: pressed ? 0.8 : 1 },
        pressed && styles.buttonPressed,
        typeof style === "function" ? style({ pressed }) : style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.color} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {icon}
          <Text style={[styles.buttonText, { color: palette.color }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

interface AppInputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export function AppInput({ label, error, icon, ...props }: AppInputProps) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={{ position: "relative", justifyContent: "center" }}>
        {icon && (
          <View style={{ position: "absolute", left: 16, zIndex: 10 }}>
            {icon}
          </View>
        )}
        <TextInput
          placeholderTextColor={colors.muted}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text, backgroundColor: colors.bg },
            icon ? { paddingLeft: 46 } : null,
            isFocused ? { borderColor: colors.primary, backgroundColor: colors.surface } : null,
            error ? { borderColor: colors.danger, backgroundColor: colors.dangerSoft } : null,
            props.style
          ]}
        />
      </View>
      {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

export function ScreenLoading({ label }: { label: string }) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  return (
    <View style={[styles.loadingWrap, { backgroundColor: colors.bg }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

export function SkeletonBox({ width, height, style }: { width?: string | number; height: number; style?: any }) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        // Deep inhale (parasympathetic heartbeat)
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        // Deep exhale
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true })
      ])
    ).start();
  }, [pulseAnim]);

  const colors = useThemeColors();
  const styles = getStyles(colors);
  return (
    <Animated.View
      style={[{ width: width ?? "100%", height, backgroundColor: colors.border, borderRadius: 8, opacity: pulseAnim }, style]}
    />
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    gap: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 32,
    elevation: 4
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }]
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700"
  },
  inputWrap: {
    gap: 6
  },
  inputLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    color: colors.text,
    backgroundColor: "#F8FAFC",
    fontSize: 16,
    fontWeight: "500"
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "500"
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.bg
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "500"
  }
});
