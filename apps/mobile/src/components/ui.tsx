import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
  type ViewProps
} from "react-native";

export const colors = {
  bg: "#F2F7FB",
  surface: "#FFFFFF",
  primary: "#0A4A72",
  primarySoft: "#DCEFFB",
  accent: "#F08A24",
  text: "#0F2230",
  muted: "#5A7283",
  danger: "#B83232",
  border: "#D4E0E8",
  success: "#238649"
};

export function AppCard(props: ViewProps) {
  return <View {...props} style={[styles.card, props.style]} />;
}

interface AppButtonProps extends PressableProps {
  label: string;
  loading?: boolean;
  tone?: "primary" | "secondary" | "danger";
}

export function AppButton({ label, loading, tone = "primary", style, ...props }: AppButtonProps) {
  const palette = tone === "primary"
    ? { backgroundColor: colors.primary, color: "#FFFFFF" }
    : tone === "danger"
      ? { backgroundColor: colors.danger, color: "#FFFFFF" }
      : { backgroundColor: colors.primarySoft, color: colors.primary };

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.backgroundColor, opacity: pressed ? 0.85 : 1 },
        typeof style === "function" ? style({ pressed }) : style
      ]}
    >
      {loading ? <ActivityIndicator color={palette.color} /> : <Text style={[styles.buttonText, { color: palette.color }]}>{label}</Text>}
    </Pressable>
  );
}

interface AppInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function AppInput({ label, error, ...props }: AppInputProps) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        {...props}
        style={[styles.input, error ? styles.inputError : null, props.style]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function ScreenLoading({ label }: { label: string }) {
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10
  },
  button: {
    minHeight: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18
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
    fontWeight: "600"
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    minHeight: 44,
    paddingHorizontal: 12,
    color: colors.text,
    backgroundColor: colors.surface
  },
  inputError: {
    borderColor: colors.danger
  },
  errorText: {
    color: colors.danger,
    fontSize: 12
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
    fontSize: 14
  }
});
