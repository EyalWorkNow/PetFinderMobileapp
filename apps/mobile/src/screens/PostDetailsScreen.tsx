import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { AppButton, AppCard, colors } from "../components/ui";
import type { RootStackParamList } from "../navigation/types";
import type { Post } from "../types/models";

type Props = NativeStackScreenProps<RootStackParamList, "PostDetails">;

export function PostDetailsScreen({ route }: Props) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState("Hi, I think this may be related to my pet post.");

  const postQuery = useQuery({
    queryKey: ["post", route.params.postId, auth.userId],
    queryFn: () => apiRequest<Post>(`/posts/${route.params.postId}`, {
      accessToken: auth.accessToken,
      userId: auth.userId
    })
  });

  const contactMutation = useMutation({
    mutationFn: async () => apiRequest<{ revealedPhone: string | null }>(`/posts/${route.params.postId}/contact`, {
      method: "POST",
      accessToken: auth.accessToken,
      userId: auth.userId,
      body: {
        message: contactMessage
      }
    }),
    onSuccess: (data) => {
      setContactModalOpen(false);
      if (data.revealedPhone) {
        Alert.alert("Message sent", `Phone revealed: ${data.revealedPhone}`);
      } else {
        Alert.alert("Message sent", "The owner will receive your message in-app.");
      }
    },
    onError: (error) => Alert.alert("Failed", error instanceof Error ? error.message : "Unknown error")
  });

  const resolveMutation = useMutation({
    mutationFn: () => apiRequest(`/posts/${route.params.postId}/resolve`, {
      method: "POST",
      accessToken: auth.accessToken,
      userId: auth.userId
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["post", route.params.postId, auth.userId] });
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      await queryClient.invalidateQueries({ queryKey: ["my-posts", auth.userId] });
      Alert.alert("Resolved", "Post marked as resolved.");
    },
    onError: (error) => Alert.alert("Failed", error instanceof Error ? error.message : "Unknown error")
  });

  const sightingMutation = useMutation({
    mutationFn: async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        throw new Error("Location permission denied.");
      }
      const position = await Location.getCurrentPositionAsync({});
      return apiRequest(`/posts/${route.params.postId}/sightings`, {
        method: "POST",
        accessToken: auth.accessToken,
        userId: auth.userId,
        body: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: "User report",
          seenAt: new Date().toISOString(),
          note: "Shared from post details"
        }
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["post", route.params.postId, auth.userId] });
      Alert.alert("Thanks", "Sighting added.");
    },
    onError: (error) => Alert.alert("Failed", error instanceof Error ? error.message : "Unknown error")
  });

  const post = postQuery.data;

  if (!post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loading}>Loading post...</Text>
      </View>
    );
  }

  const isOwner = post.userId === auth.userId;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppCard>
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.meta}>{post.type} • {post.petType} • {post.status}</Text>
          <Text style={styles.description}>{post.shortDesc || "No description"}</Text>
        </AppCard>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
          {post.photos.map((photo) => (
            <Image
              key={photo.id}
              source={{ uri: photo.storagePath }}
              style={styles.photo}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        <AppCard>
          <Text style={styles.sectionTitle}>Attributes</Text>
          <Text style={styles.meta}>Size: {post.size}</Text>
          <Text style={styles.meta}>Colors: {post.colors.join(", ")}</Text>
          <Text style={styles.meta}>Collar: {post.collar ? `Yes (${post.collarColor ?? "unknown"})` : "No"}</Text>
          <Text style={styles.meta}>Breed: {post.breed ?? "Unknown"}</Text>
          <Text style={styles.meta}>Marks: {post.marksText ?? "None"}</Text>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Last seen</Text>
          <Text style={styles.meta}>{post.lastSeen.label ?? "Unknown label"}</Text>
          <Text style={styles.meta}>{post.lastSeen.lat.toFixed(4)}, {post.lastSeen.lng.toFixed(4)}</Text>
          <Text style={styles.meta}>Radius: {post.radiusKm} km</Text>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Actions</Text>
          {post.type === "FOUND" ? (
            <AppButton label="This is my pet" onPress={() => setContactModalOpen(true)} />
          ) : (
            <AppButton
              label="I saw this pet"
              onPress={() => sightingMutation.mutate()}
              loading={sightingMutation.isPending}
            />
          )}
          <AppButton label="Contact" tone="secondary" onPress={() => setContactModalOpen(true)} />
          {isOwner ? (
            <AppButton
              label="Mark as resolved"
              tone="danger"
              onPress={() => resolveMutation.mutate()}
              loading={resolveMutation.isPending}
            />
          ) : null}
        </AppCard>
      </ScrollView>

      <Modal transparent visible={contactModalOpen} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBody}>
            <Text style={styles.sectionTitle}>Send message</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              value={contactMessage}
              onChangeText={setContactMessage}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setContactModalOpen(false)}>
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>
              <AppButton
                label="Send"
                onPress={() => contactMutation.mutate()}
                loading={contactMutation.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg
  },
  loading: {
    color: colors.muted
  },
  content: {
    padding: 14,
    gap: 10,
    paddingBottom: 30
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text
  },
  meta: {
    color: colors.muted
  },
  description: {
    color: colors.text
  },
  sectionTitle: {
    fontWeight: "800",
    color: colors.text,
    fontSize: 16
  },
  photoRow: {
    gap: 10,
    paddingHorizontal: 2
  },
  photo: {
    width: 220,
    height: 160,
    borderRadius: 12,
    backgroundColor: colors.border
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)"
  },
  modalBody: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    gap: 10
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    minHeight: 110,
    textAlignVertical: "top",
    padding: 10,
    color: colors.text
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  cancel: {
    color: colors.muted,
    fontWeight: "700"
  }
});
