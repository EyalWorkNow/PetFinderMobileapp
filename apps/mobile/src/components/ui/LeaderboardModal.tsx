import React from "react";
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Platform } from "react-native";
import { useThemeColors, AppButton } from "../ui";
import { CloseSquare, MedalStar, ShieldTick } from "iconsax-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "../../i18n/useTranslation";

interface LeaderboardModalProps {
    visible: boolean;
    onClose: () => void;
    currentTier: string;
    currentPoints: number;
}

const MOCK_LEADERBOARD = [
    { rank: 1, name: "Sarah J.", tier: "Neighborhood Legend", points: 15420, isMe: false },
    { rank: 2, name: "Mike T.", tier: "Elite Protector", points: 12100, isMe: false },
    { rank: 3, name: "Jessica R.", tier: "Elite Protector", points: 11050, isMe: false },
    { rank: 4, name: "David L.", tier: "Guardian", points: 8400, isMe: false },
    { rank: 5, name: "Emma W.", tier: "Guardian", points: 7900, isMe: false },
];

export function LeaderboardModal({ visible, onClose, currentTier, currentPoints }: LeaderboardModalProps) {
    const theme = useThemeColors();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const allPlayers = [
        { id: "sarah", name: "Sarah J.", tier: t("NeighborhoodLegend") || "Neighborhood Legend", points: 15420, isMe: false },
        { id: "mike", name: "Mike T.", tier: t("EliteProtector") || "Elite Protector", points: 12100, isMe: false },
        { id: "jessica", name: "Jessica R.", tier: t("EliteProtector") || "Elite Protector", points: 11050, isMe: false },
        { id: "david", name: "David L.", tier: t("GuardianT") || "Guardian", points: 8400, isMe: false },
        { id: "emma", name: "Emma W.", tier: t("GuardianT") || "Guardian", points: 7900, isMe: false },
        { id: "me", name: t("You") || "You", tier: t(currentTier.replace(" ", "") as any) || currentTier, points: currentPoints, isMe: true }
    ].sort((a, b) => b.points - a.points);

    // Assign dynamic ranks
    const sortedLeaderboard = allPlayers.map((player, index) => ({
        ...player,
        rank: index + 1
    }));

    const myRankItem = sortedLeaderboard.find(p => p.isMe)!;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.container}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={[styles.sheet, { backgroundColor: theme.bg, paddingBottom: insets.bottom + 24 }]}>
                    <View style={styles.header}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <ShieldTick size={28} color={theme.primary} variant="Bulk" />
                            <Text style={[styles.title, { color: theme.text }]}>{t("TopGuardians")}</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <CloseSquare size={28} color={theme.text} variant="Bulk" />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                        {sortedLeaderboard.map((item) => (
                            <View
                                key={item.id}
                                style={[
                                    styles.rankItem,
                                    { backgroundColor: item.isMe ? theme.primarySoft : theme.surface, borderColor: item.isMe ? theme.primary : theme.border },
                                    item.rank === 1 && { borderColor: "#F59E0B", borderWidth: 1.5 },
                                    item.isMe && { borderWidth: 1 }
                                ]}
                            >
                                <View style={[styles.rankBadge, item.rank === 1 ? { backgroundColor: "#F59E0B" } : item.isMe ? { backgroundColor: theme.primary } : {}]}>
                                    <Text style={[styles.rankNum, (item.rank === 1 || item.isMe) && { color: "#fff" }]}>#{item.rank}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.playerName, { color: theme.text }]}>{item.name}</Text>
                                    <Text style={[styles.playerTier, { color: item.isMe ? theme.primary : theme.muted }]}>{item.tier}</Text>
                                </View>
                                <Text style={[styles.playerPoints, { color: theme.primary }]}>{item.points.toLocaleString()} pts</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "flex-end" },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
    sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingTop: 32, gap: 16, maxHeight: "90%" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    title: { fontSize: 24, fontWeight: "900" },
    closeBtn: { padding: 4 },
    list: { gap: 12 },
    rankItem: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 20, borderWidth: 1, gap: 12, marginBottom: 12 },
    rankBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center" },
    rankNum: { fontSize: 13, fontWeight: "900" },
    playerName: { fontSize: 16, fontWeight: "800" },
    playerTier: { fontSize: 12, fontWeight: "600", marginTop: 2 },
    playerPoints: { fontSize: 14, fontWeight: "800" },
    divider: { height: 1, backgroundColor: "rgba(0,0,0,0.1)", marginVertical: 12 }
});
