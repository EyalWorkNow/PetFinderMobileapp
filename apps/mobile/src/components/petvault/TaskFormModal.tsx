import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, Pressable, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { AppButton, AppInput, useThemeColors } from "../ui";
import { usePetVault, DashboardTask, TaskType } from "../../context/PetVaultContext";
import { CloseSquare } from "iconsax-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TaskFormModalProps {
    visible: boolean;
    onClose: () => void;
    initialTask?: DashboardTask | null;
}

export function TaskFormModal({ visible, onClose, initialTask }: TaskFormModalProps) {
    const theme = useThemeColors();
    const insets = useSafeAreaInsets();
    const { addTask, updateTask, removeTask } = usePetVault();

    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [type, setType] = useState<TaskType>("VET");
    const [error, setError] = useState("");

    useEffect(() => {
        if (visible) {
            if (initialTask) {
                setTitle(initialTask.title);
                setDate(initialTask.date);
                setTime(initialTask.time);
                setType(initialTask.type);
            } else {
                setTitle("");
                setDate("");
                setTime("");
                setType("VET");
            }
            setError("");
        }
    }, [visible, initialTask]);

    const handleSave = () => {
        Keyboard.dismiss();
        if (!title.trim() || !date.trim() || !time.trim()) {
            setError("Please fill all fields");
            return;
        }

        const taskData = {
            title: title.trim(),
            date: date.trim(),
            time: time.trim(),
            type
        };

        if (initialTask) {
            updateTask(initialTask.id, taskData);
        } else {
            addTask(taskData);
        }
        onClose();
    };

    const handleDelete = () => {
        if (initialTask) {
            removeTask(initialTask.id);
            onClose();
        }
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
                        <Text style={[styles.title, { color: theme.text }]}>
                            {initialTask ? "Edit Task" : "New Task"}
                        </Text>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <CloseSquare size={28} color={theme.text} variant="Bulk" />
                        </Pressable>
                    </View>

                    {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

                    <View style={styles.form}>
                        <AppInput
                            label="Task Title"
                            placeholder="e.g. Rabies Booster"
                            value={title}
                            onChangeText={(text) => {
                                setTitle(text);
                                setError("");
                            }}
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <AppInput
                                    label="Date"
                                    placeholder="e.g. Mar 12, 2026"
                                    value={date}
                                    onChangeText={(text) => {
                                        setDate(text);
                                        setError("");
                                    }}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <AppInput
                                    label="Time"
                                    placeholder="e.g. 10:30 AM"
                                    value={time}
                                    onChangeText={(text) => {
                                        setTime(text);
                                        setError("");
                                    }}
                                />
                            </View>
                        </View>

                        <Text style={[styles.label, { color: theme.text }]}>Type</Text>
                        <View style={styles.typeSelector}>
                            {(["VET", "CARE", "OTHER"] as TaskType[]).map((t) => (
                                <Pressable
                                    key={t}
                                    onPress={() => setType(t)}
                                    style={[
                                        styles.typeBtn,
                                        { backgroundColor: theme.surface, borderColor: theme.border },
                                        type === t && { backgroundColor: theme.primarySoft, borderColor: theme.primary }
                                    ]}
                                >
                                    <Text style={{
                                        color: type === t ? theme.primary : theme.text,
                                        fontWeight: type === t ? "800" : "600",
                                        fontSize: 14
                                    }}>
                                        {t.charAt(0) + t.slice(1).toLowerCase()}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={styles.actions}>
                        {initialTask ? (
                            <AppButton
                                label="Delete"
                                tone="danger"
                                style={{ flex: 1 }}
                                onPress={handleDelete}
                            />
                        ) : null}
                        <AppButton
                            label="Save Task"
                            tone="primary"
                            style={{ flex: 2 }}
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
    typeSelector: {
        flexDirection: "row",
        gap: 12
    },
    typeBtn: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
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
        gap: 12,
        marginTop: 8
    }
});
