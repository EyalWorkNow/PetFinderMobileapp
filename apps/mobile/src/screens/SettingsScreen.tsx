import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { AppCard, colors } from "../components/ui";
import { useSettings } from "../context/SettingsContext";

export function SettingsScreen() {
  const settings = useSettings();

  return (
    <View style={styles.container}>
      <AppCard>
        <SettingRow
          label="Push notifications"
          value={settings.notificationsEnabled}
          onValueChange={settings.setNotificationsEnabled}
        />
        <SettingRow
          label="Quiet hours"
          value={settings.quietHoursEnabled}
          onValueChange={settings.setQuietHoursEnabled}
        />
        <SettingRow
          label="Hide phone by default"
          value={settings.hidePhoneByDefault}
          onValueChange={settings.setHidePhoneByDefault}
        />
        <SettingRow
          label="Approximate map location"
          value={settings.approximateLocationByDefault}
          onValueChange={settings.setApproximateLocationByDefault}
        />
      </AppCard>

      <AppCard>
        <Text style={styles.languageLabel}>Language</Text>
        <Text style={styles.languageValue}>{settings.language}</Text>
      </AppCard>
    </View>
  );
}

function SettingRow({
  label,
  value,
  onValueChange
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 14,
    gap: 12
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4
  },
  rowLabel: {
    color: colors.text,
    fontWeight: "600",
    flex: 1,
    paddingRight: 10
  },
  languageLabel: {
    color: colors.muted,
    fontSize: 13
  },
  languageValue: {
    color: colors.text,
    fontWeight: "700"
  }
});
