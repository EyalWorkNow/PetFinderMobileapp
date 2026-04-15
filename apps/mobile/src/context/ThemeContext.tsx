import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export type PrimaryColorPreset = "purple" | "blue" | "green" | "custom" | "rose" | "sky" | "matcha" | "honey" | "grape" | "coral";

interface ThemeState {
    themeMode: ThemeMode;
    resolvedTheme: ResolvedTheme;
    primaryColor: PrimaryColorPreset;
    customHex: string;
    setThemeMode: (mode: ThemeMode) => void;
    setPrimaryColor: (color: PrimaryColorPreset) => void;
    setCustomHex: (hex: string) => void;
    isReady: boolean;
}

const THEME_STORAGE_KEY = "petfind.theme.mode";
const COLOR_STORAGE_KEY = "petfind.theme.primaryColor";
const CUSTOM_HEX_STORAGE_KEY = "petfind.theme.customHex";

const ThemeContext = createContext<ThemeState | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
    const [primaryColor, setPrimaryColorState] = useState<PrimaryColorPreset>("purple");
    const [customHex, setCustomHexState] = useState<string>("#F78F1E");
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        async function loadTheme() {
            try {
                const [storedTheme, storedColor, storedCustomHex] = await Promise.all([
                    AsyncStorage.getItem(THEME_STORAGE_KEY),
                    AsyncStorage.getItem(COLOR_STORAGE_KEY),
                    AsyncStorage.getItem(CUSTOM_HEX_STORAGE_KEY)
                ]);

                if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
                    setThemeModeState(storedTheme);
                }

                if (storedColor && ["purple", "blue", "green", "custom", "rose", "sky", "matcha", "honey", "grape", "coral"].includes(storedColor)) {
                    setPrimaryColorState(storedColor as PrimaryColorPreset);
                }

                if (storedCustomHex) {
                    setCustomHexState(storedCustomHex);
                }
            } catch (e) {
                console.error("Failed to load theme from storage", e);
            } finally {
                setIsReady(true);
            }
        }
        loadTheme();
    }, []);

    const setThemeMode = async (mode: ThemeMode) => {
        setThemeModeState(mode);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch (e) {
            console.error("Failed to save theme to storage", e);
        }
    };

    const setPrimaryColor = async (color: PrimaryColorPreset) => {
        setPrimaryColorState(color);
        try {
            await AsyncStorage.setItem(COLOR_STORAGE_KEY, color);
        } catch (e) {
            console.error("Failed to save primary color to storage", e);
        }
    };

    const setCustomHex = async (hex: string) => {
        setCustomHexState(hex);
        setPrimaryColorState("custom");
        try {
            await Promise.all([
                AsyncStorage.setItem(CUSTOM_HEX_STORAGE_KEY, hex),
                AsyncStorage.setItem(COLOR_STORAGE_KEY, "custom")
            ]);
        } catch (e) {
            console.error("Failed to save custom hex to storage", e);
        }
    };

    const resolvedTheme: ResolvedTheme = useMemo(() => {
        if (themeMode === "system") {
            return systemColorScheme === "dark" ? "dark" : "light";
        }
        return themeMode;
    }, [themeMode, systemColorScheme]);

    const value = useMemo(
        () => ({
            themeMode,
            resolvedTheme,
            primaryColor,
            customHex,
            setThemeMode,
            setPrimaryColor,
            setCustomHex,
            isReady
        }),
        [themeMode, resolvedTheme, primaryColor, customHex, isReady]
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
