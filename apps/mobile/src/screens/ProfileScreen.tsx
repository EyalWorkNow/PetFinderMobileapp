import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View, Pressable, Image, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import * as Haptics from "expo-haptics";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { Award, BoxTime, Setting2, ShieldTick, Crown, Component } from "iconsax-react-native";
import { AppButton, colors, useThemeColors } from "../components/ui";
import { LinearGradient } from "expo-linear-gradient";
import type { Post } from "../types/models";

const { width } = Dimensions.get("window");

export function ProfileScreen() {
  const auth = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const theme = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const myPostsQuery = useQuery({
    queryKey: ["my-posts", auth.userId],
    queryFn: async () => {
      const data = await apiRequest<{ items: Post[] }>("/profile/posts", {
        accessToken: auth.accessToken,
        userId: auth.userId
      });
      return data.items;
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async (postId: string) => apiRequest(`/posts/${postId}/resolve`, {
      method: "POST",
      accessToken: auth.accessToken,
      userId: auth.userId
    }),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["my-posts", auth.userId] });
      const previousPosts = queryClient.getQueryData<Post[]>(["my-posts", auth.userId]);
      if (previousPosts) {
        queryClient.setQueryData<Post[]>(["my-posts", auth.userId], previousPosts.map((p) =>
          p.id === postId ? { ...p, status: "RESOLVED" } : p
        ));
      }
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      if (context?.previousPosts) queryClient.setQueryData(["my-posts", auth.userId], context.previousPosts);
      Alert.alert("Failed", err instanceof Error ? err.message : "Unknown error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["my-posts", auth.userId] });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  });

  const activeCount = (myPostsQuery.data ?? []).filter((item) => item.status === "ACTIVE").length;
  const resolvedCount = (myPostsQuery.data ?? []).filter((item) => item.status === "RESOLVED").length;

  const renderHeroDashboard = () => (
    <View style={styles.heroWrapper}>
      <View style={styles.topNav}>
        <Text style={[styles.navTitle, { color: theme.text }]}>Command Center</Text>
        <Pressable onPress={() => navigation.navigate("Settings")}>
          <Setting2 size={28} color={theme.text} variant="Outline" />
        </Pressable>
      </View>

      <LinearGradient
        colors={[theme.primary, "#4F46E5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroGlass}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroLevel}>Neighborhood Legend</Text>
              <Text style={styles.heroName}>Level 42 Guardian</Text>
            </View>
            <View style={styles.rankIconBg}>
              <Crown size={28} color="#FBBF24" variant="Bulk" />
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.statBox}>
              <Award size={24} color="#fff" variant="Bulk" />
              <Text style={styles.statVal}>15,420</Text>
              <Text style={styles.statLabel}>Karma Score</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <ShieldTick size={24} color="#fff" variant="Bulk" />
              <Text style={styles.statVal}>{resolvedCount}</Text>
              <Text style={styles.statLabel}>Pets Rescued</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Component size={24} color="#fff" variant="Bulk" />
              <Text style={styles.statVal}>{activeCount}</Text>
              <Text style={styles.statLabel}>Active Ops</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Operations</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <FlatList
        data={myPostsQuery.data ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeroDashboard()}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <BoxTime size={64} color={theme.muted} variant="Outline" style={{ marginBottom: 16 }} />
            <Text style={[styles.empty, { color: theme.text }]}>No Data Found</Text>
            <Text style={[styles.emptySub, { color: theme.muted }]}>You haven't initiated any patrol or rescue operations yet.</Text>
          </View>
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate("PostDetails", { postId: item.id })}
            style={({ pressed }) => [pressed && { opacity: 0.9 }]}
          >
            <View style={[styles.missionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.missionHeader}>
                <Text style={[styles.missionType, { color: item.type === "LOST" ? theme.danger : theme.success }]}>
                  OPERATION: {item.type}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === "ACTIVE" ? theme.primarySoft : theme.border }]}>
                  <Text style={[styles.statusText, { color: item.status === "ACTIVE" ? theme.primary : theme.muted }]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.missionBody}>
                <View style={styles.thumbnailContainer}>
                  {item.photos && item.photos.length > 0 ? (
                    <Image source={{ uri: item.photos[0].storagePath }} style={styles.thumbnail} />
                  ) : (
                    <View style={[styles.thumbnail, { backgroundColor: theme.border, alignItems: "center", justifyContent: "center" }]}>
                      <Component size={24} color={theme.muted} />
                    </View>
                  )}
                </View>
                <View style={styles.missionDetails}>
                  <Text style={[styles.missionTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                  <Text style={[styles.missionMeta, { color: theme.muted }]}>{item.lastSeen?.label || "Unknown Location"}</Text>
                  <Text style={[styles.missionDesc, { color: theme.text }]} numberOfLines={2}>{item.description}</Text>
                </View>
              </View>

              {item.status === "ACTIVE" && (
                <View style={styles.actionBlock}>
                  <AppButton
                    label="Archive / Mark Resolved"
                    onPress={() => resolveMutation.mutate(item.id)}
                    loading={resolveMutation.isPending}
                    tone="secondary"
                  />
                </View>
              )}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 110, gap: 16 },
  heroWrapper: { marginBottom: 16 },
  topNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingHorizontal: 4 },
  navTitle: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  heroCard: {
    borderRadius: 32,
    marginBottom: 32,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden'
  },
  heroGlass: {
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    // Note: backdrop-filter is web only, RN requires BlurView for real glass, using opacity for compat
  },
  heroHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 },
  heroLevel: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  heroName: { color: "#fff", fontSize: 24, fontWeight: "900" },
  rankIconBg: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  heroStats: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 24, padding: 16 },
  statBox: { flex: 1, alignItems: "center", gap: 4 },
  statVal: { color: "#fff", fontSize: 20, fontWeight: "900", marginTop: 4 },
  statLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  divider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.2)" },
  sectionTitle: { fontSize: 20, fontWeight: "900", marginLeft: 4, marginBottom: 8 },
  emptyWrap: { alignItems: "center", justifyContent: "center", marginTop: 40, padding: 32 },
  empty: { fontSize: 20, fontWeight: "800" },
  emptySub: { textAlign: "center", marginTop: 8, lineHeight: 20 },
  missionCard: { borderRadius: 24, borderWidth: 1, padding: 16, overflow: "hidden" },
  missionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)", paddingBottom: 12 },
  missionType: { fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  missionBody: { flexDirection: "row", gap: 16 },
  thumbnailContainer: { width: 80, height: 80, borderRadius: 16, overflow: "hidden" },
  thumbnail: { width: "100%", height: "100%", resizeMode: "cover" },
  missionDetails: { flex: 1, justifyContent: "center", gap: 4 },
  missionTitle: { fontSize: 18, fontWeight: "800" },
  missionMeta: { fontSize: 13, fontWeight: "600" },
  missionDesc: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  actionBlock: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)" }
});
