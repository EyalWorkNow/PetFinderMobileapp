import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Modal, Animated, Pressable } from "react-native";
import { CopySuccess, LocationAdd, CloseSquare } from "iconsax-react-native";
import { useThemeColors, AppButton } from "../ui";
import * as Haptics from "expo-haptics";

interface GhostSightingModalProps {
    visible: boolean;
    coordinate: { latitude: number, longitude: number } | null;
    onClose: () => void;
    onConfirm: () => void;
}

export function GhostSightingModal({ visible, coordinate, onClose, onConfirm }: GhostSightingModalProps) {
    const theme = useThemeColors();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [isRecording, setIsRecording] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }).start();
            setIsRecording(false);
        }
    }, [visible]);

    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true })
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
            pulseAnim.stopAnimation();
        }
    }, [isRecording]);

    if (!visible) return null;

    const handleConfirm = () => {
        setIsRecording(false);
        onConfirm();
    };

    const styles = getStyles(theme);

    return (
        <Modal transparent visible={visible} animationType="none">
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <View style={styles.modalContent}>
                    <Pressable style={styles.closeBtn} onPress={onClose}>
                        <CloseSquare size={28} color={theme.text} variant="Bulk" />
                    </Pressable>

                    <View style={styles.header}>
                        <LocationAdd size={32} color="#F59E0B" variant="Bold" />
                        <Text style={styles.title}>Ghost Sighting</Text>
                    </View>

                    <Text style={styles.subtitle}>
                        You pinned a location at{"\n"}
                        <Text style={{ fontWeight: "bold" }}>{coordinate?.latitude.toFixed(4)}, {coordinate?.longitude.toFixed(4)}</Text>
                    </Text>

                    <View style={styles.recordBox}>
                        <Animated.View style={[styles.micPulse, { transform: [{ scale: pulseAnim }], opacity: isRecording ? 0.3 : 0, backgroundColor: theme.danger }]} />
                        <Pressable
                            style={[styles.micBtn, { backgroundColor: theme.primary }, isRecording && { backgroundColor: theme.danger }]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                setIsRecording(!isRecording);
                            }}
                        >
                            <CopySuccess size={32} color={theme.surface} variant="Bold" />
                        </Pressable>
                        <Text style={[styles.recordText, { color: theme.text }]}>
                            {isRecording ? "Listening... Tap to stop" : "Tap to record Intel (optional)"}
                        </Text>
                    </View>

                    <AppButton
                        label="Drop Sighting Pin Now"
                        tone="primary"
                        onPress={handleConfirm}
                        style={{ marginTop: 24, paddingVertical: 16 }}
                    />
                </View>
            </Animated.View>
        </Modal>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
        alignItems: "center"
    },
    modalContent: {
        backgroundColor: colors.bg,
        width: "100%",
        padding: 24,
        paddingBottom: 48,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10
    },
    closeBtn: {
        position: "absolute",
        top: 24,
        right: 24,
        zIndex: 10
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16
    },
    title: {
        fontSize: 24,
        fontWeight: "900",
        color: colors.text
    },
    subtitle: {
        fontSize: 15,
        color: colors.muted,
        lineHeight: 22,
        marginBottom: 32
    },
    recordBox: {
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: colors.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.border
    },
    micPulse: {
        position: "absolute",
        width: 100,
        height: 100,
        borderRadius: 50
    },
    micBtn: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        elevation: 5,
        shadowColor: colors.primary,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10
    },
    recordText: {
        fontSize: 14,
        fontWeight: "600"
    }
});
