import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { AppButton, AppCard, colors } from "../components/ui";
import type { Post } from "../types/models";

export function ProfileScreen() {
  const auth = useAuth();
  const queryClient = useQueryClient();

  const myPostsQuery = useQuery({
    queryKey: ["my-posts", auth.userId],
    queryFn: async () => {
      const response = await apiRequest<{ items: Post[] }>("/profile/posts", {
        accessToken: auth.accessToken,
        userId: auth.userId
      });
      return response.items;
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async (postId: string) => apiRequest(`/posts/${postId}/resolve`, {
      method: "POST",
      accessToken: auth.accessToken,
      userId: auth.userId
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-posts", auth.userId] });
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      Alert.alert("Updated", "Post marked as resolved.");
    },
    onError: (error) => Alert.alert("Failed", error instanceof Error ? error.message : "Unknown error")
  });

  const activeCount = (myPostsQuery.data ?? []).filter((item) => item.status === "ACTIVE").length;

  return (
    <View style={styles.container}>
      <AppCard>
        <Text style={styles.header}>My Posts</Text>
        <Text style={styles.subheader}>{activeCount} active post(s)</Text>
      </AppCard>

      <FlatList
        data={myPostsQuery.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <AppCard>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>{item.type} • {item.petType} • {item.status}</Text>
            {item.status === "ACTIVE" ? (
              <AppButton
                label="Mark resolved"
                tone="secondary"
                onPress={() => resolveMutation.mutate(item.id)}
              />
            ) : null}
          </AppCard>
        )}
      />

      <View style={styles.footer}>
        <AppButton label="Sign out" tone="danger" onPress={() => auth.signOut()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 12,
    gap: 10
  },
  header: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text
  },
  subheader: {
    color: colors.muted
  },
  list: {
    gap: 10,
    paddingBottom: 14
  },
  title: {
    fontWeight: "700",
    color: colors.text,
    fontSize: 16
  },
  meta: {
    color: colors.muted
  },
  footer: {
    marginBottom: 6
  }
});
