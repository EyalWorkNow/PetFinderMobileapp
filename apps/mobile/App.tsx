import React, { useEffect, useState } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";

const customNavTheme = {
  ...DefaultTheme,
  fonts: {
    regular: { fontFamily: '', fontWeight: 'normal' },
    medium: { fontFamily: '', fontWeight: '500' },
    bold: { fontFamily: '', fontWeight: 'bold' },
    heavy: { fontFamily: '', fontWeight: '900' },
  },
};
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { SettingsProvider, useSettings } from "./src/context/SettingsContext";
import { AudioProvider } from "./src/context/AudioContext";
import { apiRequest } from "./src/lib/api";
import { registerForPushToken } from "./src/lib/push";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { AuthScreen } from "./src/screens/AuthScreen";
import { SplashScreen } from "./src/screens/SplashScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ToastProvider } from "./src/context/ToastContext";
import { GuardianProvider } from "./src/context/GuardianContext";
import { PetVaultProvider } from "./src/context/PetVaultContext";
import { ThemeProvider } from "./src/context/ThemeContext";
import { ScreenLoading } from "./src/components/ui";
import AsyncStorage from "@react-native-async-storage/async-storage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
      refetchOnWindowFocus: false,
      retry: 2
    }
  }
});

function AppContent() {
  const auth = useAuth();
  const settings = useSettings();
  const [showSplash, setShowSplash] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const flag = await AsyncStorage.getItem("petfind.has_seen_onboarding");
        setHasSeenOnboarding(flag === "true");
      } catch {
        setHasSeenOnboarding(false);
      }
    }
    checkOnboarding().catch(() => undefined);

    const timer = setTimeout(() => setShowSplash(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function setupPush() {
      if (!auth.userId || !settings.notificationsEnabled) {
        return;
      }

      try {
        const token = await registerForPushToken();
        if (!token) {
          return;
        }
        await apiRequest("/push/register-token", {
          method: "POST",
          body: { expoToken: token },
          accessToken: auth.accessToken,
          userId: auth.userId
        });
      } catch (error) {
        // Silencing technical push errors as requested by user
        console.warn("Push token registration silent fail:", error);
      }
    }

    setupPush().catch(() => undefined);
  }, [auth.accessToken, auth.userId, settings.notificationsEnabled]);

  if (!auth.isReady || !settings.isReady || hasSeenOnboarding === null) {
    return <ScreenLoading label="Starting PetFinder..." />;
  }

  if (showSplash) {
    return <SplashScreen />;
  }

  if (!hasSeenOnboarding) {
    return <OnboardingScreen onComplete={() => setHasSeenOnboarding(true)} />;
  }

  return (
    <NavigationContainer theme={customNavTheme as any}>
      {auth.isAuthenticated ? <AppNavigator /> : <AuthScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SettingsProvider>
            <AuthProvider>
              <AudioProvider>
                <ToastProvider>
                  <GuardianProvider>
                    <PetVaultProvider>
                      <AppContent />
                    </PetVaultProvider>
                  </GuardianProvider>
                </ToastProvider>
              </AudioProvider>
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
