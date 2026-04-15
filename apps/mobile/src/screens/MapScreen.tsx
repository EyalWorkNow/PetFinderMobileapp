import { useQuery, keepPreviousData } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  Keyboard,
} from "react-native";
import { MagicStar, CloseCircle, ArrowUp2, CloseSquare, EyeSlash, ArrowRight2, Edit2, Activity, Timer, Radar, FilterSearch, Hierarchy, Security, LocationAdd } from "iconsax-react-native";
// NOTE: Heatmap is not supported in Expo Go – we use a safe lazy import with fallback
import MapView, { Marker, Region, Circle, Polygon, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { GhostSightingModal } from "../components/map/GhostSightingModal";

// Ray-casting algorithm to figure out if a point is inside a polygon
function isPointInPolygon(point: { lat: number; lng: number }, polygon: { latitude: number; longitude: number }[]) {
  if (polygon.length < 3) return false;
  const x = point.lng, y = point.lat;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude, yi = polygon[i].latitude;
    const xj = polygon[j].longitude, yj = polygon[j].latitude;
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

import * as Haptics from "expo-haptics";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CompositeNavigationProp, useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import { useAcoustics } from "../context/AudioContext";
import { apiRequest } from "../lib/api";
import { AppCard, useThemeColors } from "../components/ui";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";
import type { PetType, Post, PostType } from "../types/models";
import { useTranslation } from "../i18n/useTranslation";

const INITIAL_REGION: Region = {
  latitude: 31.5, // Center of Israel roughly
  longitude: 34.8,
  latitudeDelta: 3.5,
  longitudeDelta: 3.5
};

type Navigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Map">,
  NativeStackNavigationProp<RootStackParamList>
>;

export function MapScreen() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const navigation = useNavigation<Navigation>();
  const auth = useAuth();
  const { playSound } = useAcoustics();
  const { t } = useTranslation();
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [filterType, setFilterType] = useState<PostType | "ALL">("ALL");
  const [filterPetType, setFilterPetType] = useState<PetType | "ALL">("ALL");
  const [sinceDays] = useState<1 | 7 | 30>(7);
  const [radiusKm, setRadiusKm] = useState<number | "ALL">("ALL");
  const [showAlertZone, setShowAlertZone] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState<{ latitude: number, longitude: number }[]>([]);
  const [omniQuery, setOmniQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [isAnalyzingOmni, setIsAnalyzingOmni] = useState(false);
  const [hiddenPosts, setHiddenPosts] = useState<string[]>([]);
  const [timeLapseDays, setTimeLapseDays] = useState<number | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Tactical Mode & Ghost Sighting
  const [isTacticalMode, setIsTacticalMode] = useState(false);
  const [searchTrail, setSearchTrail] = useState<{ latitude: number, longitude: number }[]>([]);
  const [longPressPin, setLongPressPin] = useState<{ latitude: number, longitude: number } | null>(null);
  const [showGhostModal, setShowGhostModal] = useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    async function fetchLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
      setRegion((prev) => ({
        ...prev,
        latitude: current.coords.latitude,
        longitude: current.coords.longitude
      }));
    }
    fetchLocation().catch(() => undefined);
  }, []);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    if (isTacticalMode) {
      Location.watchPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 5
      }, (loc) => {
        setSearchTrail(prev => [...prev, { latitude: loc.coords.latitude, longitude: loc.coords.longitude }]);
      }).then(sub => { subscription = sub; });
    } else {
      setSearchTrail([]);
    }
    return () => {
      if (subscription) subscription.remove();
    };
  }, [isTacticalMode]);

  const queryString = useMemo(() => {
    const params: string[] = [];
    if (radiusKm !== "ALL") {
      params.push(`lat=${region.latitude}`);
      params.push(`lng=${region.longitude}`);
      params.push(`radiusKm=${radiusKm}`);
    }
    params.push(`sinceDays=${sinceDays}`);
    if (filterType !== "ALL") {
      params.push(`type=${filterType}`);
    }
    if (filterPetType !== "ALL") {
      params.push(`petType=${filterPetType}`);
    }
    return params.join('&');
  }, [filterPetType, filterType, radiusKm, region.latitude, region.longitude, sinceDays]);

  const postsQuery = useQuery({
    queryKey: ["posts", queryString],
    queryFn: async () => {
      console.log(`[Map] Fetching posts with query: ${queryString}`);
      const response = await apiRequest<{ items: Post[] }>(`/posts?${queryString}`, {
        accessToken: auth.accessToken,
        userId: auth.userId
      });
      console.log(`[Map] Received ${response.items.length} markers`);
      return response.items;
    },
    placeholderData: keepPreviousData
  });

  const displayPosts = useMemo(() => {
    const posts = postsQuery.data ?? [];
    let fetched = posts.filter(p => p?.lastSeen?.lat != null && p?.lastSeen?.lng != null);

    if (hiddenPosts.length > 0) {
      fetched = fetched.filter(p => !hiddenPosts.includes(p.id));
    }

    if (timeLapseDays !== null) {
      fetched = fetched.filter(p => {
        const postDate = new Date(p.createdAt).getTime();
        const ageInDays = (Date.now() - postDate) / (1000 * 60 * 60 * 24);
        return ageInDays >= timeLapseDays;
      });
    }

    if (drawnPolygon.length > 2 && !isDrawingMode) {
      fetched = fetched.filter(p => isPointInPolygon({ lat: p.lastSeen.lat, lng: p.lastSeen.lng }, drawnPolygon));
    }

    if (appliedQuery.trim().length > 0) {
      const queryWords = appliedQuery.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      fetched = fetched.filter(p => {
        const searchableText = [
          p.title,
          p.shortDesc,
          p.breed,
          p.colors?.join(" "),
          p.marksText
        ].filter(Boolean).join(" ").toLowerCase();

        return queryWords.every(word => searchableText.includes(word));
      });
    }

    return fetched;
  }, [postsQuery.data, drawnPolygon, isDrawingMode, hiddenPosts, timeLapseDays, appliedQuery]);

  const heatmapPoints = useMemo(() => {
    return displayPosts.flatMap(post => {
      if (post.type !== "LOST") return [];
      const pts = [{ latitude: post.lastSeen.lat, longitude: post.lastSeen.lng, weight: 1 }];
      const numSearchers = 8;
      for (let i = 0; i < numSearchers; i++) {
        pts.push({
          latitude: post.lastSeen.lat + (Math.random() - 0.5) * 0.001,
          longitude: post.lastSeen.lng + (Math.random() - 0.5) * 0.001,
          weight: 0.2 + Math.random() * 0.5
        });
      }
      return pts;
    });
  }, [displayPosts]);

  const handleOmniSearch = async () => {
    if (!omniQuery.trim()) return;
    Keyboard.dismiss();
    setIsAnalyzingOmni(true);
    setDrawnPolygon([]);

    // Simulate LLM Network Latency
    await new Promise(r => setTimeout(r, 1200));

    const lowerQuery = omniQuery.toLowerCase();
    playSound("success");

    // Naive Regex NLP Engine for Demonstration
    if (lowerQuery.includes("כלב") || lowerQuery.includes("dog")) setFilterPetType("DOG");
    else if (lowerQuery.includes("חתול") || lowerQuery.includes("cat")) setFilterPetType("CAT");
    else if (lowerQuery.includes("תוכי") || lowerQuery.includes("parrot")) setFilterPetType("PARROT");

    // Extracting search terms without the keywords
    const cleanQuery = lowerQuery
      .replace(/כלב|dog|חתול|cat|תוכי|parrot/g, "")
      .trim();

    setAppliedQuery(cleanQuery);
    setRadiusKm("ALL"); // Reset radius
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
    setIsAnalyzingOmni(false);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        region={region}
        scrollEnabled={!isDrawingMode}
        onPanDrag={(e) => {
          if (!isDrawingMode) return;
          // React Native can sometimes nullify synchronous synthetic events
          const coordinate = e?.nativeEvent?.coordinate;
          if (coordinate) {
            setDrawnPolygon(prev => [...prev, coordinate]);
          }
        }}
        onRegionChangeComplete={(r) => {
          if (!isDrawingMode) setRegion(r);
        }}
        onLongPress={(e) => {
          const coord = e.nativeEvent.coordinate;
          if (coord) {
            setLongPressPin(coord);
            setShowGhostModal(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }}
      >
        {isTacticalMode && searchTrail.length > 1 && (
          <Polyline
            coordinates={searchTrail}
            strokeColor={colors.primary}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
            lineDashPattern={[1, 5]}
          />
        )}
        {drawnPolygon.length > 2 && (
          <Polygon
            coordinates={drawnPolygon}
            fillColor="rgba(80, 102, 230, 0.2)"
            strokeColor="rgba(80, 102, 230, 0.8)"
            strokeWidth={2}
          />
        )}
        {/* Heatmap is not available in Expo Go – show a visual fallback overlay instead */}
        {showHeatmap && heatmapPoints.length > 0 && heatmapPoints.slice(0, 60).map((pt, i) => (
          <Marker
            key={`heat-${i}`}
            coordinate={{ latitude: pt.latitude, longitude: pt.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            opacity={(pt.weight ?? 0.5) * 0.6}
          >
            <View style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: `rgba(230, 71, 46, ${(pt.weight ?? 0.5) * 0.7})`,
            }} />
          </Marker>
        ))}
        {showAlertZone && radiusKm !== "ALL" && (
          <Circle
            center={{ latitude: region.latitude, longitude: region.longitude }}
            radius={radiusKm * 1000}
            fillColor="rgba(80, 102, 230, 0.1)"
            strokeColor="rgba(80, 102, 230, 0.4)"
            strokeWidth={2}
          />
        )}
        {displayPosts.map((post) => {
          const lat = post.lastSeen?.lat ?? region.latitude;
          const lng = post.lastSeen?.lng ?? region.longitude;
          const coordinate = { latitude: lat, longitude: lng };

          const postDate = new Date(post.createdAt).getTime();
          const now = Date.now();
          const ageInDays = (now - postDate) / (1000 * 60 * 60 * 24);
          const decayOpacity = Math.max(0.35, 1 - (ageInDays / 30) * 0.65);

          return (
            <Marker
              key={post.id}
              coordinate={coordinate}
              opacity={decayOpacity}
              title={post.title}
              description={`${post.type} • ${post.petType}`}
              pinColor={post.type === "LOST" ? "#D62828" : "#2A9D8F"}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                navigation.navigate("PostDetails", { postId: post.id });
              }}
            />
          );
        })}
        {longPressPin && (
          <Marker coordinate={longPressPin} pinColor="#F59E0B">
            <View style={[styles.ghostPinMarker, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }]}>
              <LocationAdd size={16} color="#F59E0B" variant="Bold" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Floating UI Layer */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        <View style={styles.omniBarContainer}>
          <View style={styles.omniBar}>
            <MagicStar size={20} color={colors.primary} variant="Bold" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.omniInput}
              placeholder={t("OmniSearchPlaceholder")}
              placeholderTextColor={colors.muted}
              value={omniQuery}
              onChangeText={setOmniQuery}
              onSubmitEditing={handleOmniSearch}
              returnKeyType="search"
            />
            {isAnalyzingOmni ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : omniQuery.length > 0 ? (
              <TouchableOpacity onPress={() => { playSound("pop"); setOmniQuery(""); setAppliedQuery(""); setFilterPetType("ALL"); }}>
                <CloseCircle size={20} color={colors.muted} variant="Outline" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Right-Side Spatial Tools Dock */}
        <View style={styles.spatialDock}>
          <FloatingActionButton
            icon={<Edit2 size={24} color={isDrawingMode || drawnPolygon.length > 0 ? colors.surface : colors.text} variant={isDrawingMode ? "Bold" : "Outline"} />}
            active={isDrawingMode || drawnPolygon.length > 0}
            onPress={() => {
              playSound("pop");
              if (drawnPolygon.length > 0 && !isDrawingMode) setDrawnPolygon([]);
              else if (isDrawingMode) setIsDrawingMode(false);
              else { setIsDrawingMode(true); setDrawnPolygon([]); setRadiusKm("ALL"); }
            }}
          />
          <FloatingActionButton
            icon={<Activity size={24} color={showHeatmap ? colors.surface : colors.text} variant={showHeatmap ? "Bold" : "Outline"} />}
            active={showHeatmap}
            onPress={() => { playSound("pop"); setShowHeatmap(!showHeatmap); }}
          />
          <FloatingActionButton
            icon={<Security size={24} color={isTacticalMode ? colors.surface : colors.text} variant={isTacticalMode ? "Bold" : "Outline"} />}
            active={isTacticalMode}
            onPress={() => {
              playSound("pop");
              setIsTacticalMode(!isTacticalMode);
              if (!isTacticalMode) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }}
          />
          <FloatingActionButton
            icon={<Timer size={24} color={timeLapseDays !== null ? colors.surface : colors.text} variant={timeLapseDays !== null ? "Bold" : "Outline"} />}
            active={timeLapseDays !== null}
            onPress={() => { playSound("pop"); setTimeLapseDays(curr => curr !== null ? null : 30); }}
          />
          <FloatingActionButton
            icon={<Radar size={24} color={showAlertZone ? colors.surface : colors.text} variant={showAlertZone ? "Bold" : "Outline"} />}
            active={showAlertZone}
            onPress={() => { playSound("pop"); setShowAlertZone(!showAlertZone); }}
          />
        </View>

        {/* Left-Side Data Filter FAB & Flyout */}
        <View style={styles.filterDock}>
          <FloatingActionButton
            icon={<FilterSearch size={24} color={showFilterMenu ? colors.surface : colors.text} variant={showFilterMenu ? "Bold" : "Outline"} />}
            active={showFilterMenu}
            onPress={() => { playSound("pop"); setShowFilterMenu(!showFilterMenu); }}
          />
          {showFilterMenu && (
            <View style={styles.filterFlyout}>
              <View style={styles.flyoutRow}>
                <Pressable
                  onPress={() => { playSound("pop"); setFilterType(curr => curr === "LOST" ? "ALL" : "LOST"); }}
                  style={[styles.chip, filterType === "LOST" ? styles.chipActive : null]}
                >
                  <Text style={[styles.chipText, filterType === "LOST" ? styles.chipTextActive : null]}>{t("LOST")}</Text>
                </Pressable>
                <Pressable
                  onPress={() => { playSound("pop"); setFilterType(curr => curr === "FOUND" ? "ALL" : "FOUND"); }}
                  style={[styles.chip, filterType === "FOUND" ? styles.chipActive : null]}
                >
                  <Text style={[styles.chipText, filterType === "FOUND" ? styles.chipTextActive : null]}>{t("FOUND")}</Text>
                </Pressable>
              </View>
              <View style={styles.flyoutDivider} />
              <View style={[styles.flyoutRow, { flexWrap: "wrap", justifyContent: "flex-start" }]}>
                {["DOG", "CAT", "PARROT"].map((pet) => (
                  <Pressable
                    key={pet}
                    onPress={() => { playSound("pop"); setFilterPetType(curr => curr === pet ? "ALL" : pet as any); }}
                    style={[styles.chip, filterPetType === pet ? styles.chipActive : null, { paddingHorizontal: 10, paddingVertical: 8 }]}
                  >
                    <Hierarchy size={16} color={filterPetType === pet ? colors.primary : colors.muted} variant={filterPetType === pet ? "Bold" : "Outline"} />
                    <Text style={[styles.chipText, filterPetType === pet ? styles.chipTextActive : null, { fontSize: 13, marginLeft: 4 }]}>{pet}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
        {timeLapseDays !== null && (
          <View style={styles.timeLapseContainer}>
            <View style={styles.timeLapseHeader}>
              <Text style={styles.timeLapseTitle}>{t("ScrubTime")}</Text>
              <Text style={styles.timeLapseValue}>
                {timeLapseDays === 0 ? t("Today") : `${Math.round(timeLapseDays ?? 0)} ${t("DaysAgo")}`}
              </Text>
            </View>
            {/* Using preset buttons instead of native Slider (not supported in Expo Go) */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, marginVertical: 8 }}>
              {[{ label: "7d ago", v: 7 }, { label: "14d ago", v: 14 }, { label: "30d ago", v: 30 }, { label: "Today", v: 0 }].map(opt => (
                <Pressable
                  key={opt.v}
                  onPress={() => setTimeLapseDays(opt.v)}
                  style={[
                    styles.chip,
                    timeLapseDays === opt.v ? styles.chipActive : null,
                    { flex: 1, paddingHorizontal: 4, paddingVertical: 6 }
                  ]}
                >
                  <Text style={[styles.chipText, timeLapseDays === opt.v ? styles.chipTextActive : null, { fontSize: 11, textAlign: "center" }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.timeLapseLabels}>
              <Text style={styles.timeLapseLabelMin}>{t("Past")}</Text>
              <Text style={styles.timeLapseLabelMax}>{t("Present")}</Text>
            </View>
          </View>
        )}

        <Pressable onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
          setShowList(true);
        }}>
          <AppCard style={styles.summaryCard}>
            {postsQuery.isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.summaryText}>{t("LoadingPosts")}</Text>
              </View>
            ) : (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>{displayPosts.length} {t("ActivePostsMapRange")}</Text>
                <ArrowUp2 size={20} color={colors.primary} variant="Outline" />
              </View>
            )}
          </AppCard>
        </Pressable>
      </View>

      <Modal
        visible={showList}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowList(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("PostsList")} ({displayPosts.length})</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                  setShowList(false);
                }}
                style={styles.closeButton}
              >
                <CloseSquare size={24} color={colors.text} variant="Outline" />
              </Pressable>
            </View>
            <FlatList
              data={displayPosts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                    setShowList(false);
                    navigation.navigate("PostDetails", { postId: item.id });
                  }}
                >
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{item.title}</Text>
                    <Text style={styles.listItemSub}>{t(item.type)} • {item.petType} • {item.breed || t("UnknownBreed")}</Text>
                    {item.lastSeen.label && <Text style={styles.listItemLoc} numberOfLines={1}>📍 {item.lastSeen.label}</Text>}
                  </View>

                  <TouchableOpacity
                    style={{ padding: 8, marginRight: 4 }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => { });
                      setHiddenPosts(prev => [...prev, item.id]);
                    }}
                  >
                    <EyeSlash size={22} color={colors.danger} variant="Outline" />
                  </TouchableOpacity>

                  <ArrowRight2 size={20} color={colors.muted} variant="Outline" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>{t("NoPostsFoundRange")}</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Ghost Sighting Modal */}
      <GhostSightingModal
        visible={showGhostModal}
        coordinate={longPressPin}
        onClose={() => {
          setShowGhostModal(false);
          setLongPressPin(null);
        }}
        onConfirm={() => {
          setShowGhostModal(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />

    </View>
  );
}

function FloatingActionButton({ icon, active, onPress }: { icon: React.ReactNode; active: boolean; onPress: () => void }) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        onPress();
      }}
      style={[styles.fab, active ? styles.fabActive : null]}
    >
      {icon}
    </TouchableOpacity>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg
  },
  spatialDock: {
    position: "absolute",
    right: 16,
    top: 140,
    gap: 12,
    alignItems: "center"
  },
  filterDock: {
    position: "absolute",
    left: 16,
    top: 140,
    alignItems: "flex-start"
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)"
  },
  fabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  filterFlyout: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    width: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  flyoutRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  flyoutDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  chipText: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 14
  },
  chipTextActive: {
    color: colors.primary
  },
  omniBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.primary + "40",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8
  },
  omniInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    textAlign: "right"
  },
  omniBarContainer: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10
  },
  timeLapseContainer: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    right: 20,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)'
  },
  timeLapseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  timeLapseTitle: {
    fontWeight: '700',
    color: colors.text
  },
  timeLapseValue: {
    fontWeight: '800',
    color: colors.primary
  },
  timeLapseLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4
  },
  timeLapseLabelMin: {
    fontSize: 12,
    color: colors.muted
  },
  timeLapseLabelMax: {
    fontSize: 12,
    color: colors.muted
  },
  summaryCard: {
    margin: 12,
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  summaryText: {
    color: colors.text,
    fontWeight: "600"
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)"
  },
  modalContent: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "75%",
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  },
  closeButton: {
    padding: 4,
    backgroundColor: colors.surface,
    borderRadius: 999
  },
  listContainer: {
    padding: 16,
    gap: 12
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  listItemContent: {
    flex: 1,
    gap: 4
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text
  },
  listItemSub: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600"
  },
  listItemLoc: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4
  },
  emptyText: {
    textAlign: "center",
    color: colors.muted,
    marginTop: 40,
    fontSize: 16
  },
  ghostPinMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10
  },
  ghostModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100
  },
  ghostModalContent: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 24,
    width: "80%",
    gap: 12
  },
  ghostTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center"
  },
  ghostSub: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 16
  }
});
