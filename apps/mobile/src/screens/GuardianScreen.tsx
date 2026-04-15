import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
    ShieldTick,
    LocationTick,
    Flash,
    Map1,
    Radar,
    Danger,
    Warning2,
    Moon,
    Car
} from "iconsax-react-native";
import { useGuardian } from "../context/GuardianContext";
import { useThemeColors, AppButton } from "../components/ui";
import { BarkAlertModal } from "../components/ui/BarkAlertModal";
import { LeaderboardModal } from "../components/ui/LeaderboardModal";
import { useAcoustics } from "../context/AudioContext";
import { useState } from "react";
import { useTranslation } from "../i18n/useTranslation";

export function GuardianScreen() {
    const insets = useSafeAreaInsets();
    const theme = useThemeColors();
    const { playSound } = useAcoustics();
    const {
        points, level, tier, streak, isPatrolling,
        togglePatrol
    } = useGuardian();

    const [isLeaderboardVisible, setIsLeaderboardVisible] = useState(false);
    const [isBarkAlertVisible, setIsBarkAlertVisible] = useState(false);
    const { t } = useTranslation();

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <LinearGradient colors={[theme.primarySoft, theme.bg]} style={styles.headerGradient}>
                <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                    <View>
                        <Text style={[styles.welcome, { color: theme.muted }]}>{t("NeighborhoodGuardian")}</Text>
                        <Text style={[styles.tier, { color: theme.text }]}>{tier}</Text>
                    </View>
                    <View style={[styles.streakBadge, { backgroundColor: theme.surface }]}>
                        <Flash size={18} color="#FF9500" variant="Bold" />
                        <Text style={[styles.streakText, { color: theme.text }]}>{streak} {t("DayStreak")}</Text>
                    </View>
                </View>

                {/* Level Progress */}
                <View style={styles.progressContainer}>
                    <View style={styles.levelCircle}>
                        <Text style={styles.levelNumber}>{level}</Text>
                        <Text style={styles.levelLabel}>{t("LEVEL")}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 8 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={{ color: theme.text, fontWeight: "700" }}>{points} {t("PawPoints")}</Text>
                            <Text style={{ color: theme.muted }}>{t("NextWithColon")} 500</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${(points % 500) / 5}%`, backgroundColor: theme.primary }]} />
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>

                {/* Neighborhood Patrol Mode */}
                <Pressable
                    onPress={() => { playSound("pop"); togglePatrol(); }}
                    style={[
                        styles.patrolCard,
                        { backgroundColor: isPatrolling ? theme.primary : theme.surface, borderColor: theme.border }
                    ]}
                >
                    <View style={styles.patrolIconContainer}>
                        {isPatrolling ? (
                            <Radar size={40} color="#fff" variant="Bulk" />
                        ) : (
                            <Map1 size={40} color={theme.primary} />
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.patrolTitle, { color: isPatrolling ? "#fff" : theme.text }]}>
                            {isPatrolling ? t("PatrolActive") : t("StartPatrol")}
                        </Text>
                        <Text style={[styles.patrolDesc, { color: isPatrolling ? "rgba(255,255,255,0.8)" : theme.muted }]}>
                            {isPatrolling ? t("TrackingPathDesc") : t("ScanWalkDesc")}
                        </Text>
                    </View>
                    <View style={[styles.patrolToggle, { backgroundColor: isPatrolling ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.05)" }]}>
                        <View style={[styles.toggleCircle, isPatrolling && { alignSelf: "flex-end", backgroundColor: "#fff" }]} />
                    </View>
                </Pressable>

                {/* Bark Alert Simulation Trigger */}
                <AppButton
                    label={t("SimulateBarkAlert")}
                    tone="danger"
                    onPress={() => setIsBarkAlertVisible(true)}
                />

                {/* Safety Guidelines */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("VolunteerSafety")}</Text>
                </View>

                <View style={styles.guidelinesContainer}>
                    <View style={[styles.guidelineCard, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
                        <View style={styles.guidelineHeader}>
                            <Danger size={24} color={theme.danger} variant="Bold" />
                            <Text style={[styles.guidelineTitle, { color: theme.danger }]}>{t("RabiesAggression")}</Text>
                        </View>
                        <Text style={[styles.guidelineText, { color: theme.text }]}>
                            {t("RabiesDesc")}
                        </Text>
                    </View>

                    <View style={[styles.guidelineCard, { backgroundColor: theme.surface, borderColor: "#F59E0B", borderWidth: 1.5 }]}>
                        <View style={styles.guidelineHeader}>
                            <Warning2 size={24} color="#F59E0B" variant="Bold" />
                            <Text style={[styles.guidelineTitle, { color: "#F59E0B" }]}>{t("ApproachProtocol")}</Text>
                        </View>
                        <Text style={[styles.guidelineText, { color: theme.text }]}>
                            {t("ApproachDesc")}
                        </Text>
                    </View>

                    <View style={[styles.guidelineCard, { backgroundColor: theme.surface, borderColor: theme.primary, borderWidth: 1 }]}>
                        <View style={styles.guidelineHeader}>
                            <Moon size={24} color={theme.primary} variant="Bold" />
                            <Text style={[styles.guidelineTitle, { color: theme.primary }]}>{t("NightOperations")}</Text>
                        </View>
                        <Text style={[styles.guidelineText, { color: theme.text }]}>
                            {t("NightDesc")}
                        </Text>
                    </View>

                    <View style={[styles.guidelineCard, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
                        <View style={styles.guidelineHeader}>
                            <Car size={24} color={theme.text} variant="Bold" />
                            <Text style={[styles.guidelineTitle, { color: theme.text }]}>{t("TrafficHighways")}</Text>
                        </View>
                        <Text style={[styles.guidelineText, { color: theme.text }]}>
                            {t("TrafficDesc")}
                        </Text>
                    </View>

                    <View style={[styles.guidelineCard, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
                        <View style={styles.guidelineHeader}>
                            <LocationTick size={24} color={theme.text} variant="Bold" />
                            <Text style={[styles.guidelineTitle, { color: theme.text }]}>{t("PrivateProperty")}</Text>
                        </View>
                        <Text style={[styles.guidelineText, { color: theme.text }]}>
                            {t("PrivatePropertyDesc")}
                        </Text>
                    </View>
                </View>

                {/* Leaderboard Teaser */}
                <Pressable
                    style={[styles.leaderboardTeaser, { backgroundColor: theme.surface }]}
                    onPress={() => setIsLeaderboardVisible(true)}
                >
                    <View style={styles.teaserHeader}>
                        <ShieldTick size={24} color={theme.primary} variant="Bulk" />
                        <Text style={[styles.teaserTitle, { color: theme.text }]}>{t("TopGuardiansNearby")}</Text>
                    </View>
                    <View style={styles.teaserAvatars}>
                        {["TopGuardian1", "TopGuardian2", "TopGuardian3"].map((key, i) => (
                            <View key={i} style={[styles.avatarCircle, { backgroundColor: theme.primarySoft, borderColor: theme.surface, marginLeft: i === 0 ? 0 : -12 }]}>
                                <Text style={{ fontSize: 12, color: theme.primary, fontWeight: "900" }}>{t(key as any).charAt(0)}</Text>
                            </View>
                        ))}
                        <Text style={{ color: theme.muted, fontSize: 13, marginLeft: 12, flex: 1, fontWeight: "500" }}>
                            {["TopGuardian1", "TopGuardian2"].map((k) => t(k as any)).join(", ")} {t("AndMore")}
                        </Text>
                    </View>
                </Pressable>
            </ScrollView>

            <LeaderboardModal
                visible={isLeaderboardVisible}
                onClose={() => setIsLeaderboardVisible(false)}
                currentTier={tier}
                currentPoints={points}
            />

            <BarkAlertModal
                visible={isBarkAlertVisible}
                onClose={() => setIsBarkAlertVisible(false)}
                onDeploy={() => {
                    setIsBarkAlertVisible(false);
                    if (!isPatrolling) togglePatrol();
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerGradient: { paddingHorizontal: 24, paddingBottom: 32 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    welcome: { fontSize: 14, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
    tier: { fontSize: 32, fontWeight: "900", letterSpacing: -1 },
    streakBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, elevation: 2, shadowOpacity: 0.1 },
    streakText: { fontSize: 13, fontWeight: "800" },
    progressContainer: { flexDirection: "row", alignItems: "center", gap: 20 },
    levelCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", elevation: 10, shadowOpacity: 0.2, shadowRadius: 10 },
    levelNumber: { fontSize: 24, fontWeight: "900", color: "#000" },
    levelLabel: { fontSize: 10, fontWeight: "800", color: "#666", marginTop: -2 },
    progressBarBg: { height: 8, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.05)", overflow: "hidden" },
    progressBarFill: { height: "100%", borderRadius: 4 },
    content: { padding: 24, gap: 24 },
    patrolCard: { flexDirection: "row", alignItems: "center", padding: 20, borderRadius: 32, borderWidth: 1, gap: 16, elevation: 4, shadowOpacity: 0.1 },
    patrolIconContainer: { width: 60, height: 60, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
    patrolTitle: { fontSize: 18, fontWeight: "900" },
    patrolDesc: { fontSize: 13, lineHeight: 18, marginTop: 4 },
    patrolToggle: { width: 44, height: 24, borderRadius: 12, padding: 2 },
    toggleCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.2)" },
    leaderboardTeaser: { padding: 20, borderRadius: 28, gap: 16 },
    teaserHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    teaserTitle: { fontSize: 16, fontWeight: "800" },
    teaserAvatars: { flexDirection: "row", alignItems: "center" },
    avatarCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
    sectionTitle: { fontSize: 22, fontWeight: "900" },
    guidelinesContainer: { gap: 16 },
    guidelineCard: { padding: 16, borderRadius: 20, borderWidth: 1 },
    guidelineHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
    guidelineTitle: { fontSize: 16, fontWeight: "900", textTransform: "uppercase" },
    guidelineText: { fontSize: 14, lineHeight: 22 }
});
