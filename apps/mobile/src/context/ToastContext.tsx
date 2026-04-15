import React, { createContext, useContext, useState, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "../components/ui";

export interface ToastConfig {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    tone?: "primary" | "success" | "danger";
    durationMs?: number;
}

interface ToastContextType {
    showToast: (config: ToastConfig) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<ToastConfig | null>(null);
    const slideAnim = useRef(new Animated.Value(100)).current;
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const colors = useThemeColors();

    const hideToast = () => {
        Animated.timing(slideAnim, {
            toValue: 100,
            duration: 250,
            useNativeDriver: true
        }).start(() => setToast(null));
    };

    const showToast = (config: ToastConfig) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setToast(config);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });

        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 12
        }).start();

        timeoutRef.current = setTimeout(() => {
            hideToast();
        }, config.durationMs || 5000);
    };

    const handleAction = () => {
        if (toast?.onAction) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
            toast.onAction();
        }
        hideToast();
    };

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {toast && (
                <View style={styles.toastContainer} pointerEvents="box-none">
                    <Animated.View
                        style={[
                            styles.toast,
                            { transform: [{ translateY: slideAnim }], backgroundColor: colors.surface, borderColor: colors.border }
                        ]}
                    >
                        <Text style={[styles.message, { color: colors.text }]}>{toast.message}</Text>
                        {toast.actionLabel && (
                            <TouchableOpacity onPress={handleAction}>
                                <Text style={[
                                    styles.action,
                                    { color: toast.tone === 'danger' ? colors.danger : colors.primary }
                                ]}>
                                    {toast.actionLabel}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                </View>
            )}
        </ToastContext.Provider>
    );
}

const styles = StyleSheet.create({
    toastContainer: {
        position: "absolute",
        bottom: 90, // Above bottom nav
        left: 20,
        right: 20,
        alignItems: "center",
        zIndex: 9999
    },
    toast: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
        width: "100%"
    },
    message: {
        fontSize: 15,
        fontWeight: "600",
        flex: 1
    },
    action: {
        fontSize: 15,
        fontWeight: "800",
        marginLeft: 12
    }
});
