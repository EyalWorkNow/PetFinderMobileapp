import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { Alert, FlatList, StyleSheet, Text, View, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import * as Haptics from "expo-haptics";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { Award, BoxTime, Setting2, ShieldTick, Crown, Component, Trash } from "iconsax-react-native";
import { AppButton, useThemeColors } from "../components/ui";
import { LinearGradient } from "expo-linear-gradient";
import type { Post } from "../types/models";
import { useTranslation } from "../i18n/useTranslation";

export function ProfileScreen() {
  const auth = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const theme = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();

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
      Alert.alert(t("Failed"), err instanceof Error ? err.message : t("UnknownError"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["my-posts", auth.userId] });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => apiRequest(`/posts/${postId}`, {
      method: "DELETE",
      accessToken: auth.accessToken,
      userId: auth.userId
    }),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["my-posts", auth.userId] });
      const previousPosts = queryClient.getQueryData<Post[]>(["my-posts", auth.userId]);
      if (previousPosts) {
        queryClient.setQueryData<Post[]>(["my-posts", auth.userId], previousPosts.filter((p) => p.id !== postId));
      }
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      if (context?.previousPosts) queryClient.setQueryData(["my-posts", auth.userId], context.previousPosts);
      Alert.alert(t("Failed"), err instanceof Error ? err.message : t("UnknownError"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["my-posts", auth.userId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  });

  const handleDelete = (postId: string) => {
    Alert.alert(
      t("DeletePost"),
      t("DeletePostConfirm"),
      [
        { text: t("Cancel"), style: "cancel" },
        { text: t("Delete"), style: "destructive", onPress: () => deleteMutation.mutate(postId) }
      ]
    );
  };

  const activeCount = (myPostsQuery.data ?? []).filter((item) => item.status === "ACTIVE").length;
  const resolvedCount = (myPostsQuery.data ?? []).filter((item) => item.status === "RESOLVED").length;

  const renderHeroDashboard = () => (
    <View style={styles.heroWrapper}>
      <View style={styles.topNav}>
        <Text style={[styles.navTitle, { color: theme.text }]}>{t("CommandCenter")}</Text>
        <Pressable onPress={() => navigation.navigate("Settings")}>
          <Setting2 size={28} color={theme.text} variant="Outline" />
        </Pressable>
      </View>

      <View style={[styles.heroCard, { backgroundColor: theme.primary, shadowColor: theme.primary }]}>
        <LinearGradient
          colors={["rgba(255,255,255,0.2)", "rgba(0,0,0,0.4)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroGlass}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroLevel}>{t("NeighborhoodLegend")}</Text>
              <Text style={styles.heroName}>{t("Level42Guardian")}</Text>
            </View>
            <View style={styles.rankIconBg}>
              <Crown size={28} color="#FBBF24" variant="Bulk" />
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.statBox}>
              <Award size={24} color="#fff" variant="Bulk" />
              <Text style={styles.statVal}>15,420</Text>
              <Text style={styles.statLabel}>{t("KarmaScore")}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <ShieldTick size={24} color="#fff" variant="Bulk" />
              <Text style={styles.statVal}>{resolvedCount}</Text>
              <Text style={styles.statLabel}>{t("PetsRescued")}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Component size={24} color="#fff" variant="Bulk" />
              <Text style={styles.statVal}>{activeCount}</Text>
              <Text style={styles.statLabel}>{t("ActiveOps")}</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("ActiveOperations")}</Text>
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
            <Text style={[styles.empty, { color: theme.text }]}>{t("NoDataFound")}</Text>
            <Text style={[styles.emptySub, { color: theme.muted }]}>{t("NoOperationsInitiated")}</Text>
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
                  {t("OPERATION")}: {t(item.type)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === "ACTIVE" ? theme.primarySoft : theme.border }]}>
                  <Text style={[styles.statusText, { color: item.status === "ACTIVE" ? theme.primary : theme.muted }]}>
                    {t(item.status)}
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
                  <Text style={[styles.missionMeta, { color: theme.muted }]}>{item.lastSeen?.label || t("UnknownLocation")}</Text>
                  <Text style={[styles.missionDesc, { color: theme.text }]} numberOfLines={2}>{item.shortDesc}</Text>
                </View>
              </View>

              <View style={[styles.actionBlock, { flexDirection: "row", gap: 8 }]}>
                {item.status === "ACTIVE" ? (
                  <View style={{ flex: 1 }}>
                    <AppButton
                      label={t("ArchiveMarkResolved")}
                      onPress={() => resolveMutation.mutate(item.id)}
                      loading={resolveMutation.isPending}
                      tone="secondary"
                    />
                  </View>
                ) : <View style={{ flex: 1 }} />}
                <Pressable
                  style={[styles.deleteBtn, { backgroundColor: theme.danger + "20" }]}
                  onPress={() => handleDelete(item.id)}
                >
                  <Trash size={24} color={theme.danger} variant="Bulk" />
                </Pressable>
              </View>
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
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden'
  },
  heroGlass: {
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  heroHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 },
  heroLevel: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
  heroName: { color: "#ffffff", fontSize: 28, fontWeight: "900", letterSpacing: -0.5, textShadowColor: "rgba(0,0,0,0.2)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  rankIconBg: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(0,0,0,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  heroStats: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  statBox: { flex: 1, alignItems: "center", gap: 4 },
  statVal: { color: "#ffffff", fontSize: 22, fontWeight: "900", marginTop: 4, textShadowColor: "rgba(0,0,0,0.2)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  statLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
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
  actionBlock: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)" },
  deleteBtn: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" }
});
