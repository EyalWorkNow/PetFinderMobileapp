import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

interface SettingsState {
  isReady: boolean;
  notificationsEnabled: boolean;
  quietHoursEnabled: boolean;
  hidePhoneByDefault: boolean;
  approximateLocationByDefault: boolean;
  audioEnabled: boolean;
  hapticsEnabled: boolean;
  language: "Hebrew" | "English" | "Arabic" | "Russian";
  setNotificationsEnabled: (value: boolean) => void;
  setQuietHoursEnabled: (value: boolean) => void;
  setHidePhoneByDefault: (value: boolean) => void;
  setApproximateLocationByDefault: (value: boolean) => void;
  setAudioEnabled: (value: boolean) => void;
  setHapticsEnabled: (value: boolean) => void;
  setLanguage: (value: "Hebrew" | "English" | "Arabic" | "Russian") => void;
}

const SETTINGS_KEY = "petfind.settings.v1";

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [hidePhoneByDefault, setHidePhoneByDefault] = useState(true);
  const [approximateLocationByDefault, setApproximateLocationByDefault] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [language, setLanguage] = useState<"Hebrew" | "English" | "Arabic" | "Russian">("Hebrew");

  useEffect(() => {
    async function loadSettings() {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SettingsState>;
        setNotificationsEnabled(parsed.notificationsEnabled ?? true);
        setQuietHoursEnabled(parsed.quietHoursEnabled ?? false);
        setHidePhoneByDefault(parsed.hidePhoneByDefault ?? true);
        setApproximateLocationByDefault(parsed.approximateLocationByDefault ?? true);
        setAudioEnabled(parsed.audioEnabled ?? true);
        setHapticsEnabled(parsed.hapticsEnabled ?? true);
        setLanguage(parsed.language ?? "Hebrew");
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
        approximateLocationByDefault,
        audioEnabled,
        hapticsEnabled,
        language
      })
    ).catch(() => undefined);
  }, [isReady, notificationsEnabled, quietHoursEnabled, hidePhoneByDefault, approximateLocationByDefault, audioEnabled, hapticsEnabled, language]);

  const value = useMemo(
    () => ({
      isReady,
      notificationsEnabled,
      quietHoursEnabled,
      hidePhoneByDefault,
      approximateLocationByDefault,
      audioEnabled,
      hapticsEnabled,
      language,
      setNotificationsEnabled,
      setQuietHoursEnabled,
      setHidePhoneByDefault,
      setApproximateLocationByDefault,
      setAudioEnabled,
      setHapticsEnabled,
      setLanguage
    }),
    [
      approximateLocationByDefault,
      hidePhoneByDefault,
      isReady,
      notificationsEnabled,
      quietHoursEnabled,
      audioEnabled,
      hapticsEnabled,
      language
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
