import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { SettingsProvider, useSettings } from "./src/context/SettingsContext";
import { apiRequest } from "./src/lib/api";
import { registerForPushToken } from "./src/lib/push";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { AuthScreen } from "./src/screens/AuthScreen";
import { SplashScreen } from "./src/screens/SplashScreen";
import { ScreenLoading } from "./src/components/ui";

const queryClient = new QueryClient();

function AppContent() {
  const auth = useAuth();
  const settings = useSettings();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
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
        Alert.alert("Push setup", error instanceof Error ? error.message : "Failed to register push token");
      }
    }

    setupPush().catch(() => undefined);
  }, [auth.accessToken, auth.userId, settings.notificationsEnabled]);

  if (!auth.isReady || !settings.isReady) {
    return <ScreenLoading label="Starting PetFind..." />;
  }

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {auth.isAuthenticated ? <AppNavigator /> : <AuthScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </SettingsProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
