import React from "react";
import { StyleSheet, Switch, Text, View, ScrollView, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { AppCard, AppButton, colors, useThemeColors } from "../components/ui";
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

export function SettingsScreen() {
  const settings = useSettings();
  const auth = useAuth();
  const { t, isRTL } = useTranslation();
  const theme = useThemeColors();
  const styles = makeStyles(theme);
  const { themeMode, setThemeMode, primaryColor, setPrimaryColor } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

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
        <AppCard style={{ padding: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 }}>
            <ColorDot colorName="purple" hex="#6366F1" selected={primaryColor === "purple"} onPress={() => setPrimaryColor("purple")} theme={theme} />
            <ColorDot colorName="blue" hex="#0EA5E9" selected={primaryColor === "blue"} onPress={() => setPrimaryColor("blue")} theme={theme} />
            <ColorDot colorName="green" hex="#10B981" selected={primaryColor === "green"} onPress={() => setPrimaryColor("green")} theme={theme} />
            <ColorDot colorName="orange" hex="#F59E0B" selected={primaryColor === "orange"} onPress={() => setPrimaryColor("orange")} theme={theme} />
            <ColorDot colorName="rose" hex="#F43F5E" selected={primaryColor === "rose"} onPress={() => setPrimaryColor("rose")} theme={theme} />
          </View>
        </AppCard>

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
            const next = current === "English" ? "Hebrew" : current === "Hebrew" ? "Arabic" : "English";
            settings.setLanguage(next);
          }}
        >
          <AppCard style={styles.languageCard}>
            <View style={[styles.languageHeader, isRTL && { flexDirection: "row-reverse" }]}>
              <Global size={22} color={theme.primary} variant="Bulk" />
              <Text style={[styles.languageLabel, isRTL && { marginRight: 8, marginLeft: 0 }]}>{t("Language")}</Text>
            </View>
            <Text style={styles.languageValue}>{settings.language}</Text>
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
          <Text style={styles.versionInfo}>PetFind v1.4.0 • Made with ❤️</Text>
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
