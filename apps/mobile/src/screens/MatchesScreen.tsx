import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet, Text, View, Animated, PanResponder, Dimensions, Pressable, Image
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { Radar, MagicStar, ShieldTick, Heart, CloseSquare, InfoCircle } from "iconsax-react-native";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { colors, useThemeColors, SkeletonBox } from "../components/ui";
import { apiRequest } from "../lib/api";
import { Confetti } from "../components/Confetti";
import type { MatchItem } from "../types/models";
import type { RootStackParamList } from "../navigation/types";

const { width, height } = Dimensions.get("window");
const SWIPE_THRESHOLD = 120;
const SWIPE_OUT_DURATION = 250;

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function MatchesScreen() {
  const auth = useAuth();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const theme = useThemeColors();
  const { showToast } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const position = useRef(new Animated.ValueXY()).current;

  const matchesQuery = useQuery({
    queryKey: ["matches", auth.userId],
    queryFn: async () => {
      const start = Date.now();
      const data = await apiRequest<{ items: MatchItem[] }>("/matches", {
        accessToken: auth.accessToken,
        userId: auth.userId
      });
      const elapsed = Date.now() - start;
      if (elapsed < 3000) {
        await new Promise(r => setTimeout(r, 3000 - elapsed));
      }
      return data.items;
    }
  });

  const matches = matchesQuery.data ?? [];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          forceSwipe("right");
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          forceSwipe("left");
        } else {
          resetPosition();
        }
      }
    })
  ).current;

  const forceSwipe = (direction: "right" | "left") => {
    const x = direction === "right" ? width * 1.5 : -width * 1.5;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false
    }).start(() => onSwipeComplete(direction));
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 4,
      useNativeDriver: false
    }).start();
  };

  const onSwipeComplete = (direction: "right" | "left") => {
    const item = matches[currentIndex];

    if (direction === "right") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (item.band === "HIGH") {
        triggerCelebration();
      } else {
        showToast({ message: "Match Saved ✅", durationMs: 2000 });
      }
      // Real app would make API call to save here
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      // Delete match optimistic update
      const previousMatches = queryClient.getQueryData<MatchItem[]>(["matches", auth.userId]);
      if (previousMatches) {
        queryClient.setQueryData<MatchItem[]>(["matches", auth.userId], previousMatches.filter(m => m.id !== item.id));
      }
    }

    position.setValue({ x: 0, y: 0 });
    setCurrentIndex(prev => prev + 1);
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  if (matchesQuery.isLoading) {
    return (
      <View style={[styles.container, { padding: 24, gap: 16 }]}>
        <StoryLoader theme={theme} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <SkeletonBox width="100%" height={height * 0.6} style={{ borderRadius: 32 }} />
        </View>
      </View>
    );
  }

  const renderCards = () => {
    if (currentIndex >= matches.length) {
      return (
        <View style={styles.emptyWrap}>
          <Radar size={80} color={theme.primary} variant="Bulk" style={{ marginBottom: 12 }} />
          <Text style={[styles.empty, { color: theme.text }]}>Radar is Clear</Text>
          <Text style={[styles.emptySub, { color: theme.muted }]}>
            We've analyzed all current reports. We will ping you if new matches arise.
          </Text>
        </View>
      );
    }

    return matches.map((item, i) => {
      if (i < currentIndex) return null;

      const post = auth.userId && item.postA.userId === auth.userId ? item.postB : item.postA;
      if (!post) return null;

      const isTopCard = i === currentIndex;

      const cardStyle = isTopCard ? {
        transform: [
          { translateX: position.x },
          { translateY: position.y },
          {
            rotate: position.x.interpolate({
              inputRange: [-width * 1.5, 0, width * 1.5],
              outputRange: ["-30deg", "0deg", "30deg"]
            })
          }
        ]
      } : {
        transform: [
          { scale: 0.95 - (i - currentIndex) * 0.05 },
          { translateY: (i - currentIndex) * 20 }
        ],
        opacity: 1 - (i - currentIndex) * 0.2
      };

      const likeOpacity = position.x.interpolate({
        inputRange: [0, width * 0.25],
        outputRange: [0, 1],
        extrapolate: "clamp"
      });

      const nopeOpacity = position.x.interpolate({
        inputRange: [-width * 0.25, 0],
        outputRange: [1, 0],
        extrapolate: "clamp"
      });

      return (
        <Animated.View
          key={item.id}
          style={[
            styles.cardContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
            cardStyle,
            { zIndex: matches.length - i }
          ]}
          {...(isTopCard ? panResponder.panHandlers : {})}
        >
          <View style={styles.imageContainer}>
            {post.photos && post.photos.length > 0 ? (
              <Image source={{ uri: post.photos[0].storagePath }} style={styles.image} />
            ) : (
              <View style={[styles.image, { backgroundColor: theme.border, alignItems: "center", justifyContent: "center" }]}>
                <Radar size={48} color={theme.muted} variant="Outline" />
              </View>
            )}

            {/* Swipe Indicators */}
            {isTopCard && (
              <>
                <Animated.View style={[styles.likeIndicator, { opacity: likeOpacity, borderColor: theme.success }]}>
                  <Text style={[styles.indicatorText, { color: theme.success }]}>CONNECT</Text>
                </Animated.View>
                <Animated.View style={[styles.nopeIndicator, { opacity: nopeOpacity, borderColor: theme.danger }]}>
                  <Text style={[styles.indicatorText, { color: theme.danger }]}>DISMISS</Text>
                </Animated.View>
              </>
            )}

            <View style={styles.gradientOverlay}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, item.band === "HIGH" ? { backgroundColor: theme.dangerSoft } : { backgroundColor: "#FEF3C7" }]}>
                  <Text style={[styles.badgeText, { color: item.band === "HIGH" ? theme.danger : "#B45309" }]}>
                    {item.band} MATCH • {Math.round(item.score * 100)}%
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.title} numberOfLines={1}>{post.title}</Text>
                <Text style={styles.meta}>{post.type} • {post.petType} {post.breed && `• ${post.breed}`}</Text>

                <View style={styles.aiReasoning}>
                  <MagicStar size={16} color="#FBBF24" variant="Bulk" />
                  <Text style={styles.aiText} numberOfLines={2}>
                    AI linked via: {post.colors?.join(", ")} {post.lastSeen?.label ? `near ${post.lastSeen.label}` : ""}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions (Tap) */}
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionBtn, { borderColor: theme.danger }]}
              onPress={() => forceSwipe("left")}
            >
              <CloseSquare size={32} color={theme.danger} variant="Outline" />
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { borderColor: theme.primary, width: 64, height: 64, borderRadius: 32 }]}
              onPress={() => navigation.navigate("PostDetails", { postId: post.id })}
            >
              <InfoCircle size={32} color={theme.primary} variant="Bulk" />
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { borderColor: theme.success }]}
              onPress={() => forceSwipe("right")}
            >
              <Heart size={32} color={theme.success} variant="Bold" />
            </Pressable>
          </View>

        </Animated.View>
      );
    }).reverse();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.deckContainer}>
        {renderCards()}
      </View>
      {showCelebration && <Confetti />}
    </View>
  );
}

function StoryLoader({ theme }: { theme: any }) {
  const [step, setStep] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const stories = [
    "Initializing AI Swarm Logic...",
    "Scanning grid sectors for anomalies...",
    "Cross-referencing biological markers...",
    "Generating probability vectors..."
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true })
      ]).start();
      setStep((s) => (s + 1) % stories.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.storyOverlay}>
      <Animated.Text style={[styles.storyText, { color: theme.primary, opacity: fadeAnim }]}>
        {stories[step]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  deckContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 60 },
  emptyWrap: { alignItems: "center", justifyContent: "center", padding: 40 },
  empty: { fontSize: 24, fontWeight: "900", marginBottom: 8 },
  emptySub: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  cardContainer: {
    position: "absolute",
    width: width * 0.9,
    height: height * 0.65,
    borderRadius: 32,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    overflow: "hidden"
  },
  imageContainer: { flex: 1, position: "relative" },
  image: { ...StyleSheet.absoluteFillObject, resizeMode: "cover" },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "space-between",
    padding: 24
  },
  cardHeader: { flexDirection: "row", justifyContent: "flex-end" },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, overflow: 'hidden' },
  badgeText: { fontSize: 13, fontWeight: "900" },
  cardFooter: { gap: 6, backgroundColor: "rgba(0,0,0,0.4)", padding: 16, borderRadius: 20, backdropFilter: "blur(10px)" },
  title: { fontSize: 28, fontWeight: "900", color: "#fff" },
  meta: { fontSize: 16, fontWeight: "600", color: "rgba(255,255,255,0.8)" },
  aiReasoning: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  aiText: { flex: 1, color: "#FBBF24", fontSize: 13, fontWeight: "500" },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 24,
    paddingBottom: 32,
    backgroundColor: "rgba(0,0,0,0.8)" // Very dark for contrast
  },
  actionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  likeIndicator: {
    position: "absolute",
    top: 40,
    left: 40,
    borderWidth: 4,
    borderRadius: 12,
    padding: 8,
    transform: [{ rotate: "-20deg" }],
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.8)"
  },
  nopeIndicator: {
    position: "absolute",
    top: 40,
    right: 40,
    borderWidth: 4,
    borderRadius: 12,
    padding: 8,
    transform: [{ rotate: "20deg" }],
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.8)"
  },
  indicatorText: { fontSize: 28, fontWeight: "900", letterSpacing: 2 },
  storyOverlay: { paddingVertical: 16, alignItems: "center", justifyContent: "center", position: "absolute", top: 80, left: 0, right: 0 },
  storyText: { fontSize: 16, fontWeight: "800", textAlign: "center" }
});
