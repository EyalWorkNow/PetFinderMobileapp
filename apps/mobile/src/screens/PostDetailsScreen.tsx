import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Dimensions, Share } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Circle } from "react-native-maps";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  Moon,
  LocationTick,
  ShieldTick,
  ExportCurve,
  ArrowLeft2,
  Call,
  MessageText,
  Pet,
  Maximize4,
  Tag,
  Colorfilter,
  Printer
} from "iconsax-react-native";
import { useAuth } from "../context/AuthContext";
import { useAcoustics } from "../context/AudioContext";
import { useTranslation } from "../i18n/useTranslation";
import { apiRequest } from "../lib/api";
import { AppButton, colors, darkColors } from "../components/ui";
import { Confetti } from "../components/Confetti";
import { generatePosterHtml } from "../utils/PosterTemplate";
import type { RootStackParamList } from "../navigation/types";
import type { Post } from "../types/models";

type Props = NativeStackScreenProps<RootStackParamList, "PostDetails">;

export function PostDetailsScreen({ route, navigation }: Props) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { playSound } = useAcoustics();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState("Hi, I think this may be related to my pet post.");
  const [showConfetti, setShowConfetti] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useTranslation();

  const { width: windowWidth, height: windowHeight } = Dimensions.get("window");

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const postQuery = useQuery({
    queryKey: ["post", route.params.postId, auth.userId],
    queryFn: () => apiRequest<Post>(`/posts/${route.params.postId}`, {
      accessToken: auth.accessToken,
      userId: auth.userId
    })
  });

  const post = postQuery.data;

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBroadcasting) {
      interval = setInterval(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
        sightingMutation.mutate();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isBroadcasting]);

  const toggleBroadcast = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => { });
    setIsBroadcasting(prev => !prev);
    if (!isBroadcasting) {
      Alert.alert("Live Pursuit Started", "Broadcasting your live location every 5 seconds as active sightings.");
    }
  };

  const contactMutation = useMutation({
    mutationFn: async () => apiRequest<{ revealedPhone: string | null }>(`/posts/${route.params.postId}/contact`, {
      method: "POST",
      accessToken: auth.accessToken,
      userId: auth.userId,
      body: { message: contactMessage }
    }),
    onSuccess: (data) => {
      setContactModalOpen(false);
      if (data.revealedPhone) {
        playSound("success");
        Alert.alert("Message sent", `Phone revealed: ${data.revealedPhone}`);
      } else {
        playSound("sweep");
        Alert.alert("Message sent", "The owner will receive your message in-app.");
      }
    },
    onError: (error) => {
      playSound("error");
      Alert.alert("Failed", error instanceof Error ? error.message : "Unknown error");
    }
  });

  const resolveMutation = useMutation({
    mutationFn: () => apiRequest(`/posts/${route.params.postId}/resolve`, {
      method: "POST",
      accessToken: auth.accessToken,
      userId: auth.userId
    }),
    onSuccess: () => {
      playSound("success");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  });

  const sightingMutation = useMutation({
    mutationFn: async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") throw new Error("Location permission denied.");
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
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
    onSuccess: () => {
      Alert.alert("Thanks", "Sighting added.");
      queryClient.invalidateQueries({ queryKey: ["post", route.params.postId, auth.userId] });
    }
  });

  const generateAndSharePoster = async () => {
    if (!post) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=petfind://post/${post.id}`;
      const heroPhoto = post.photos && post.photos.length > 0 ? post.photos[0].storagePath : "https://images.unsplash.com/photo-1543466835-00a7907e9de1";

      const html = generatePosterHtml({
        imageUrl: heroPhoto,
        title: post.title,
        type: post.type,
        breed: post.breed || t("Unknown"),
        size: post.size,
        color: (post.colors || []).join(", "),
        lastSeenTime: new Date(post.lastSeenTime).toLocaleString(),
        lastSeenPlace: post.lastSeen.label || t("Unknown"),
        contactMethod: post.contactMethod,
        contactPhone: post.contactPhone || undefined,
        qrData: qrUrl,
        primaryColor: theme.primary,
        labels: {
          titleText: post.type === "LOST" ? t("PosterLostTitle") : t("PosterFoundTitle"),
          breedLabel: t("Breed"),
          colorLabel: t("Color"),
          lastSeenLabel: t("LastSeen"),
          whenLabel: t("When"),
          contactTitle: t("Contact"),
          preferredMethod: t("PreferredMethod"),
          scanLabel: t("ScanToReport"),
          tagline: t("PosterTagline"),
          isRTL,
        }
      });

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
    } catch (error) {
      console.error(error);
      Alert.alert("Poster Error", "Could not generate rescue poster.");
    }
  };

  const shareFlyer = async () => {
    if (!post) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Share.share({
        title: `🚨 ${post.type === "LOST" ? "LOST PET" : "FOUND PET"}: ${post.title}`,
        message: `🚨 ${post.type === "LOST" ? "PLEASE HELP!" : "PET FOUND!"}\n\n` +
          `🐶 ${post.title}\n` +
          `📍 Last seen: ${post.lastSeen.label || "Unknown"}\n` +
          `Contact via PetFind App: ${post.contactPhone || "In-app message"}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (postQuery.isLoading || !post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loading}>{postQuery.isLoading ? "Loading post..." : "Post not found."}</Text>
      </View>
    );
  }

  const isOwner = post.userId === auth.userId;
  const lastSeenDate = post.lastSeenTime ? new Date(post.lastSeenTime) : new Date();
  const hour = lastSeenDate.getHours();
  const isNightSighting = hour < 6 || hour >= 18;
  const theme = isNightSighting ? darkColors : colors;
  const safePhotos = post.photos ?? [];
  const safeColors = post.colors ?? [];
  const safeSightings = post.sightings ?? [];
  const heroPhoto = safePhotos.length > 0 ? safePhotos[0].storagePath : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* TOP FLOATING HEADER */}
      <View style={{
        position: "absolute",
        top: Math.max(insets.top, 20),
        left: 20,
        right: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 100,
      }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.floatingButton, { backgroundColor: theme.surface }]}
        >
          <ArrowLeft2 size={24} color={theme.text} />
        </Pressable>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={generateAndSharePoster}
            style={[styles.floatingButton, { backgroundColor: theme.surface }]}
          >
            <Printer size={24} color={theme.primary} variant="Bulk" />
          </Pressable>
          <Pressable
            onPress={shareFlyer}
            style={[styles.floatingButton, { backgroundColor: theme.surface }]}
          >
            <ExportCurve size={24} color={theme.primary} variant="Outline" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {heroPhoto ? (
          <Image source={{ uri: heroPhoto }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImage, { backgroundColor: theme.border, justifyContent: "center", alignItems: "center" }]}>
            <Text style={{ color: theme.muted }}>No photos available</Text>
          </View>
        )}

        <View style={[styles.contentSheet, { backgroundColor: theme.surface, minHeight: windowHeight * 0.6 }]}>
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, marginBottom: 16 }} />
            <Text style={[styles.title, { color: theme.text }]}>{post.title}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
              <View style={[styles.badge, { backgroundColor: theme.primarySoft }]}>
                <ShieldTick size={16} color={theme.primary} variant="Bold" style={{ marginRight: 4 }} />
                <Text style={{ color: theme.primary, fontWeight: "800", fontSize: 12 }}>Verified</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: theme.border }]}>
                <Text style={{ color: theme.text, fontWeight: "800", fontSize: 12 }}>{post.status}</Text>
              </View>
            </View>
          </View>

          {isNightSighting && (
            <View style={[styles.nocturnalBox, { backgroundColor: theme.primarySoft }]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Moon size={18} color={theme.primary} variant="Bulk" style={{ marginRight: 8 }} />
                <Text style={{ color: theme.primary, fontWeight: "800" }}>Nocturnal Sighting</Text>
              </View>
              <Text style={{ color: theme.primary, opacity: 0.8, fontSize: 13, marginTop: 4 }}>Last seen during nighttime.</Text>
            </View>
          )}

          <View style={styles.statsGrid}>
            <StatItem icon={<Maximize4 size={14} color={theme.muted} />} label="Size" value={post.size} theme={theme} />
            <StatItem icon={<Tag size={14} color={theme.muted} />} label="Breed" value={post.breed || "Common"} theme={theme} />
            <StatItem icon={<Colorfilter size={14} color={theme.muted} />} label="Color" value={safeColors[0] || "Mixed"} theme={theme} />
            <StatItem icon={<Pet size={14} color={theme.muted} />} label="Type" value={post.petType} theme={theme} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
            <Text style={{ color: theme.text, opacity: 0.7, lineHeight: 22 }}>
              {post.shortDesc || "No description provided."}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <LocationTick size={22} color={theme.text} variant="Bold" style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Location</Text>
            </View>
            <Text style={{ color: theme.muted, marginBottom: 12 }}>{post.lastSeen.label}</Text>
            <View style={styles.mapWrap}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: post.lastSeen.lat,
                  longitude: post.lastSeen.lng,
                  latitudeDelta: 0.01 * post.radiusKm,
                  longitudeDelta: 0.01 * post.radiusKm,
                }}
                scrollEnabled={false}
              >
                <Circle
                  center={{ latitude: post.lastSeen.lat, longitude: post.lastSeen.lng }}
                  radius={post.radiusKm * 1000}
                  fillColor="rgba(251, 146, 60, 0.2)"
                  strokeColor={theme.primary}
                />
              </MapView>
            </View>
          </View>

          {safeSightings.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Sightings ({safeSightings.length})</Text>
              {safeSightings.map((s, i) => (
                <View key={s.id} style={styles.sightItem}>
                  <View style={[styles.dot, { backgroundColor: i === 0 ? theme.primary : theme.muted }]} />
                  <View style={styles.sightContent}>
                    <Text style={{ color: theme.text, fontWeight: "700" }}>{s.label || "Report"}</Text>
                    <Text style={{ color: theme.muted, fontSize: 12 }}>{new Date(s.seenAt).toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.actionBar, { backgroundColor: theme.surface, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={{ flex: 1 }}>
          <AppButton
            label={post.type === "LOST" ? (isBroadcasting ? "Stop Pursuit" : "I saw this pet") : (isOwner ? "Resolve" : "This is my pet")}
            tone={(isBroadcasting || (post.type === "FOUND" && isOwner)) ? "danger" : "primary"}
            onPress={() => post.type === "LOST" ? (isBroadcasting ? toggleBroadcast() : sightingMutation.mutate()) : (isOwner ? resolveMutation.mutate() : setContactModalOpen(true))}
            style={{ borderRadius: 30 }}
          />
        </View>
        <Pressable onPress={generateAndSharePoster} style={[styles.actionCircle, { backgroundColor: theme.primarySoft }]}>
          <Printer size={22} color={theme.primary} variant="Bulk" />
        </Pressable>
        <Pressable onPress={() => setContactModalOpen(true)} style={styles.actionCircle}>
          <Call size={22} color={theme.muted} />
        </Pressable>
        <Pressable onPress={() => setContactModalOpen(true)} style={styles.actionCircle}>
          <MessageText size={22} color={theme.muted} />
        </Pressable>
      </View>

      <Modal transparent visible={contactModalOpen} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBody, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Owner</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: theme.border, color: theme.text }]}
              multiline
              value={contactMessage}
              onChangeText={setContactMessage}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setContactModalOpen(false)}>
                <Text style={{ color: theme.muted }}>Cancel</Text>
              </Pressable>
              <AppButton label="Send" onPress={() => contactMutation.mutate()} loading={contactMutation.isPending} />
            </View>
          </View>
        </View>
      </Modal>

      <Confetti active={showConfetti} />
    </View>
  );
}

function StatItem({ icon, label, value, theme }: any) {
  return (
    <View style={[styles.statCard, { borderColor: theme.border }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <View style={{ padding: 4, borderRadius: 8, backgroundColor: theme.border }}>{icon}</View>
        <Text style={{ fontSize: 13, color: theme.muted, fontWeight: "600" }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: "800", color: theme.text }} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  loading: { fontSize: 16 },
  heroImage: { width: "100%", height: Dimensions.get("window").height * 0.5 },
  contentSheet: { borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -40, padding: 24, gap: 24 },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  title: { fontSize: 28, fontWeight: "900", textAlign: "center" },
  nocturnalBox: { padding: 16, borderRadius: 20 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "48%", padding: 12, borderWidth: 1, borderRadius: 20 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  mapWrap: { height: 200, borderRadius: 24, overflow: "hidden" },
  map: { width: "100%", height: "100%" },
  sightItem: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  sightContent: { flex: 1 },
  actionBar: { flexDirection: "row", alignItems: "center", padding: 16, borderTopWidth: 1, borderColor: "rgba(0,0,0,0.05)", gap: 10 },
  actionCircle: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" },
  floatingButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", elevation: 4, shadowOpacity: 0.1 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalBody: { padding: 24, borderTopLeftRadius: 30, borderTopRightRadius: 30, gap: 16 },
  modalInput: { borderWidth: 1, borderRadius: 12, padding: 12, height: 100, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }
});
