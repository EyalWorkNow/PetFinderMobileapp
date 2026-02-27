import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CompositeNavigationProp, useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { AppCard, colors } from "../components/ui";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";
import type { PetType, Post, PostType } from "../types/models";

const INITIAL_REGION: Region = {
  latitude: 40.73061,
  longitude: -73.935242,
  latitudeDelta: 0.14,
  longitudeDelta: 0.14
};

type Navigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Map">,
  NativeStackNavigationProp<RootStackParamList>
>;

export function MapScreen() {
  const navigation = useNavigation<Navigation>();
  const auth = useAuth();
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [filterType, setFilterType] = useState<PostType | "ALL">("ALL");
  const [filterPetType, setFilterPetType] = useState<PetType | "ALL">("ALL");
  const [sinceDays, setSinceDays] = useState<1 | 7 | 30>(7);
  const [radiusKm, setRadiusKm] = useState(20);

  useEffect(() => {
    async function fetchLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      const current = await Location.getCurrentPositionAsync({});
      setRegion((prev) => ({
        ...prev,
        latitude: current.coords.latitude,
        longitude: current.coords.longitude
      }));
    }
    fetchLocation().catch(() => undefined);
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("lat", String(region.latitude));
    params.set("lng", String(region.longitude));
    params.set("radiusKm", String(radiusKm));
    params.set("sinceDays", String(sinceDays));
    if (filterType !== "ALL") {
      params.set("type", filterType);
    }
    if (filterPetType !== "ALL") {
      params.set("petType", filterPetType);
    }
    return params.toString();
  }, [filterPetType, filterType, radiusKm, region.latitude, region.longitude, sinceDays]);

  const postsQuery = useQuery({
    queryKey: ["posts", queryString],
    queryFn: async () => {
      const response = await apiRequest<{ items: Post[] }>(`/posts?${queryString}`, {
        accessToken: auth.accessToken,
        userId: auth.userId
      });
      return response.items;
    }
  });

  return (
    <View style={styles.container}>
      <View style={styles.filtersWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {["ALL", "LOST", "FOUND"].map((value) => (
            <FilterChip
              key={value}
              label={value}
              active={filterType === value}
              onPress={() => setFilterType(value as PostType | "ALL")}
            />
          ))}
          {["ALL", "DOG", "CAT", "PARROT", "OTHER"].map((value) => (
            <FilterChip
              key={value}
              label={value}
              active={filterPetType === value}
              onPress={() => setFilterPetType(value as PetType | "ALL")}
            />
          ))}
          {[1, 7, 30].map((value) => (
            <FilterChip
              key={`since-${value}`}
              label={`${value}d`}
              active={sinceDays === value}
              onPress={() => setSinceDays(value as 1 | 7 | 30)}
            />
          ))}
          {[5, 20, 50].map((value) => (
            <FilterChip
              key={`radius-${value}`}
              label={`${value}km`}
              active={radiusKm === value}
              onPress={() => setRadiusKm(value)}
            />
          ))}
        </ScrollView>
      </View>

      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {(postsQuery.data ?? []).map((post) => (
          <Marker
            key={post.id}
            coordinate={{ latitude: post.lastSeen.lat, longitude: post.lastSeen.lng }}
            title={post.title}
            description={`${post.type} • ${post.petType}`}
            pinColor={post.type === "LOST" ? "#D62828" : "#2A9D8F"}
            onPress={() => navigation.navigate("PostDetails", { postId: post.id })}
          />
        ))}
      </MapView>

      <AppCard style={styles.summaryCard}>
        {postsQuery.isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.summaryText}>Loading posts near you...</Text>
          </View>
        ) : (
          <Text style={styles.summaryText}>{(postsQuery.data ?? []).length} active posts in map range</Text>
        )}
      </AppCard>
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : null]}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg
  },
  filtersWrap: {
    paddingTop: 8,
    paddingBottom: 6
  },
  filterRow: {
    gap: 8,
    paddingHorizontal: 12
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  chipText: {
    color: colors.muted,
    fontWeight: "600"
  },
  chipTextActive: {
    color: colors.primary
  },
  map: {
    flex: 1
  },
  summaryCard: {
    margin: 12,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  summaryText: {
    color: colors.text,
    fontWeight: "600"
  }
});
