import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { AppButton, AppCard, colors } from "../components/ui";
import type { CreateStackParamList } from "../navigation/types";
import type { PetType, PostType } from "../types/models";

type Props = NativeStackScreenProps<CreateStackParamList, "ModeSelect">;

export function ModeSelectScreen({ navigation }: Props) {
  const [type, setType] = useState<PostType>("LOST");
  const [petType, setPetType] = useState<PetType>("DOG");

  return (
    <View style={styles.container}>
      <AppCard>
        <Text style={styles.title}>Create a post</Text>
        <Text style={styles.subtitle}>Start by selecting mode and pet type.</Text>

        <View style={styles.row}>
          <AppButton
            label="I Lost a Pet"
            tone={type === "LOST" ? "primary" : "secondary"}
            style={{ flex: 1 }}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setType("LOST"); }}
          />
          <AppButton
            label="I Found a Pet"
            tone={type === "FOUND" ? "primary" : "secondary"}
            style={{ flex: 1 }}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setType("FOUND"); }}
          />
        </View>

        <Text style={[styles.subtitle, { marginTop: 10 }]}>What kind of pet?</Text>
        <View style={styles.rowWrap}>
          {["DOG", "CAT", "PARROT", "OTHER"].map((item) => (
            <AppButton
              key={item}
              label={item}
              style={{ flexGrow: 1 }}
              tone={petType === item ? "primary" : "secondary"}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPetType(item as PetType); }}
            />
          ))}
        </View>

        <AppButton
          label="Continue"
          style={{ marginTop: 16 }}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate("CreatePostWizard", { type, petType }); }}
        />
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 14,
    justifyContent: "center"
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text
  },
  subtitle: {
    color: colors.muted
  },
  row: {
    flexDirection: "row",
    gap: 8
  },
  rowWrap: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  }
});
