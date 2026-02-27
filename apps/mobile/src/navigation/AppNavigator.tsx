import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../components/ui";
import type { CreateStackParamList, MainTabParamList, RootStackParamList } from "./types";
import { CreatePostWizardScreen } from "../screens/CreatePostWizardScreen";
import { MapScreen } from "../screens/MapScreen";
import { MatchesScreen } from "../screens/MatchesScreen";
import { ModeSelectScreen } from "../screens/ModeSelectScreen";
import { PostDetailsScreen } from "../screens/PostDetailsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const CreateStack = createNativeStackNavigator<CreateStackParamList>();

function CreatePostNavigator() {
  return (
    <CreateStack.Navigator>
      <CreateStack.Screen name="ModeSelect" component={ModeSelectScreen} options={{ title: "Create Post" }} />
      <CreateStack.Screen name="CreatePostWizard" component={CreatePostWizardScreen} options={{ title: "Post Wizard" }} />
    </CreateStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted
      }}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Create" component={CreatePostNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <RootStack.Screen name="PostDetails" component={PostDetailsScreen} options={{ title: "Post Details" }} />
    </RootStack.Navigator>
  );
}
