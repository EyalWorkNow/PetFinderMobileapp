import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, Pressable, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { AppButton, AppInput, useThemeColors } from "../ui";
import { usePetVault, PetProfile } from "../../context/PetVaultContext";
import { CloseSquare } from "iconsax-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
}

export function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
    const theme = useThemeColors();
    const insets = useSafeAreaInsets();
    const { profile, updateProfile } = usePetVault();

    const [name, setName] = useState(profile.name);
    const [breed, setBreed] = useState(profile.breed);
    const [age, setAge] = useState(profile.age);
    const [chipId, setChipId] = useState(profile.chipId);
    const [status, setStatus] = useState(profile.status);

    useEffect(() => {
        if (visible) {
            setName(profile.name);
            setBreed(profile.breed);
            setAge(profile.age);
            setChipId(profile.chipId);
            setStatus(profile.status);
        }
    }, [visible, profile]);

    const handleSave = () => {
        Keyboard.dismiss();
        updateProfile({
            name: name.trim() || "Buddy",
            breed: breed.trim() || "Unknown Breed",
            age: age.trim() || "1y",
            chipId: chipId.trim() || "N/A",
            status: status.trim() || "SAFE"
        });
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={[styles.sheet, { backgroundColor: theme.bg, paddingBottom: insets.bottom + 24 }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Edit Pet Profile</Text>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <CloseSquare size={28} color={theme.text} variant="Bulk" />
                        </Pressable>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <AppInput
                                    label="Name"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <AppInput
                                    label="Age"
                                    value={age}
                                    onChangeText={setAge}
                                />
                            </View>
                        </View>

                        <AppInput
                            label="Breed"
                            value={breed}
                            onChangeText={setBreed}
                        />

                        <AppInput
                            label="Chip ID"
                            value={chipId}
                            onChangeText={setChipId}
                            keyboardType="numeric"
                        />

                        <Text style={[styles.label, { color: theme.text }]}>Status</Text>
                        <View style={styles.statusSelector}>
                            {(["SAFE", "MISSING", "FOUND"] as const).map((s) => (
                                <Pressable
                                    key={s}
                                    onPress={() => setStatus(s)}
                                    style={[
                                        styles.statusBtn,
                                        { backgroundColor: theme.surface, borderColor: theme.border },
                                        status === s && { backgroundColor: s === "MISSING" ? theme.dangerSoft : theme.primarySoft, borderColor: s === "MISSING" ? theme.danger : theme.primary }
                                    ]}
                                >
                                    <Text style={{
                                        color: status === s ? (s === "MISSING" ? theme.danger : theme.primary) : theme.text,
                                        fontWeight: status === s ? "800" : "600",
                                        fontSize: 14
                                    }}>
                                        {s}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <AppButton
                            label="Save Profile"
                            tone="primary"
                            style={{ flex: 1 }}
                            onPress={handleSave}
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "flex-end"
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.5)"
    },
    sheet: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingTop: 32,
        gap: 24,
        maxHeight: "90%"
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    title: {
        fontSize: 24,
        fontWeight: "900"
    },
    closeBtn: {
        padding: 4
    },
    form: {
        gap: 16
    },
    row: {
        flexDirection: "row",
        gap: 12
    },
    label: {
        fontSize: 14,
        fontWeight: "700"
    },
    statusSelector: {
        flexDirection: "row",
        gap: 12
    },
    statusBtn: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1
    },
    actions: {
        flexDirection: "row",
        marginTop: 8
    }
});
