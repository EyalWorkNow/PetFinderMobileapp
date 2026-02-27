import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
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
          <AppButton label="I Lost" tone={type === "LOST" ? "primary" : "secondary"} onPress={() => setType("LOST")} />
          <AppButton label="I Found" tone={type === "FOUND" ? "primary" : "secondary"} onPress={() => setType("FOUND")} />
        </View>

        <View style={styles.rowWrap}>
          {["DOG", "CAT", "PARROT", "OTHER"].map((item) => (
            <AppButton
              key={item}
              label={item}
              tone={petType === item ? "primary" : "secondary"}
              onPress={() => setPetType(item as PetType)}
            />
          ))}
        </View>

        <AppButton
          label="Continue"
          onPress={() => navigation.navigate("CreatePostWizard", { type, petType })}
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
