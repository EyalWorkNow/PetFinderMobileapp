import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Modal, Animated, Pressable, Dimensions } from "react-native";
import { Warning2, Routing, CloseSquare } from "iconsax-react-native";
import { useThemeColors, AppButton } from "../ui";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

interface BarkAlertModalProps {
    visible: boolean;
    onClose: () => void;
    onDeploy: () => void;
    petName?: string;
    distance?: string;
}

const { height } = Dimensions.get("window");

export function BarkAlertModal({ visible, onClose, onDeploy, petName = "A Dog", distance = "1.2 km" }: BarkAlertModalProps) {
    const theme = useThemeColors();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(height)).current;

    useEffect(() => {
        if (visible) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            Animated.spring(slideAnim, {
                toValue: 0,
                damping: 20,
                stiffness: 90,
                useNativeDriver: true
            }).start();

            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 800,
                        useNativeDriver: true
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true
                    })
                ])
            ).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: height,
                duration: 300,
                useNativeDriver: true
            }).start();
        }
    }, [visible]);

    if (!visible) return null;

    const styles = getStyles(theme);

    return (
        <Modal transparent visible={visible} animationType="none">
            <BlurView intensity={80} tint={theme.bg === "#000" ? "dark" : "light"} style={styles.absoluteFill}>
                <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
                    <Pressable style={styles.closeButton} onPress={onClose}>
                        <CloseSquare size={32} color={theme.muted} variant="Bulk" />
                    </Pressable>

                    <Animated.View style={[styles.alertCircle, { transform: [{ scale: pulseAnim }] }]}>
                        <Warning2 size={64} color={theme.danger} variant="Bold" />
                    </Animated.View>

                    <Text style={[styles.alertTitle, { color: theme.danger }]}>BARK ALERT</Text>
                    <Text style={[styles.alertSubtitle, { color: theme.muted }]}>Emergency Deployment Requested</Text>

                    <View style={[styles.card, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.petName, { color: theme.text }]}>{petName} was just reported missing near your location!</Text>
                        <View style={[styles.distanceBadge, { backgroundColor: theme.danger }]}>
                            <Routing size={16} color="#fff" variant="Bold" />
                            <Text style={styles.distanceText}>Est. distance: {distance}</Text>
                        </View>
                    </View>

                    <Text style={[styles.instructions, { color: theme.text }]}>
                        You are in the primary search radius. Deploy now to help secure the perimeter before the pet moves further.
                    </Text>

                    <View style={styles.actions}>
                        <AppButton
                            label="DEPLOY NOW"
                            tone="danger"
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                onDeploy();
                            }}
                            style={styles.deployBtn}
                        />
                    </View>
                </Animated.View>
            </BlurView>
        </Modal>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    absoluteFill: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        padding: 24
    },
    container: {
        width: "100%",
        backgroundColor: colors.bg,
        borderRadius: 32,
        padding: 32,
        alignItems: "center",
        shadowColor: colors.danger,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 15,
        borderWidth: 2,
        borderColor: colors.dangerSoft
    },
    closeButton: {
        position: "absolute",
        top: 24,
        right: 24,
        zIndex: 10
    },
    alertCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.dangerSoft,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
        borderWidth: 4,
        borderColor: "rgba(239, 68, 68, 0.3)"
    },
    alertTitle: {
        fontSize: 32,
        fontWeight: "900",
        letterSpacing: 2,
        marginBottom: 8
    },
    alertSubtitle: {
        fontSize: 14,
        textTransform: "uppercase",
        letterSpacing: 1,
        fontWeight: "700",
        marginBottom: 32
    },
    card: {
        width: "100%",
        padding: 20,
        borderRadius: 20,
        alignItems: "center",
        gap: 12,
        marginBottom: 24
    },
    petName: {
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center"
    },
    distanceBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        gap: 6
    },
    distanceText: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 14
    },
    instructions: {
        fontSize: 15,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 32
    },
    actions: {
        width: "100%"
    },
    deployBtn: {
        paddingVertical: 18,
        borderRadius: 100
    }
});
