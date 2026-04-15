import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { AppButton, AppCard, colors, useThemeColors } from "../components/ui";
import { useTranslation } from "../i18n/useTranslation";
import { Pet, MoreCircle, TickCircle, Mirror, LampCharge } from "iconsax-react-native";
import type { CreateStackParamList } from "../navigation/types";
import type { PetType, PostType } from "../types/models";

// Use SVG paths for custom icons not in iconsax
import Svg, { Path, Circle } from "react-native-svg";

function DogIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Dog face */}
      <Path d="M12 20C16.4183 20 20 16.866 20 13C20 9.13401 16.4183 6 12 6C7.58172 6 4 9.13401 4 13C4 16.866 7.58172 20 12 20Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Left floppy ear */}
      <Path d="M5.5 10C4.5 7 3 5 2 4.5C1.5 5.5 2.5 9 5 11" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Right floppy ear */}
      <Path d="M18.5 10C19.5 7 21 5 22 4.5C22.5 5.5 21.5 9 19 11" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Left eye */}
      <Circle cx="9" cy="12" r="1.2" fill={color} />
      {/* Right eye */}
      <Circle cx="15" cy="12" r="1.2" fill={color} />
      {/* Nose */}
      <Path d="M12 14.5C12.5523 14.5 13 14.0523 13 13.5C13 12.9477 12.5523 12.5 12 12.5C11.4477 12.5 11 12.9477 11 13.5C11 14.0523 11.4477 14.5 12 14.5Z" fill={color} />
      {/* Mouth */}
      <Path d="M12 14.5V15.5M12 15.5C10.5 16.5 9.5 16 9.5 16M12 15.5C13.5 16.5 14.5 16 14.5 16" stroke={color} strokeWidth="1" strokeLinecap="round" />
      {/* Tongue */}
      <Path d="M12 15.5C12 16.5 12.5 17.5 12 17.5C11.5 17.5 12 16.5 12 15.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </Svg>
  );
}

function ParrotIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Body */}
      <Path d="M12 21C8 21 6 18 6 15C6 11 9 8 12 8C15 8 17 10 17 13C17 16 15 18 13 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Head */}
      <Path d="M12 8C12 8 10 4 12 3C14 2 16 4 16 6C16 7.5 15 8.5 14 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Curved beak */}
      <Path d="M16 6C17 5.5 18.5 5.5 18.5 7C18.5 8 17 8 16 7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Eye */}
      <Circle cx="13" cy="6" r="0.8" fill={color} />
      {/* Crest feathers */}
      <Path d="M11 4C10 2.5 10.5 1.5 11.5 2" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M12 3C11.5 1.5 12 0.5 13 1" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      {/* Tail feathers */}
      <Path d="M8 19L6 22M9 20L8 22.5M10 20.5L10 22" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      {/* Wing detail */}
      <Path d="M9 12C10 11 13 11 14 12" stroke={color} strokeWidth="1" strokeLinecap="round" />
      {/* Perch / feet */}
      <Path d="M10 18H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function CatIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Cat face */}
      <Path d="M12 20C16.4183 20 20 17.3137 20 14C20 10.6863 16.4183 8 12 8C7.58172 8 4 10.6863 4 14C4 17.3137 7.58172 20 12 20Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Left pointed ear */}
      <Path d="M5 10L3 3L8 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Right pointed ear */}
      <Path d="M19 10L21 3L16 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Left eye */}
      <Path d="M8.5 13C9.32843 13 10 12.5523 10 12C10 11.4477 9.32843 11 8.5 11C7.67157 11 7 11.4477 7 12C7 12.5523 7.67157 13 8.5 13Z" fill={color} />
      {/* Right eye */}
      <Path d="M15.5 13C16.3284 13 17 12.5523 17 12C17 11.4477 16.3284 11 15.5 11C14.6716 11 14 11.4477 14 12C14 12.5523 14.6716 13 15.5 13Z" fill={color} />
      {/* Nose */}
      <Path d="M11 14.5L12 14L13 14.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Mouth */}
      <Path d="M12 14V15.5M12 15.5C11 16 10 16 10 16M12 15.5C13 16 14 16 14 16" stroke={color} strokeWidth="1" strokeLinecap="round" />
      {/* Left whiskers */}
      <Path d="M8 14.5L3.5 13M8 15.5L4 16" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
      {/* Right whiskers */}
      <Path d="M16 14.5L20.5 13M16 15.5L20 16" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
    </Svg>
  );
}

type Props = NativeStackScreenProps<CreateStackParamList, "ModeSelect">;

export function ModeSelectScreen({ navigation }: Props) {
  const [type, setType] = useState<PostType>("LOST");
  const [petType, setPetType] = useState<PetType>("DOG");
  const { t, isRTL } = useTranslation();
  const theme = useThemeColors();
  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <AppCard>
        <Text style={styles.title}>{t("CreatePostTitle") || "Create a post"}</Text>
        <Text style={styles.subtitle}>{t("CreatePostSubtitle") || "Start by selecting mode and pet type."}</Text>

        <View style={styles.row}>
          <AppButton
            label={t("ReportLost") || "I Lost a Pet"}
            tone={type === "LOST" ? "primary" : "secondary"}
            style={{ flex: 1 }}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setType("LOST"); }}
            icon={type === "LOST" ? <TickCircle size={20} color="#fff" variant="Bold" /> : undefined}
          />
          <AppButton
            label={t("ReportFound") || "I Found a Pet"}
            tone={type === "FOUND" ? "primary" : "secondary"}
            style={{ flex: 1 }}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setType("FOUND"); }}
            icon={type === "FOUND" ? <TickCircle size={20} color="#fff" variant="Bold" /> : undefined}
          />
        </View>

        <Text style={[styles.subtitle, { marginTop: 10 }]}>{t("WhatKindOfPet") || "What kind of pet?"}</Text>

        <View style={styles.petGrid}>
          {[
            { id: "DOG", label: t("Dog") || "Dog", icon: <DogIcon size={32} color={petType === "DOG" ? theme.primary : theme.muted} /> },
            { id: "CAT", label: t("Cat") || "Cat", icon: <CatIcon size={32} color={petType === "CAT" ? theme.primary : theme.muted} /> },
            { id: "PARROT", label: t("Parrot") || "Parrot", icon: <ParrotIcon size={32} color={petType === "PARROT" ? theme.primary : theme.muted} /> },
            { id: "OTHER", label: t("Other") || "Other", icon: <MoreCircle size={32} color={petType === "OTHER" ? theme.primary : theme.muted} variant={petType === "OTHER" ? "Bulk" : "Outline"} /> }
          ].map((item) => (
            <Pressable
              key={item.id}
              style={[styles.petOptionBtn, petType === item.id && styles.petOptionBtnActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPetType(item.id as PetType); }}
            >
              <View style={styles.petIconWrapper}>
                {item.icon}
                {petType === item.id && (
                  <View style={styles.checkBadge}>
                    <TickCircle size={14} color="#fff" variant="Bold" />
                  </View>
                )}
              </View>
              <Text style={[styles.petOptionText, petType === item.id && styles.petOptionTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <AppButton
          label={t("Continue")}
          style={{ marginTop: 24 }}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate("CreatePostWizard", { type, petType }); }}
        />
      </AppCard>
    </View>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    padding: 14,
    justifyContent: "center"
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.text
  },
  subtitle: {
    color: theme.muted,
    fontSize: 15,
    marginTop: 4,
    marginBottom: 16
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16
  },
  petGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12
  },
  petOptionBtn: {
    width: "48%",
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.border,
    gap: 12
  },
  petOptionBtnActive: {
    backgroundColor: theme.primarySoft,
    borderColor: theme.primary
  },
  petOptionText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.muted
  },
  petOptionTextActive: {
    color: theme.primary,
    fontWeight: "900"
  },
  petIconWrapper: {
    position: "relative",
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.bg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border
  },
  checkBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: theme.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.surface
  }
});
