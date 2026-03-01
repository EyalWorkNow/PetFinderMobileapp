import React from "react";
import { StyleSheet, Switch, Text, View, ScrollView, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { AppCard, AppButton, colors, useThemeColors } from "../components/ui";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
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
  ArrowLeft
} from "iconsax-react-native";

export function SettingsScreen() {
  const settings = useSettings();
  const auth = useAuth();
  const theme = useThemeColors();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Account Section */}
        <Text style={styles.sectionHeader}>ACCOUNT</Text>
        <AppCard>
          <SettingRow
            label="Profile visibility"
            value={true}
            onValueChange={() => { }}
            icon={<UserEdit size={22} color={theme.primary} variant="Bulk" />}
            disabled
          />
          <SettingRow
            label="Two-factor authentication"
            value={false}
            onValueChange={() => { }}
            icon={<SecuritySafe size={22} color={theme.primary} variant="Bulk" />}
            disabled
          />
        </AppCard>

        {/* Notifications Section */}
        <Text style={styles.sectionHeader}>NOTIFICATIONS & SOUND</Text>
        <AppCard>
          <SettingRow
            label="Push notifications"
            value={settings.notificationsEnabled}
            onValueChange={settings.setNotificationsEnabled}
            icon={<Notification size={22} color={theme.primary} variant="Bulk" />}
          />
          <SettingRow
            label="Audio feedback"
            value={settings.audioEnabled}
            onValueChange={settings.setAudioEnabled}
            icon={<VolumeHigh size={22} color={theme.primary} variant="Bulk" />}
          />
          <SettingRow
            label="Haptic feedback"
            value={settings.hapticsEnabled}
            onValueChange={settings.setHapticsEnabled}
            icon={<Radar size={22} color={theme.primary} variant="Bulk" />}
          />
          <SettingRow
            label="Quiet hours"
            value={settings.quietHoursEnabled}
            onValueChange={settings.setQuietHoursEnabled}
            icon={<Timer size={22} color={theme.primary} variant="Bulk" />}
          />
        </AppCard>

        {/* Privacy Section */}
        <Text style={styles.sectionHeader}>PRIVACY DEFAULTS</Text>
        <AppCard>
          <SettingRow
            label="Hide phone by default"
            value={settings.hidePhoneByDefault}
            onValueChange={settings.setHidePhoneByDefault}
            icon={<EyeSlash size={22} color={theme.primary} variant="Bulk" />}
          />
          <SettingRow
            label="Approximate map location"
            value={settings.approximateLocationByDefault}
            onValueChange={settings.setApproximateLocationByDefault}
            icon={<Location size={22} color={theme.primary} variant="Bulk" />}
          />
        </AppCard>

        {/* Regional Section */}
        <Text style={styles.sectionHeader}>REGIONAL</Text>
        <Pressable
          onPress={() => {
            const next = settings.language === "Hebrew" ? "English" : "Hebrew";
            settings.setLanguage(next);
          }}
        >
          <AppCard style={styles.languageCard}>
            <View style={styles.languageHeader}>
              <Global size={22} color={theme.primary} variant="Bulk" />
              <Text style={styles.languageLabel}>Language</Text>
            </View>
            <Text style={styles.languageValue}>{settings.language}</Text>
          </AppCard>
        </Pressable>

        {/* Logout Section */}
        <View style={{ marginTop: 32 }}>
          <AppButton
            label="Sign Out"
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
  return (
    <View style={[styles.row, disabled && { opacity: 0.5 }]}>
      <View style={styles.rowLeft}>
        {icon}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.primary }}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: colors.muted,
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
    color: colors.text,
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
    color: colors.text,
    fontWeight: "600",
    fontSize: 15
  },
  languageValue: {
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 15
  },
  versionInfo: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 12,
    marginTop: 16,
    fontWeight: "600"
  }
});
