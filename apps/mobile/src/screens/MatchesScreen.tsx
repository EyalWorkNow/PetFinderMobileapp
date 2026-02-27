import { useQuery } from "@tanstack/react-query";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { AppCard, colors } from "../components/ui";
import type { MatchItem } from "../types/models";
import type { RootStackParamList } from "../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function MatchesScreen() {
  const auth = useAuth();
  const navigation = useNavigation<Navigation>();

  const matchesQuery = useQuery({
    queryKey: ["matches", auth.userId],
    queryFn: async () => {
      const response = await apiRequest<{ items: MatchItem[] }>("/matches", {
        accessToken: auth.accessToken,
        userId: auth.userId
      });
      return response.items;
    }
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={matchesQuery.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No matches yet. Publish a post to start matching.</Text>}
        renderItem={({ item }) => {
          const post = item.postA.userId === auth.userId ? item.postB : item.postA;
          return (
            <AppCard>
              <Text style={styles.matchTitle}>{post.title}</Text>
              <Text style={styles.matchMeta}>{item.band} MATCH • {Math.round(item.score * 100)}%</Text>
              <Text style={styles.matchMeta}>{post.type} • {post.petType}</Text>
              <Text
                style={styles.link}
                onPress={() => navigation.navigate("PostDetails", { postId: post.id })}
              >
                Open details
              </Text>
            </AppCard>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg
  },
  list: {
    padding: 14,
    gap: 10
  },
  empty: {
    textAlign: "center",
    marginTop: 24,
    color: colors.muted
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text
  },
  matchMeta: {
    color: colors.muted
  },
  link: {
    color: colors.primary,
    fontWeight: "700",
    marginTop: 6
  }
});
