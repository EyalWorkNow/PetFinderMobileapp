import { zodResolver } from "@hookform/resolvers/zod";
// NOTE: @react-native-community/slider requires native linking – not available in Expo Go
// import Slider from "@react-native-community/slider"; <- REMOVED to prevent crash
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform, LayoutAnimation, Animated, Dimensions, Switch } from "react-native";
import * as Haptics from "expo-haptics";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker } from "react-native-maps";
import { z } from "zod";
import {
  Camera,
  Gallery,
  Maximize4,
  Tag,
  Colorfilter,
  Gps,
  CardTick,
  InfoCircle,
  Location as LocationIcon,
  Sms,
  Call,
  ArrowLeft2,
  ArrowRight2,
  Scanning,
  Timer,
  Pet,
  Map as MapIcon,
  SearchNormal1,
  Trash,
  DocumentText,
  Hierarchy,
  TickCircle,
  TickCircle as TickCircleBulk,
  Hashtag,
  Clock,
  Status,
  EyeSlash,
  Eye,
  ShieldTick
} from "iconsax-react-native";
import { AppButton, AppCard, AppInput, colors, useThemeColors } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useAcoustics } from "../context/AudioContext";
import { apiRequest } from "../lib/api";
import { AiService } from "../lib/AiService";
import { Confetti } from "../components/Confetti";
import { useGuardian } from "../context/GuardianContext";
import type { CreateStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<CreateStackParamList, "CreatePostWizard">;

const wizardSchema = z.object({
  title: z.string().min(2),
  shortDesc: z.string().optional(),
  size: z.enum(["S", "M", "L", "UNKNOWN"]),
  collar: z.boolean(),
  collarColor: z.string().optional(),
  marksText: z.string().optional(),
  breed: z.string().optional(),
  lastSeenLabel: z.string().optional(),
  lastSeenTime: z.string().min(8),
  radiusKm: z.number().min(0.5).max(200),
  contactMethod: z.enum(["PHONE", "WHATSAPP", "IN_APP"]),
  contactPhone: z.string().optional(),
  hidePhone: z.boolean(),
  revealPhoneOnContact: z.boolean(),
  showApproximateLocation: z.boolean(),
  firstPhotoTakenAt: z.string().min(8)
});

type WizardForm = z.infer<typeof wizardSchema>;

interface LocalPhoto {
  storagePath: string;
  takenAt: string;
}

interface LocalSighting {
  lat: number;
  lng: number;
  label?: string;
  seenAt: string;
  note?: string;
}

const PRESET_COLORS = [
  { name: "brown", hex: "#78350F" },
  { name: "white", hex: "#FFFFFF" },
  { name: "black", hex: "#000000" },
  { name: "gray", hex: "#6B7280" },
  { name: "gold", hex: "#FBBF24" },
  { name: "orange", hex: "#F97316" },
  { name: "mixed", hex: "linear-gradient" }
];
const MARK_CHIPS = [
  { label: "spot", icon: <Hashtag size={14} /> },
  { label: "scar", icon: <Hashtag size={14} /> },
  { label: "tag", icon: <Tag size={14} /> }
];

export function CreatePostWizardScreen({ navigation, route }: Props) {
  const auth = useAuth();
  const settings = useSettings();
  const queryClient = useQueryClient();
  const { playSound } = useAcoustics();
  const { awardPoints, updateMissionProgress } = useGuardian();
  const theme = useThemeColors();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customColors, setCustomColors] = useState("");
  const [markerLat, setMarkerLat] = useState(40.73061);
  const [markerLng, setMarkerLng] = useState(-73.935242);
  const [sightings, setSightings] = useState<LocalSighting[]>([]);
  const [sightingNote, setSightingNote] = useState("");
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [aiMatch, setAiMatch] = useState<{ similarity: number; traits: string[] } | null>(null);

  // Animations
  const stepAnim = React.useRef(new Animated.Value(1)).current;
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const scanAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isAnalyzingAI) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true })
        ])
      ).start();
    } else {
      scanAnim.stopAnimation();
    }
  }, [isAnalyzingAI]);

  const fadeStep = (next: number) => {
    Animated.parallel([
      Animated.timing(stepAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: next > step ? -15 : 15, duration: 200, useNativeDriver: true })
    ]).start(() => {
      setStep(next);
      slideAnim.setValue(next > step ? 15 : -15);
      Animated.parallel([
        Animated.timing(stepAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true })
      ]).start();
    });
  };

  const form = useForm<WizardForm>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      title: "",
      shortDesc: "",
      size: "UNKNOWN",
      collar: false,
      collarColor: "",
      marksText: "",
      breed: "",
      lastSeenLabel: "",
      lastSeenTime: new Date().toISOString(),
      radiusKm: 5,
      contactMethod: "PHONE",
      contactPhone: "",
      hidePhone: false,
      revealPhoneOnContact: true,
      showApproximateLocation: false,
      firstPhotoTakenAt: new Date().toISOString()
    }
  });

  const publishMutation = useMutation({
    mutationFn: async (values: WizardForm) => {
      if (photos.length === 0) {
        throw new Error("At least one photo is required.");
      }

      const mergedColors = Array.from(
        new Set([
          ...selectedColors,
          ...customColors
            .split(",")
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean)
        ])
      );

      if (mergedColors.length === 0) {
        throw new Error("Pick at least one color.");
      }

      const payload = {
        type: route.params.type,
        petType: route.params.petType,
        status: "ACTIVE",
        title: values.title,
        shortDesc: values.shortDesc || null,
        size: values.size,
        colors: mergedColors,
        collar: values.collar,
        collarColor: values.collar ? values.collarColor || null : null,
        breed: values.breed || "Unknown",
        marksText: values.marksText || null,
        lastSeen: {
          lat: markerLat,
          lng: markerLng,
          label: values.lastSeenLabel || null
        },
        lastSeenTime: values.lastSeenTime,
        radiusKm: values.radiusKm,
        photos: photos.map((photo, index) => ({
          storagePath: photo.storagePath,
          takenAt: index === 0 ? values.firstPhotoTakenAt : photo.takenAt
        })),
        sightings: sightings.map((entry) => ({
          lat: entry.lat,
          lng: entry.lng,
          label: entry.label || null,
          seenAt: entry.seenAt,
          note: entry.note || null
        })),
        contactMethod: values.contactMethod,
        contactPhone: values.contactPhone || null,
        hidePhone: values.hidePhone,
        revealPhoneOnContact: values.revealPhoneOnContact,
        showApproximateLocation: values.showApproximateLocation
      };

      return apiRequest("/posts", {
        method: "POST",
        body: payload,
        accessToken: auth.accessToken,
        userId: auth.userId
      });
    },
    onSuccess: async (data: any) => {
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      await queryClient.invalidateQueries({ queryKey: ["my-posts", auth.userId] });
      await queryClient.invalidateQueries({ queryKey: ["matches", auth.userId] });

      // Guardian Rewards
      awardPoints(100, "Publishing a quality post");
      updateMissionProgress("2", 1);

      // AI MATCHMAKING SIMULATION
      const allPosts = queryClient.getQueryData<any[]>(["posts"]) || [];
      const matches = await AiService.findMatches(data, allPosts);

      if (matches.length > 0) {
        playSound("success");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAiMatch({ similarity: matches[0].similarity, traits: matches[0].matchedTraits });
        setShowMatchModal(true);
      } else {
        Alert.alert("Published", "Your post is now active and matching has started.");
        navigation.popToTop();
      }
    },
    onError: (error) => Alert.alert("Publish failed", error instanceof Error ? error.message : "Unknown error")
  });

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission needed", "Photo library permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.4,
      exif: false,
      allowsMultipleSelection: true
    });

    if (result.canceled) {
      return;
    }

    const next = result.assets.map((asset) => ({
      storagePath: asset.uri,
      takenAt: new Date().toISOString()
    }));

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPhotos((prev) => [...prev, ...next]);
  }

  async function pickFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission needed", "Camera permission is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.4,
      exif: false
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPhotos((prev) => [...prev, { storagePath: asset.uri, takenAt: new Date().toISOString() }]);
  }

  async function resolveAddress(lat: number, lng: number) {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results && results.length > 0) {
        const addr = results[0];
        const parts = [
          addr.street,
          addr.streetNumber,
          addr.district,
          addr.city
        ].filter(Boolean);
        const label = parts.join(", ");
        form.setValue("lastSeenLabel", label);
      }
    } catch (e) {
      console.log("Reverse geocode failed", e);
    }
  }

  async function setCurrentLocation() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission needed", "Location permission is required.");
      return;
    }
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });
    setMarkerLat(location.coords.latitude);
    setMarkerLng(location.coords.longitude);
    resolveAddress(location.coords.latitude, location.coords.longitude);
  }

  function toggleColor(color: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    setSelectedColors((current) => current.includes(color)
      ? current.filter((entry) => entry !== color)
      : [...current, color]);
  }

  function appendMarkChip(chip: string) {
    const current = form.getValues("marksText") ?? "";
    if (current.toLowerCase().includes(chip)) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    form.setValue("marksText", current ? `${current}, ${chip}` : chip);
  }

  function addSighting() {
    setSightings((current) => [
      ...current,
      {
        lat: markerLat,
        lng: markerLng,
        label: form.getValues("lastSeenLabel"),
        seenAt: new Date().toISOString(),
        note: sightingNote
      }
    ]);
    setSightingNote("");
  }

  async function runAIAnalysis() {
    if (photos.length === 0) {
      Alert.alert("Error", "Please add a photo first.");
      return;
    }

    setIsAnalyzingAI(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });

    try {
      const prediction = await AiService.predictTraits(photos[0].storagePath, route.params.petType);

      setIsAnalyzingAI(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => { });

      form.setValue("size", prediction.size);
      form.setValue("breed", prediction.breed);
      if (!selectedColors.includes(prediction.primaryColor)) {
        toggleColor(prediction.primaryColor);
      }

      Alert.alert(
        "AI Analysis Complete ✨",
        `We've identified a ${prediction.breed} (${Math.round(prediction.confidence * 100)}% match). Details updated in Step 2.`
      );
    } catch (error) {
      setIsAnalyzingAI(false);
      Alert.alert("Analysis Failed", "Could not complete AI analysis.");
    }
  }

  const progress = useMemo(() => `${step + 1}/5`, [step]);

  return (
    <LinearGradient colors={[theme.primarySoft, theme.bg, theme.bg]} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.premiumHeader}>
          <View style={styles.headerTop}>
            <Text style={styles.premiumTitle}>
              {route.params.type === "LOST" ? "Report Lost" : "Report Found"} {route.params.petType}
            </Text>
            <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
              <ArrowLeft2 size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.stepIndicatorRow}>
            {[
              { icon: <Camera size={18} variant={step >= 0 ? "Bulk" : "Outline"} />, label: "Photos" },
              { icon: <InfoCircle size={18} variant={step >= 1 ? "Bulk" : "Outline"} />, label: "Info" },
              { icon: <LocationIcon size={18} variant={step >= 2 ? "Bulk" : "Outline"} />, label: "Map" },
              { icon: <Sms size={18} variant={step >= 3 ? "Bulk" : "Outline"} />, label: "Contact" },
              { icon: <TickCircle size={18} variant={step >= 4 ? "Bulk" : "Outline"} />, label: "Confirm" }
            ].map((s, i) => (
              <View key={i} style={[styles.stepItem, i === step && styles.stepItemActive]}>
                <View style={[styles.stepIconContainer, i <= step && { backgroundColor: theme.primary }]}>
                  {React.cloneElement(s.icon as React.ReactElement<any>, { color: i <= step ? "#fff" : theme.muted })}
                </View>
                {i === step && <Text style={styles.stepLabelText}>{s.label}</Text>}
              </View>
            ))}
          </View>

          <View style={styles.premiumProgressBarBg}>
            <Animated.View
              style={[
                styles.premiumProgressBarFill,
                {
                  width: Animated.multiply(
                    new Animated.Value(Dimensions.get("window").width - 32),
                    (step + 1) / 5
                  )
                }
              ]}
            />
          </View>
        </View>

        <Animated.ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          style={{
            opacity: stepAnim,
            transform: [{ translateX: slideAnim }]
          }}
        >
          {step === 0 ? (
            <AppCard>
              <Text style={styles.sectionTitle}>Add a clear photo</Text>
              <Text style={styles.helper}>At least one photo is required to help us find matches based on visual similarity.</Text>

              <View style={styles.dropzone}>
                <Text style={styles.dropzoneText}>Tap to add photos</Text>
                <View style={styles.row}>
                  <AppButton label="Gallery" onPress={pickFromLibrary} tone="secondary" />
                  <AppButton label="Camera" onPress={pickFromCamera} tone="secondary" />
                </View>
              </View>

              {photos.length > 0 ? (
                <View style={styles.photosPreviewContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
                    {photos.map((photo, index) => (
                      <View key={`${photo.storagePath}-${index}`} style={styles.photoWrapper}>
                        <Image source={{ uri: photo.storagePath }} style={styles.photo} />
                        {index === 0 && (
                          <View style={styles.heroBadge}>
                            <Text style={styles.heroBadgeText}>Main</Text>
                          </View>
                        )}
                        <Pressable
                          onPress={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                          style={styles.deletePhotoBtn}
                        >
                          <Trash size={16} color="#fff" variant="Bold" />
                        </Pressable>
                        {index === 0 && isAnalyzingAI && (
                          <Animated.View
                            style={[
                              styles.scanLine,
                              {
                                transform: [
                                  {
                                    translateY: scanAnim.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [0, 140]
                                    })
                                  }
                                ]
                              }
                            ]}
                          />
                        )}
                      </View>
                    ))}
                  </ScrollView>
                  <AppButton
                    label={isAnalyzingAI ? "Analyzing..." : "AI Smart Detect ✨"}
                    onPress={runAIAnalysis}
                    tone="primary"
                    loading={isAnalyzingAI}
                    style={{ marginTop: 16 }}
                    icon={<Scanning size={20} color="#fff" />}
                  />
                  <View style={{ marginTop: 16 }}>
                    <Controller
                      control={form.control}
                      name="firstPhotoTakenAt"
                      render={({ field, fieldState }) => (
                        <AppInput
                          label="Date Taken"
                          icon={<Timer size={20} color={theme.primary} />}
                          value={field.value}
                          onChangeText={field.onChange}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  </View>
                </View>
              ) : null}
            </AppCard>
          ) : null}

          {step === 1 ? (
            <View style={styles.glassCard}>
              <Text style={styles.sectionTitle}>Pet details</Text>
              <Text style={styles.helper}>Tell us more about the pet.</Text>

              <Controller
                control={form.control}
                name="title"
                render={({ field, fieldState }) => (
                  <AppInput
                    label="Title"
                    placeholder="e.g. Friendly Golden Retriever"
                    icon={<DocumentText size={20} color={theme.primary} />}
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                control={form.control}
                name="breed"
                render={({ field, fieldState }) => (
                  <AppInput
                    label="Breed"
                    placeholder="e.g. Mixed breed"
                    icon={<Hierarchy size={20} color={theme.primary} />}
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Text style={styles.fieldLabel}>Estimated Size</Text>
              <View style={styles.visualSizeRow}>
                {(["S", "M", "L", "UNKNOWN"] as const).map((s) => {
                  const isActive = form.watch("size") === s;
                  const petSize = s === "S" ? 24 : s === "M" ? 32 : s === "L" ? 40 : 28;
                  return (
                    <Pressable
                      key={s}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                        form.setValue("size", s);
                      }}
                      style={[styles.visualSizeBtn, isActive && styles.visualSizeBtnActive]}
                    >
                      <Pet size={petSize} color={isActive ? theme.primary : theme.muted} variant={isActive ? "Bulk" : "Outline"} />
                      <Text style={[styles.visualSizeText, isActive && styles.visualSizeTextActive]}>{s}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Core Colors</Text>
              <View style={styles.rowWrap}>
                {PRESET_COLORS.map((c) => {
                  const isActive = selectedColors.includes(c.name);
                  return (
                    <Pressable
                      key={c.name}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                        const current = [...selectedColors];
                        if (current.includes(c.name)) {
                          setSelectedColors(current.filter((x) => x !== c.name));
                        } else {
                          setSelectedColors([...current, c.name]);
                        }
                      }}
                      style={[styles.colorBubble, isActive && { borderColor: theme.primary, borderWidth: 2 }]}
                    >
                      {c.hex === "linear-gradient" ? (
                        <LinearGradient colors={["#ff0000", "#00ff00", "#0000ff"]} style={styles.colorCircle} />
                      ) : (
                        <View style={[styles.colorCircle, { backgroundColor: c.hex, borderWidth: c.name === "white" ? 1 : 0, borderColor: theme.border }]} />
                      )}
                      {isActive && <View style={styles.colorTick}><TickCircleBulk size={14} color={theme.primary} variant="Bold" /></View>}
                    </Pressable>
                  );
                })}
              </View>

              <AppInput
                label="Additional colors"
                placeholder="Comma separated"
                icon={<Colorfilter size={20} color={theme.primary} />}
                value={customColors}
                onChangeText={setCustomColors}
              />

              <Text style={styles.fieldLabel}>Collar / Harness</Text>
              <View style={styles.row}>
                <Pressable
                  onPress={() => form.setValue("collar", true)}
                  style={[styles.visualSizeBtn, { flex: 1 }, form.watch("collar") && styles.visualSizeBtnActive]}
                >
                  <TickCircleBulk size={24} color={form.watch("collar") ? theme.primary : theme.muted} />
                  <Text style={styles.visualSizeText}>Yes</Text>
                </Pressable>
                <Pressable
                  onPress={() => form.setValue("collar", false)}
                  style={[styles.visualSizeBtn, { flex: 1 }, !form.watch("collar") && styles.visualSizeBtnActive]}
                >
                  <ArrowLeft2 size={24} color={!form.watch("collar") ? theme.primary : theme.muted} />
                  <Text style={styles.visualSizeText}>No</Text>
                </Pressable>
              </View>

              {form.watch("collar") ? (
                <Controller
                  control={form.control}
                  name="collarColor"
                  render={({ field }) => (
                    <AppInput
                      label="Collar color"
                      placeholder="e.g. Red"
                      icon={<Hashtag size={20} color={theme.primary} />}
                      value={field.value}
                      onChangeText={field.onChange}
                    />
                  )}
                />
              ) : null}

              <Controller
                control={form.control}
                name="marksText"
                render={({ field }) => (
                  <AppInput
                    label="Distinctive marks"
                    placeholder="e.g. White spot on tail"
                    icon={<Maximize4 size={20} color={theme.primary} />}
                    value={field.value}
                    onChangeText={field.onChange}
                  />
                )}
              />

              <View style={styles.rowWrap}>
                {MARK_CHIPS.map((chip) => (
                  <Pressable
                    key={chip.label}
                    onPress={() => appendMarkChip(chip.label)}
                    style={styles.pill}
                  >
                    {React.cloneElement(chip.icon, { color: theme.primary })}
                    <Text style={styles.pillText}>{chip.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.glassCard}>
              <Text style={styles.sectionTitle}>Location & details</Text>
              <Text style={styles.helper}>Where was the pet last seen?</Text>

              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: markerLat,
                    longitude: markerLng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01
                  }}
                >
                  <Marker
                    coordinate={{ latitude: markerLat, longitude: markerLng }}
                    draggable
                    onDragEnd={(e) => {
                      setMarkerLat(e.nativeEvent.coordinate.latitude);
                      setMarkerLng(e.nativeEvent.coordinate.longitude);
                      resolveAddress(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude);
                    }}
                  />
                </MapView>
                <Pressable
                  onPress={setCurrentLocation}
                  style={[styles.closeBtn, { position: "absolute", bottom: 40, right: 10, backgroundColor: theme.surface, elevation: 8, shadowColor: theme.primary, shadowOpacity: 0.2, shadowRadius: 10 }]}
                >
                  <Gps size={22} color={theme.primary} variant="Bold" />
                </Pressable>
              </View>

              <Controller
                control={form.control}
                name="lastSeenLabel"
                render={({ field, fieldState }) => (
                  <AppInput
                    label="Last seen location"
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="Street, park, neighborhood"
                    icon={<SearchNormal1 size={20} color={theme.primary} />}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                control={form.control}
                name="lastSeenTime"
                render={({ field, fieldState }) => (
                  <AppInput
                    label="When was it seen?"
                    placeholder="e.g. Today at 2 PM"
                    value={field.value}
                    onChangeText={field.onChange}
                    icon={<Clock size={20} color={theme.primary} />}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <View style={styles.row}>
                <Gps size={20} color={theme.primary} variant="Bulk" />
                <Text style={styles.fieldLabel}>Search Radius: {Math.round(form.watch("radiusKm") * 10) / 10} km</Text>
              </View>

              <Controller
                control={form.control}
                name="radiusKm"
                render={({ field }) => {
                  const RADIUS_PRESETS = [1, 2, 5, 10, 20];
                  return (
                    <View style={[styles.rowWrap, { marginTop: 12 }]}>
                      {RADIUS_PRESETS.map((km) => (
                        <Pressable
                          key={km}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                            field.onChange(km);
                          }}
                          style={[
                            styles.pill,
                            field.value === km ? styles.pillActive : null
                          ]}
                        >
                          <Text style={[styles.pillText, field.value === km ? styles.pillTextActive : null]}>
                            {km} km
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  );
                }}
              />

              <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)", paddingTop: 20 }}>
                <AppInput
                  label="Add sighting notes"
                  placeholder="Any extra details..."
                  icon={<DocumentText size={20} color={theme.primary} />}
                  value={sightingNote}
                  onChangeText={setSightingNote}
                />
                <AppButton
                  label="Log this sighting"
                  tone="secondary"
                  onPress={addSighting}
                  icon={<TickCircle size={18} color={theme.primary} />}
                />
              </View>

              {sightings.length > 0 && (
                <View style={styles.sightingList}>
                  {sightings.map((entry, index) => (
                    <View key={index} style={styles.sightingItem}>
                      <LocationIcon size={14} color={theme.primary} variant="Bulk" />
                      <Text style={styles.sightingText} numberOfLines={1}>
                        {entry.label || "Pinned Location"} - {new Date(entry.seenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.glassCard}>
              <Text style={styles.sectionTitle}>Contact & privacy</Text>
              <Text style={styles.helper}>How should people reach you?</Text>

              <Text style={styles.fieldLabel}>Preferred contact channel</Text>
              <View style={styles.rowWrap}>
                {[
                  { id: "PHONE", label: "Call", icon: <Call size={18} /> },
                  { id: "WHATSAPP", label: "WhatsApp", icon: <Sms size={18} /> },
                  { id: "IN_APP", label: "In-App Chat", icon: <Status size={18} /> }
                ].map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                      form.setValue("contactMethod", item.id as any);
                    }}
                    style={[styles.visualSelectBtn, form.watch("contactMethod") === item.id ? styles.visualSelectBtnActive : null]}
                  >
                    {React.cloneElement(item.icon, { color: form.watch("contactMethod") === item.id ? theme.primary : theme.muted, variant: form.watch("contactMethod") === item.id ? "Bulk" : "Outline" })}
                    <Text style={[styles.visualSelectText, form.watch("contactMethod") === item.id ? styles.visualSelectTextActive : null]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Controller
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <AppInput
                    label="Contact phone number"
                    value={field.value}
                    onChangeText={field.onChange}
                    keyboardType="phone-pad"
                    icon={<Call size={20} color={theme.primary} />}
                    placeholder="+972-50-000-0000"
                  />
                )}
              />

              <View style={styles.privacySection}>
                <View style={styles.privacyItem}>
                  <View style={styles.privacyIconContainer}>
                    <EyeSlash size={20} color={theme.primary} variant="Bulk" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SwitchRow
                      label="Hide phone number"
                      value={form.watch("hidePhone")}
                      onValueChange={(value) => form.setValue("hidePhone", value)}
                    />
                    <Text style={styles.privacyDesc}>Only revealed to verified users</Text>
                  </View>
                </View>

                <View style={styles.privacyItem}>
                  <View style={styles.privacyIconContainer}>
                    <Gps size={20} color={theme.primary} variant="Bulk" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SwitchRow
                      label="Safe location mode"
                      value={form.watch("showApproximateLocation")}
                      onValueChange={(value) => form.setValue("showApproximateLocation", value)}
                    />
                    <Text style={styles.privacyDesc}>Shows a 500m area instead of pinpoint</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {step === 4 ? (
            <View style={styles.glassCard}>
              <View style={styles.reviewHeader}>
                <TickCircleBulk size={48} color={theme.success} variant="Bulk" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Ready to Blast!</Text>
                  <Text style={styles.helper}>We'll notify everyone nearby immediately.</Text>
                </View>
              </View>

              <View style={[styles.reviewGrid, { gap: 12 }]}>
                <ReviewCard icon={<Camera size={20} color={theme.primary} variant="Bulk" />} label="Photos" value={`${photos.length} photos`} />
                <ReviewCard icon={<InfoCircle size={20} color={theme.primary} variant="Bulk" />} label="Type" value={route.params.type} />
                <ReviewCard icon={<Tag size={20} color={theme.primary} variant="Bulk" />} label="Title" value={form.watch("title")} />
                <ReviewCard icon={<Hierarchy size={20} color={theme.primary} variant="Bulk" />} label="Breed" value={form.watch("breed") || "Unknown"} />
                <ReviewCard icon={<Maximize4 size={20} color={theme.primary} variant="Bulk" />} label="Size" value={form.watch("size")} />
                <ReviewCard icon={<Gps size={20} color={theme.primary} variant="Bulk" />} label="Radius" value={`${form.watch("radiusKm")} km`} />
                <ReviewCard icon={<Status size={20} color={theme.primary} variant="Bulk" />} label="Method" value={form.watch("contactMethod")} />
              </View>

              <AppButton
                label="Publish Post Now"
                loading={publishMutation.isPending}
                style={{ marginTop: 24, height: 64, borderRadius: 20 }}
                onPress={form.handleSubmit(
                  (values) => publishMutation.mutate(values),
                  (errors) => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
                    Alert.alert("Missing Details", "Please fix the errors before publishing.");
                  }
                )}
                icon={<ArrowRight2 size={24} color="#fff" />}
              />
            </View>
          ) : null}
        </Animated.ScrollView>

        <View style={styles.footer}>
          {step > 0 ? (
            <AppButton
              label="Back"
              tone="secondary"
              style={styles.footerBtn}
              onPress={() => fadeStep(step - 1)}
              icon={<ArrowLeft2 size={18} color={theme.primary} />}
            />
          ) : (
            <View style={styles.footerBtn} />
          )}
          {step < 4 ? (
            <AppButton
              label="Next"
              style={styles.footerBtn}
              onPress={() => fadeStep(step + 1)}
              icon={<ArrowRight2 size={18} color="#fff" />}
            />
          ) : (
            <View style={styles.footerBtn} />
          )}
        </View>
      </KeyboardAvoidingView>
      <Confetti active={showConfetti} />

      {/* AI MATCH MODAL */}
      <Modal transparent visible={showMatchModal} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.glassCard, { margin: 24, padding: 32, alignItems: "center", gap: 20 }]}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center" }}>
              <Scanning size={44} color={theme.primary} variant="Bulk" />
            </View>

            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "900", color: theme.text, textAlign: "center" }}>AI Match Found! 🚨</Text>
              <Text style={{ color: theme.muted, textAlign: "center", marginTop: 8 }}>
                Our PetFace AI found a {Math.round((aiMatch?.similarity || 0) * 100)}% similarity with an existing post.
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 8 }}>
              {aiMatch?.traits.map(t => (
                <View key={t} style={{ backgroundColor: theme.primarySoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                  <Text style={{ color: theme.primary, fontWeight: "800", fontSize: 12 }}>{t}</Text>
                </View>
              ))}
            </View>

            <View style={{ width: "100%", gap: 12 }}>
              <AppButton
                label="View Matches Now"
                onPress={() => { setShowMatchModal(false); navigation.popToTop(); navigation.navigate("Matches" as any); }}
              />
              <Pressable onPress={() => { setShowMatchModal(false); navigation.popToTop(); }} style={{ alignSelf: "center", padding: 8 }}>
                <Text style={{ color: theme.muted, fontWeight: "700" }}>Dismiss</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient >
  );
}

function SwitchRow({
  label,
  value,
  onValueChange
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

function ReviewCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const theme = useThemeColors();
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewCardIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.reviewCardLabel}>{label}</Text>
        <Text style={styles.reviewCardValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  premiumHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: "transparent"
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24
  },
  premiumTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center"
  },
  stepIndicatorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  stepItem: {
    alignItems: "center",
    gap: 6
  },
  stepItemActive: {
    transform: [{ scale: 1.1 }]
  },
  stepIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  stepLabelText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
    position: "absolute",
    bottom: -18,
    width: 70,
    textAlign: "center"
  },
  premiumProgressBarBg: {
    height: 4,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 2,
    marginTop: 10,
    overflow: "hidden"
  },
  premiumProgressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 150
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 4
  },
  helper: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  row: {
    flexDirection: "row",
    gap: 12
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 12
  },
  dropzone: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: "dashed",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: "rgba(79, 70, 229, 0.03)",
    marginTop: 12
  },
  dropzoneText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700"
  },
  photosPreviewContainer: {
    marginTop: 20
  },
  photoRow: {
    gap: 12
  },
  photoWrapper: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden"
  },
  photo: {
    width: 140,
    height: 140,
    backgroundColor: colors.border
  },
  scanLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.primary,
    opacity: 0.7,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 6
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  pillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  pillText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.muted
  },
  pillTextActive: {
    color: colors.primary
  },
  map: {
    width: "100%",
    height: 250,
    borderRadius: 24,
    marginVertical: 16
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text
  },
  footer: {
    position: "absolute",
    bottom: 110,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.85)"
  },
  footerBtn: {
    flex: 1
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24
  },
  reviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between"
  },
  reviewCard: {
    width: "48%",
    backgroundColor: "rgba(0,0,0,0.02)",
    padding: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)"
  },
  reviewCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  reviewCardLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase"
  },
  reviewCardValue: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5
  },
  visualSizeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12
  },
  visualSizeBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.03)",
    marginHorizontal: 4,
    gap: 8,
    borderWidth: 1.5,
    borderColor: "transparent"
  },
  visualSizeBtnActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary
  },
  visualSizeText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.muted
  },
  visualSizeTextActive: {
    color: colors.primary
  },
  colorBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent"
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18
  },
  colorTick: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 1
  },
  heroBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10
  },
  heroBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  deletePhotoBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10
  },
  mapContainer: {
    width: "100%",
    height: 300,
    borderRadius: 32,
    overflow: "hidden",
    marginVertical: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)"
  },
  sightingList: {
    marginTop: 16,
    gap: 8
  },
  sightingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.03)",
    padding: 12,
    borderRadius: 12
  },
  sightingText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
    flex: 1
  },
  visualSelectBtn: {
    flex: 1,
    minWidth: "30%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.03)",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "transparent"
  },
  visualSelectBtnActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary
  },
  visualSelectText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.muted
  },
  visualSelectTextActive: {
    color: colors.primary
  },
  privacySection: {
    marginTop: 20,
    gap: 16
  },
  privacyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
    padding: 16,
    borderRadius: 20
  },
  privacyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  privacyDesc: {
    fontSize: 12,
    color: colors.muted,
    marginTop: -4
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)"
  }
});
