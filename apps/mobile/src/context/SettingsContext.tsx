import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

interface SettingsState {
  isReady: boolean;
  notificationsEnabled: boolean;
  quietHoursEnabled: boolean;
  hidePhoneByDefault: boolean;
  approximateLocationByDefault: boolean;
  language: string;
  setNotificationsEnabled: (value: boolean) => void;
  setQuietHoursEnabled: (value: boolean) => void;
  setHidePhoneByDefault: (value: boolean) => void;
  setApproximateLocationByDefault: (value: boolean) => void;
}

const SETTINGS_KEY = "petfind.settings.v1";

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [hidePhoneByDefault, setHidePhoneByDefault] = useState(true);
  const [approximateLocationByDefault, setApproximateLocationByDefault] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SettingsState>;
        setNotificationsEnabled(parsed.notificationsEnabled ?? true);
        setQuietHoursEnabled(parsed.quietHoursEnabled ?? false);
        setHidePhoneByDefault(parsed.hidePhoneByDefault ?? true);
        setApproximateLocationByDefault(parsed.approximateLocationByDefault ?? true);
      }
      setIsReady(true);
    }
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        notificationsEnabled,
        quietHoursEnabled,
        hidePhoneByDefault,
        approximateLocationByDefault
      })
    ).catch(() => undefined);
  }, [isReady, notificationsEnabled, quietHoursEnabled, hidePhoneByDefault, approximateLocationByDefault]);

  const value = useMemo(
    () => ({
      isReady,
      notificationsEnabled,
      quietHoursEnabled,
      hidePhoneByDefault,
      approximateLocationByDefault,
      language: "English (placeholder)",
      setNotificationsEnabled,
      setQuietHoursEnabled,
      setHidePhoneByDefault,
      setApproximateLocationByDefault
    }),
    [
      approximateLocationByDefault,
      hidePhoneByDefault,
      isReady,
      notificationsEnabled,
      quietHoursEnabled
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const value = useContext(SettingsContext);
  if (!value) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return value;
}
