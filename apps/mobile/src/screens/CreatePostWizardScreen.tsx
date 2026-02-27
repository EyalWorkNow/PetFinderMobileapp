import { zodResolver } from "@hookform/resolvers/zod";
import Slider from "@react-native-community/slider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { z } from "zod";
import { AppButton, AppCard, AppInput, colors } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { apiRequest } from "../lib/api";
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

const PRESET_COLORS = ["brown", "white", "black", "gray", "gold", "orange", "mixed"];
const MARK_CHIPS = ["spot", "scar", "tag"];

export function CreatePostWizardScreen({ navigation, route }: Props) {
  const auth = useAuth();
  const settings = useSettings();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customColors, setCustomColors] = useState("");
  const [markerLat, setMarkerLat] = useState(40.73061);
  const [markerLng, setMarkerLng] = useState(-73.935242);
  const [sightings, setSightings] = useState<LocalSighting[]>([]);
  const [sightingNote, setSightingNote] = useState("");

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
      contactMethod: "IN_APP",
      contactPhone: "",
      hidePhone: settings.hidePhoneByDefault,
      revealPhoneOnContact: false,
      showApproximateLocation: settings.approximateLocationByDefault,
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      await queryClient.invalidateQueries({ queryKey: ["my-posts", auth.userId] });
      await queryClient.invalidateQueries({ queryKey: ["matches", auth.userId] });
      Alert.alert("Published", "Your post is now active and matching has started.");
      navigation.popToTop();
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
      quality: 0.8,
      allowsMultipleSelection: true
    });

    if (result.canceled) {
      return;
    }

    const next = result.assets.map((asset) => ({
      storagePath: asset.uri,
      takenAt: new Date().toISOString()
    }));
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
      quality: 0.8
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    setPhotos((prev) => [...prev, { storagePath: asset.uri, takenAt: new Date().toISOString() }]);
  }

  async function setCurrentLocation() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission needed", "Location permission is required.");
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    setMarkerLat(location.coords.latitude);
    setMarkerLng(location.coords.longitude);
  }

  function toggleColor(color: string) {
    setSelectedColors((current) => current.includes(color)
      ? current.filter((entry) => entry !== color)
      : [...current, color]);
  }

  function appendMarkChip(chip: string) {
    const current = form.getValues("marksText") ?? "";
    if (current.toLowerCase().includes(chip)) {
      return;
    }
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

  const progress = useMemo(() => `${step + 1}/5`, [step]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create {route.params.type === "LOST" ? "Lost" : "Found"} {route.params.petType}</Text>
        <Text style={styles.subtitle}>Step {progress}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 0 ? (
          <AppCard>
            <Text style={styles.sectionTitle}>Photo upload</Text>
            <Text style={styles.helper}>At least one photo is required.</Text>
            <View style={styles.row}>
              <AppButton label="Gallery" onPress={pickFromLibrary} tone="secondary" />
              <AppButton label="Camera" onPress={pickFromCamera} tone="secondary" />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
              {photos.map((photo, index) => (
                <Image key={`${photo.storagePath}-${index}`} source={{ uri: photo.storagePath }} style={styles.photo} />
              ))}
            </ScrollView>
            <Controller
              control={form.control}
              name="firstPhotoTakenAt"
              render={({ field, fieldState }) => (
                <AppInput
                  label="When was this photo taken? (ISO date-time)"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </AppCard>
        ) : null}

        {step === 1 ? (
          <AppCard>
            <Text style={styles.sectionTitle}>Pet questions</Text>
            <Controller
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <AppInput label="Title" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
              )}
            />
            <Controller
              control={form.control}
              name="shortDesc"
              render={({ field }) => (
                <AppInput label="Short description" value={field.value} onChangeText={field.onChange} multiline />
              )}
            />

            <Text style={styles.fieldLabel}>Size</Text>
            <View style={styles.rowWrap}>
              {(["S", "M", "L", "UNKNOWN"] as const).map((size) => (
                <Pressable
                  key={size}
                  onPress={() => form.setValue("size", size)}
                  style={[styles.pill, form.watch("size") === size ? styles.pillActive : null]}
                >
                  <Text style={[styles.pillText, form.watch("size") === size ? styles.pillTextActive : null]}>{size}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Primary color</Text>
            <View style={styles.rowWrap}>
              {PRESET_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => toggleColor(color)}
                  style={[styles.pill, selectedColors.includes(color) ? styles.pillActive : null]}
                >
                  <Text style={[styles.pillText, selectedColors.includes(color) ? styles.pillTextActive : null]}>{color}</Text>
                </Pressable>
              ))}
            </View>

            <AppInput
              label="Additional colors (comma separated)"
              value={customColors}
              onChangeText={setCustomColors}
            />

            <Text style={styles.fieldLabel}>Collar / Harness</Text>
            <View style={styles.row}>
              <AppButton
                label="Yes"
                tone={form.watch("collar") ? "primary" : "secondary"}
                onPress={() => form.setValue("collar", true)}
              />
              <AppButton
                label="No"
                tone={!form.watch("collar") ? "primary" : "secondary"}
                onPress={() => form.setValue("collar", false)}
              />
            </View>

            {form.watch("collar") ? (
              <Controller
                control={form.control}
                name="collarColor"
                render={({ field }) => (
                  <AppInput label="Collar color" value={field.value} onChangeText={field.onChange} />
                )}
              />
            ) : null}

            <Controller
              control={form.control}
              name="marksText"
              render={({ field }) => (
                <AppInput label="Distinctive marks" value={field.value} onChangeText={field.onChange} />
              )}
            />

            <View style={styles.rowWrap}>
              {MARK_CHIPS.map((chip) => (
                <Pressable key={chip} onPress={() => appendMarkChip(chip)} style={styles.pill}>
                  <Text style={styles.pillText}>+ {chip}</Text>
                </Pressable>
              ))}
            </View>

            <Controller
              control={form.control}
              name="breed"
              render={({ field }) => (
                <AppInput label="Breed (optional, unknown allowed)" value={field.value} onChangeText={field.onChange} />
              )}
            />
          </AppCard>
        ) : null}

        {step === 2 ? (
          <AppCard>
            <Text style={styles.sectionTitle}>Location, radius, sightings</Text>
            <AppButton label="Use current GPS" tone="secondary" onPress={setCurrentLocation} />

            <MapView
              style={styles.map}
              initialRegion={{
                latitude: markerLat,
                longitude: markerLng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05
              }}
              region={{
                latitude: markerLat,
                longitude: markerLng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05
              }}
            >
              <Marker
                draggable
                coordinate={{ latitude: markerLat, longitude: markerLng }}
                onDragEnd={(event) => {
                  setMarkerLat(event.nativeEvent.coordinate.latitude);
                  setMarkerLng(event.nativeEvent.coordinate.longitude);
                }}
              />
            </MapView>

            <Controller
              control={form.control}
              name="lastSeenLabel"
              render={({ field }) => (
                <AppInput
                  label="Location search / label"
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Street, park, neighborhood"
                />
              )}
            />

            <Controller
              control={form.control}
              name="lastSeenTime"
              render={({ field, fieldState }) => (
                <AppInput
                  label="Last seen time (ISO date-time)"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Text style={styles.fieldLabel}>Radius: {Math.round(form.watch("radiusKm") * 10) / 10} km</Text>
            <Controller
              control={form.control}
              name="radiusKm"
              render={({ field }) => (
                <Slider
                  minimumValue={0.5}
                  maximumValue={50}
                  step={0.5}
                  value={field.value}
                  onValueChange={field.onChange}
                  minimumTrackTintColor={colors.primary}
                />
              )}
            />

            <AppInput
              label="Optional note for additional sighting"
              value={sightingNote}
              onChangeText={setSightingNote}
            />
            <AppButton label="Add sighting" tone="secondary" onPress={addSighting} />
            {sightings.map((entry, index) => (
              <Text key={`${entry.lat}-${entry.lng}-${index}`} style={styles.helper}>
                {index + 1}. {entry.label || "Sighting"} - {entry.seenAt}
              </Text>
            ))}
          </AppCard>
        ) : null}

        {step === 3 ? (
          <AppCard>
            <Text style={styles.sectionTitle}>Contact & privacy</Text>
            <Text style={styles.fieldLabel}>Contact method</Text>
            <View style={styles.rowWrap}>
              {(["PHONE", "WHATSAPP", "IN_APP"] as const).map((method) => (
                <Pressable
                  key={method}
                  onPress={() => form.setValue("contactMethod", method)}
                  style={[styles.pill, form.watch("contactMethod") === method ? styles.pillActive : null]}
                >
                  <Text style={[styles.pillText, form.watch("contactMethod") === method ? styles.pillTextActive : null]}>{method}</Text>
                </Pressable>
              ))}
            </View>

            <Controller
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <AppInput
                  label="Phone / WhatsApp number"
                  value={field.value}
                  onChangeText={field.onChange}
                  keyboardType="phone-pad"
                />
              )}
            />

            <SwitchRow
              label="Hide phone number"
              value={form.watch("hidePhone")}
              onValueChange={(value) => form.setValue("hidePhone", value)}
            />
            <SwitchRow
              label="Reveal phone after contact"
              value={form.watch("revealPhoneOnContact")}
              onValueChange={(value) => form.setValue("revealPhoneOnContact", value)}
            />
            <SwitchRow
              label="Show approximate location on map"
              value={form.watch("showApproximateLocation")}
              onValueChange={(value) => form.setValue("showApproximateLocation", value)}
            />
          </AppCard>
        ) : null}

        {step === 4 ? (
          <AppCard>
            <Text style={styles.sectionTitle}>Review & publish</Text>
            <Text style={styles.helper}>Mode: {route.params.type}</Text>
            <Text style={styles.helper}>Pet type: {route.params.petType}</Text>
            <Text style={styles.helper}>Title: {form.watch("title")}</Text>
            <Text style={styles.helper}>Photos: {photos.length}</Text>
            <Text style={styles.helper}>Colors: {[...selectedColors, customColors].filter(Boolean).join(", ")}</Text>
            <Text style={styles.helper}>Radius: {form.watch("radiusKm")} km</Text>
            <Text style={styles.helper}>Sightings: {sightings.length}</Text>
            <AppButton
              label="Publish Post"
              loading={publishMutation.isPending}
              onPress={form.handleSubmit((values) => publishMutation.mutate(values))}
            />
          </AppCard>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 ? <AppButton label="Back" tone="secondary" onPress={() => setStep((value) => value - 1)} /> : <View />}
        {step < 4 ? <AppButton label="Next" onPress={() => setStep((value) => value + 1)} /> : <View />}
      </View>
    </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 2
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text
  },
  subtitle: {
    color: colors.muted
  },
  content: {
    padding: 14,
    gap: 10,
    paddingBottom: 120
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text
  },
  helper: {
    color: colors.muted
  },
  row: {
    flexDirection: "row",
    gap: 8
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  photoRow: {
    gap: 10
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: colors.border
  },
  fieldLabel: {
    color: colors.text,
    fontWeight: "700"
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  pillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  pillText: {
    color: colors.muted,
    fontWeight: "700"
  },
  pillTextActive: {
    color: colors.primary
  },
  map: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    overflow: "hidden"
  },
  footer: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  switchLabel: {
    flex: 1,
    color: colors.text,
    fontWeight: "600",
    paddingRight: 10
  }
});
