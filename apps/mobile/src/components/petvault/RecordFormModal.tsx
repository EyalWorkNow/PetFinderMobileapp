import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, Pressable, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { AppButton, AppInput, useThemeColors } from "../ui";
import { usePetVault, PetRecord } from "../../context/PetVaultContext";
import { CloseSquare, Record, Health, NotificationStatus, Edit2 } from "iconsax-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface RecordFormModalProps {
    visible: boolean;
    onClose: () => void;
}

const ICONS: Array<{ type: "danger" | "warning" | "info" | "success", icon: React.ReactNode }> = [
    { type: "danger", icon: <NotificationStatus size={24} color="#EF4444" variant="Bold" /> },
    { type: "warning", icon: <Health size={24} color="#F59E0B" variant="Bold" /> },
    { type: "info", icon: <Edit2 size={24} color="#3B82F6" variant="Bold" /> },
    { type: "success", icon: <Record size={24} color="#10B981" variant="Bold" /> }
];

export function RecordFormModal({ visible, onClose }: RecordFormModalProps) {
    const theme = useThemeColors();
    const insets = useSafeAreaInsets();
    const { addRecord } = usePetVault();

    const [label, setLabel] = useState("");
    const [value, setValue] = useState("");
    const [iconType, setIconType] = useState<"danger" | "warning" | "info" | "success">("info");
    const [error, setError] = useState("");

    const handleSave = () => {
        Keyboard.dismiss();
        if (!label.trim() || !value.trim()) {
            setError("Please fill out all fields");
            return;
        }

        addRecord({ label: label.trim(), value: value.trim(), iconType });
        setLabel("");
        setValue("");
        setIconType("info");
        setError("");
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
                        <Text style={[styles.title, { color: theme.text }]}>Add Search Intel</Text>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <CloseSquare size={28} color={theme.text} variant="Bulk" />
                        </Pressable>
                    </View>

                    {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

                    <View style={styles.form}>
                        <AppInput
                            label="Intel Subject"
                            placeholder="e.g. Scars, Triggers, Behavior"
                            value={label}
                            onChangeText={(text) => {
                                setLabel(text);
                                setError("");
                            }}
                        />

                        <AppInput
                            label="Details"
                            placeholder="Specify the details clearly..."
                            value={value}
                            onChangeText={(text) => {
                                setValue(text);
                                setError("");
                            }}
                        />

                        <Text style={[styles.label, { color: theme.text, marginTop: 8 }]}>Record Icon</Text>
                        <View style={styles.iconSelector}>
                            {ICONS.map((item) => (
                                <Pressable
                                    key={item.type}
                                    onPress={() => setIconType(item.type)}
                                    style={[
                                        styles.iconBtn,
                                        { backgroundColor: theme.surface, borderColor: theme.border },
                                        iconType === item.type && { backgroundColor: theme.primarySoft, borderColor: theme.primary }
                                    ]}
                                >
                                    {item.icon}
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <AppButton
                            label="Save Intel"
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
    label: {
        fontSize: 14,
        fontWeight: "700"
    },
    iconSelector: {
        flexDirection: "row",
        gap: 12
    },
    iconBtn: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1
    },
    error: {
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center"
    },
    actions: {
        flexDirection: "row",
        marginTop: 8
    }
});
