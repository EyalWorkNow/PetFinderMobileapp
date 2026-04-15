import React, { useState } from "react";
import { StyleSheet, Switch, Text, View, ScrollView, Pressable, Alert, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { AppCard, AppButton, useThemeColors } from "../components/ui";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import {
  Notification,
  Timer,
  EyeSlash,
  Location,
  Global,
  VolumeHigh,
  Radar,
  Logout,
  SecuritySafe,
  UserEdit,
  ArrowLeft,
  Sun1,
  Moon,
  Mobile
} from "iconsax-react-native";
import { useTheme } from "../context/ThemeContext";

// HSL to Hex helper
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function SettingsScreen() {
  const settings = useSettings();
  const auth = useAuth();
  const { t, isRTL } = useTranslation();
  const theme = useThemeColors();
  const styles = makeStyles(theme);
  const { themeMode, setThemeMode, primaryColor, setPrimaryColor, customHex, setCustomHex } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempHue, setTempHue] = useState(30);

  const handleLogout = () => {
    Alert.alert(
      t("SignOutConfirmTitle"),
      t("SignOutConfirmMessage"),
      [
        { text: t("Cancel"), style: "cancel" },
        {
          text: t("Logout"),
          style: "destructive",
          onPress: () => auth.signOut()
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
        >
          <ArrowLeft size={28} color={theme.text} variant="Outline" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t("Settings")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Account Section */}
        <Text style={styles.sectionHeader}>{t("Account")}</Text>
        <AppCard>
          <SettingRow
            label={t("ProfileVisibility")}
            value={true}
            onValueChange={() => { }}
            icon={<UserEdit size={22} color={theme.primary} variant="Bulk" />}
            disabled
          />
          <SettingRow
            label={t("TwoFactorAuth")}
            value={false}
            onValueChange={() => { }}
            icon={<SecuritySafe size={22} color={theme.primary} variant="Bulk" />}
            disabled
          />
        </AppCard>

        {/* Theme Section */}
        <Text style={styles.sectionHeader}>{t("Theme")}</Text>
        <AppCard style={{ padding: 12, gap: 12 }}>
          <Text style={{ color: theme.muted, fontSize: 13, paddingHorizontal: 4 }}>
            {t("SystemThemeDesc")}
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <ThemeOption
              label={t("System")}
              icon={<Mobile size={20} color={themeMode === "system" ? theme.primary : theme.muted} variant={themeMode === "system" ? "Bulk" : "Outline"} />}
              isSelected={themeMode === "system"}
              onPress={() => setThemeMode("system")}
              theme={theme}
            />
            <ThemeOption
              label={t("Light")}
              icon={<Sun1 size={20} color={themeMode === "light" ? theme.primary : theme.muted} variant={themeMode === "light" ? "Bulk" : "Outline"} />}
              isSelected={themeMode === "light"}
              onPress={() => setThemeMode("light")}
              theme={theme}
            />
            <ThemeOption
              label={t("Dark")}
              icon={<Moon size={20} color={themeMode === "dark" ? theme.primary : theme.muted} variant={themeMode === "dark" ? "Bulk" : "Outline"} />}
              isSelected={themeMode === "dark"}
              onPress={() => setThemeMode("dark")}
              theme={theme}
            />
          </View>
        </AppCard>

        {/* Primary Color Section */}
        <Text style={styles.sectionHeader}>{t("PrimaryColor") || "Primary Color"}</Text>
        <AppCard style={{ padding: 12, gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 }}>
            <ColorDot colorName="purple" hex="#9153F4" selected={primaryColor === "purple"} onPress={() => setPrimaryColor("purple")} theme={theme} />
            <ColorDot colorName="blue" hex="#2F89FC" selected={primaryColor === "blue"} onPress={() => setPrimaryColor("blue")} theme={theme} />
            <ColorDot colorName="green" hex="#393E46" selected={primaryColor === "green"} onPress={() => setPrimaryColor("green")} theme={theme} />
            <Pressable
              onPress={() => {
                // Initialize hue from current customHex
                if (customHex) {
                  const r = parseInt(customHex.slice(1, 3), 16) / 255;
                  const g = parseInt(customHex.slice(3, 5), 16) / 255;
                  const b = parseInt(customHex.slice(5, 7), 16) / 255;
                  const max = Math.max(r, g, b), min = Math.min(r, g, b);
                  let h = 0;
                  if (max !== min) {
                    const d = max - min;
                    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                    else if (max === g) h = ((b - r) / d + 2) / 6;
                    else h = ((r - g) / d + 4) / 6;
                  }
                  setTempHue(Math.round(h * 360));
                }
                setShowColorPicker(true);
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: primaryColor === "custom" ? 3 : 1,
                borderColor: primaryColor === "custom" ? theme.text : theme.border,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                shadowColor: customHex || "#F78F1E",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: primaryColor === "custom" ? 0.4 : 0.1,
                shadowRadius: 6,
                elevation: primaryColor === "custom" ? 6 : 2
              }}
            >
              {/* Rainbow gradient circle */}
              <View style={{ width: 44, height: 44, flexDirection: "row" }}>
                {["#FF0000", "#FF8800", "#FFFF00", "#00FF00", "#0088FF", "#8800FF"].map((c, i) => (
                  <View key={i} style={{ flex: 1, backgroundColor: c }} />
                ))}
              </View>
            </Pressable>
            <ColorDot colorName="rose" hex="#F02A71" selected={primaryColor === "rose"} onPress={() => setPrimaryColor("rose")} theme={theme} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 }}>
            <ColorDot colorName="sky" hex="#0EA5E9" selected={primaryColor === "sky"} onPress={() => setPrimaryColor("sky")} theme={theme} />
            <ColorDot colorName="matcha" hex="#84CC16" selected={primaryColor === "matcha"} onPress={() => setPrimaryColor("matcha")} theme={theme} />
            <ColorDot colorName="honey" hex="#F59E0B" selected={primaryColor === "honey"} onPress={() => setPrimaryColor("honey")} theme={theme} />
            <ColorDot colorName="grape" hex="#8B5CF6" selected={primaryColor === "grape"} onPress={() => setPrimaryColor("grape")} theme={theme} />
            <ColorDot colorName="coral" hex="#FF7F50" selected={primaryColor === "coral"} onPress={() => setPrimaryColor("coral")} theme={theme} />
          </View>
        </AppCard>
        {/* Custom Color Picker Modal */}
        <Modal visible={showColorPicker} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
            <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: insets.bottom + 24 }}>
              <Text style={{ fontSize: 20, fontWeight: "900", color: theme.text, textAlign: "center", marginBottom: 20 }}>🎨 {t("PrimaryColor")}</Text>

              {/* Preview */}
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: hslToHex(tempHue, 75, 55), shadowColor: hslToHex(tempHue, 75, 55), shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 }} />
                <Text style={{ color: theme.muted, fontSize: 13, fontWeight: "700", marginTop: 10 }}>{hslToHex(tempHue, 75, 55).toUpperCase()}</Text>
              </View>

              {/* Hue Spectrum Bar */}
              <View style={{ height: 48, borderRadius: 24, overflow: "hidden", marginBottom: 24 }}>
                <View style={{ flex: 1, flexDirection: "row" }}>
                  {Array.from({ length: 36 }).map((_, i) => (
                    <Pressable
                      key={i}
                      onPress={() => setTempHue(i * 10)}
                      style={{ flex: 1, backgroundColor: hslToHex(i * 10, 75, 55) }}
                    />
                  ))}
                </View>
                <View style={{
                  position: "absolute",
                  left: `${(tempHue / 360) * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  backgroundColor: "#fff",
                  borderRadius: 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4
                }} />
              </View>

              {/* Buttons */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={() => setShowColorPicker(false)}
                  style={{ flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: theme.border, alignItems: "center" }}
                >
                  <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16 }}>{t("Cancel")}</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setCustomHex(hslToHex(tempHue, 75, 55));
                    setShowColorPicker(false);
                  }}
                  style={{ flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: hslToHex(tempHue, 75, 55), alignItems: "center" }}
                >
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>{t("Confirm")}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Notifications Section */}
        <Text style={styles.sectionHeader}>{t("NotificationsSound")}</Text>
        <AppCard>
          <SettingRow
            label={t("PushNotifications")}
            value={settings.notificationsEnabled}
            onValueChange={settings.setNotificationsEnabled}
            icon={<Notification size={22} color={theme.primary} variant="Bulk" />}
          />
          <SettingRow
            label={t("AudioFeedback")}
            value={settings.audioEnabled}
            onValueChange={settings.setAudioEnabled}
            icon={<VolumeHigh size={22} color={theme.primary} variant="Bulk" />}
          />
          <SettingRow
            label={t("HapticFeedback")}
            value={settings.hapticsEnabled}
            onValueChange={settings.setHapticsEnabled}
            icon={<Radar size={22} color={theme.primary} variant="Bulk" />}
          />
          <SettingRow
            label={t("QuietHours")}
            value={settings.quietHoursEnabled}
            onValueChange={settings.setQuietHoursEnabled}
            icon={<Timer size={22} color={theme.primary} variant="Bulk" />}
          />
        </AppCard>

        {/* Privacy Section */}
        <Text style={styles.sectionHeader}>{t("PrivacyDefaults")}</Text>
        <AppCard>
          <SettingRow
            label={t("HidePhoneByDefault")}
            value={settings.hidePhoneByDefault}
            onValueChange={settings.setHidePhoneByDefault}
            icon={<EyeSlash size={22} color={theme.primary} variant="Bulk" />}
          />
          <SettingRow
            label={t("ApproximateLocationByDefault")}
            value={settings.approximateLocationByDefault}
            onValueChange={settings.setApproximateLocationByDefault}
            icon={<Location size={22} color={theme.primary} variant="Bulk" />}
          />
        </AppCard>

        {/* Regional Section */}
        <Text style={styles.sectionHeader}>{t("Regional")}</Text>
        <Pressable
          onPress={() => {
            const current = settings.language;
            let next: typeof current;
            if (current === "English") next = "Hebrew";
            else if (current === "Hebrew") next = "Arabic";
            else if (current === "Arabic") next = "Russian";
            else next = "English";
            settings.setLanguage(next);
          }}
        >
          <AppCard style={styles.languageCard}>
            <View style={[styles.languageHeader, isRTL && { flexDirection: "row-reverse" }]}>
              <Global size={22} color={theme.primary} variant="Bulk" />
              <Text style={[styles.languageLabel, isRTL && { marginRight: 8, marginLeft: 0 }]}>{t("Language")}</Text>
            </View>
            <Text style={styles.languageValue}>{t(`Lang${settings.language}` as any)}</Text>
          </AppCard>
        </Pressable>

        {/* Logout Section */}
        <View style={{ marginTop: 32 }}>
          <AppButton
            label={t("Logout")}
            tone="danger"
            onPress={handleLogout}
            icon={<Logout size={20} color="#fff" />}
          />
          <Text style={styles.versionInfo}>PetFinder v1.4.0 • Made with ❤️</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingRow({
  label,
  value,
  onValueChange,
  icon,
  disabled
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  const theme = useThemeColors();
  const styles = makeStyles(theme);

  return (
    <View style={[styles.row, disabled && { opacity: 0.5 }]}>
      <View style={styles.rowLeft}>
        {icon}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: theme.primary }}
        disabled={disabled}
      />
    </View>
  );
}

function ThemeOption({ label, icon, isSelected, onPress, theme }: any) {
  const styles = makeStyles(theme);
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.themeOption,
        { backgroundColor: isSelected ? theme.primarySoft : theme.bg, borderColor: isSelected ? theme.primary : theme.border }
      ]}
    >
      {icon}
      <Text style={[styles.themeOptionText, { color: isSelected ? theme.primary : theme.muted }]}>{label}</Text>
    </Pressable>
  );
}

function ColorDot({ hex, selected, onPress, theme }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: hex,
        borderWidth: selected ? 3 : 0,
        borderColor: theme.text,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: hex,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: selected ? 0.4 : 0.1,
        shadowRadius: 6,
        elevation: selected ? 6 : 2
      }}
    />
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)"
  },
  backBtn: {
    padding: 8,
    marginLeft: -8
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800"
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.muted,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 1
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)"
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1
  },
  rowLabel: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "600"
  },
  languageCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16
  },
  languageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  languageLabel: {
    color: theme.text,
    fontWeight: "600",
    fontSize: 15
  },
  languageValue: {
    color: theme.primary,
    fontWeight: "bold",
    fontSize: 15
  },
  versionInfo: {
    textAlign: "center",
    color: theme.muted,
    fontSize: 12,
    marginTop: 16,
    fontWeight: "600"
  },
  themeOption: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 12
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: "700"
  }
});
