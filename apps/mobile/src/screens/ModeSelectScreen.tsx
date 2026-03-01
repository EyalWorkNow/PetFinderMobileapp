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
      <Path d="M12 18.5C14.7614 18.5 17 16.2614 17 13.5C17 10.7386 14.7614 8.5 12 8.5C9.23858 8.5 7 10.7386 7 13.5C7 16.2614 9.23858 18.5 12 18.5Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 13.5V12.5C17 9.46 14.76 7 12 7C9.24 7 7 9.46 7 12.5V13.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17.5 16.5C19.43 16.5 21 14.93 21 13C21 11.07 19.43 9.5 17.5 9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6.5 16.5C4.57 16.5 3 14.93 3 13C3 11.07 4.57 9.5 6.5 9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 13H10.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 13H14.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 16V15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ParrotIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 12C15 8.13 13.66 5 12 5C10.34 5 9 8.13 9 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 15V20M12 20H10M12 20H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 10C18 10 20 8 18 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CatIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 8L5 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 8L19 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12H9.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 12H15.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 14.5V15.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
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
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 18
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
    borderColor: "#fff"
  }
});
