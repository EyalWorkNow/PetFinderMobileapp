import React from "react";
import { Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Map, AddSquare, SearchNormal, User, Setting2, ShieldTick, SafeHome, Chart } from "iconsax-react-native";
import { useThemeColors } from "../components/ui";
import { useTranslation } from "../i18n/useTranslation";
import type { CreateStackParamList, MainTabParamList, RootStackParamList } from "./types";
import { CreatePostWizardScreen } from "../screens/CreatePostWizardScreen";
import { MapScreen } from "../screens/MapScreen";
import { MatchesScreen } from "../screens/MatchesScreen";
import { ModeSelectScreen } from "../screens/ModeSelectScreen";
import { PostDetailsScreen } from "../screens/PostDetailsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { GuardianScreen } from "../screens/GuardianScreen";
import { PetVaultScreen } from "../screens/PetVaultScreen";
import { AdminDashboardScreen } from "../screens/AdminDashboardScreen";
import { useAuth } from "../context/AuthContext";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const CreateStack = createNativeStackNavigator<CreateStackParamList>();

function CreatePostNavigator() {
  return (
    <CreateStack.Navigator screenOptions={{ animation: "slide_from_right", headerShown: false }}>
      <CreateStack.Screen name="ModeSelect" component={ModeSelectScreen} options={{ title: "Create Post" }} />
      <CreateStack.Screen name="CreatePostWizard" component={CreatePostWizardScreen} options={{ title: "Post Wizard" }} />
    </CreateStack.Navigator>
  );
}

function MainTabs() {
  const { t } = useTranslation();
  const theme = useThemeColors();
  const { role } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: theme.surface, borderBottomWidth: 0, shadowOpacity: 0 },
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "800", marginBottom: 8 },
        tabBarStyle: {
          position: "absolute",
          bottom: 24,
          left: 16,
          right: 16,
          elevation: 0,
          backgroundColor: theme.surface,
          borderRadius: 35,
          height: 80,
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.15,
          shadowRadius: 30,
          borderTopWidth: 0,
          paddingTop: 12,
          paddingBottom: 12
        }
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          headerShown: true,
          tabBarLabel: t("Map"),
          tabBarIcon: ({ color, focused }) => <Map size={focused ? 28 : 24} color={color} variant={focused ? "Bold" : "Outline"} />
        }}
      />
      <Tab.Screen
        name="Guardian"
        component={GuardianScreen}
        options={{
          tabBarLabel: t("Guardian"),
          tabBarIcon: ({ color, focused }) => <ShieldTick size={focused ? 28 : 24} color={color} variant={focused ? "Bold" : "Outline"} />
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreatePostNavigator}
        options={{
          headerShown: false,
          tabBarLabel: t("Report"),
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              backgroundColor: theme.primary,
              width: 50,
              height: 50,
              borderRadius: 25,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 4,
              marginBottom: 15
            }}>
              <AddSquare size={28} color="#fff" variant="Bold" />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Vault"
        component={PetVaultScreen}
        options={{
          tabBarLabel: t("Vault"),
          tabBarIcon: ({ color, focused }) => <SafeHome size={focused ? 28 : 24} color={color} variant={focused ? "Bold" : "Outline"} />
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t("Profile"),
          tabBarIcon: ({ color, focused }) => <User size={focused ? 28 : 24} color={color} variant={focused ? "Bold" : "Outline"} />
        }}
      />
      {role === "ADMIN" && (
        <Tab.Screen
          name="AdminDashboard"
          component={AdminDashboardScreen}
          options={{
            tabBarLabel: "Admin",
            tabBarIcon: ({ color, focused }) => <Chart size={focused ? 28 : 24} color={color} variant={focused ? "Bold" : "Outline"} />
          }}
        />
      )}
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ animation: "slide_from_right", headerShown: false }}>
      <RootStack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <RootStack.Screen name="PostDetails" component={PostDetailsScreen} options={{ title: "Post Details" }} />
      <RootStack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      <RootStack.Screen name="Matches" component={MatchesScreen} options={{ title: "Search Matches" }} />
    </RootStack.Navigator>
  );
}
