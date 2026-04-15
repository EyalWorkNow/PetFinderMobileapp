import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Dimensions,
    ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    StatusUp,
    Profile2User,
    DocumentText,
    MoneySend,
    Flash,
    ShieldTick,
    Setting2,
    Chart
} from "iconsax-react-native";
import { useThemeColors, AppCard } from "../components/ui";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

interface AdminStats {
    totalPosts: number;
    totalUsers: number;
    totalDonations: number;
    activePatrols: number;
}

export function AdminDashboardScreen() {
    const insets = useSafeAreaInsets();
    const theme = useThemeColors();
    const { accessToken } = useAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const data = await apiRequest<AdminStats>("/admin/stats", {
                accessToken
            });
            setStats(data);
        } catch (error) {
            console.error("[AdminDashboard] Failed to fetch stats:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <AppCard style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: color + "15" }]}>
                <Icon size={24} color={color} variant="Bulk" />
            </View>
            <View>
                <Text style={[styles.statTitle, { color: theme.muted }]}>{title}</Text>
                <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
            </View>
        </AppCard>
    );

    if (loading && !refreshing) {
        return (
            <View style={[styles.center, { backgroundColor: theme.bg }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <LinearGradient
                colors={[theme.primarySoft, theme.bg]}
                style={styles.headerBg}
            />

            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <View>
                    <Text style={[styles.greeting, { color: theme.muted }]}>System Overview</Text>
                    <Text style={[styles.title, { color: theme.text }]}>Admin Command Center</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                    <ShieldTick size={16} color="#FFF" variant="Bold" />
                    <Text style={styles.badgeText}>ADMIN privileged</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            >
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Total Users"
                        value={stats?.totalUsers ?? 0}
                        icon={Profile2User}
                        color="#2F89FC"
                    />
                    <StatCard
                        title="Active Posts"
                        value={stats?.totalPosts ?? 0}
                        icon={DocumentText}
                        color="#F02A71"
                    />
                    <StatCard
                        title="Donations"
                        value={`$${stats?.totalDonations ?? 0}`}
                        icon={MoneySend}
                        color="#F78F1E"
                    />
                    <StatCard
                        title="Health"
                        value="Optimal"
                        icon={StatusUp}
                        color="#00C853"
                    />
                </View>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Real-time Activity</Text>

                <AppCard style={styles.activityCard}>
                    <View style={styles.activityRow}>
                        <View style={[styles.activityDot, { backgroundColor: "#00C853" }]} />
                        <Text style={[styles.activityText, { color: theme.text }]}>System services heartbeats: OK</Text>
                    </View>
                    <View style={styles.activityRow}>
                        <View style={[styles.activityDot, { backgroundColor: "#2F89FC" }]} />
                        <Text style={[styles.activityText, { color: theme.text }]}>Database connection peak: 42ms</Text>
                    </View>
                    <View style={styles.activityRow}>
                        <View style={[styles.activityDot, { backgroundColor: "#F78F1E" }]} />
                        <Text style={[styles.activityText, { color: theme.text }]}>Matching engine: Running idle</Text>
                    </View>
                </AppCard>

                <View style={styles.actionButtons}>
                    <View style={[styles.actionBtn, { backgroundColor: theme.surface }]}>
                        <Flash size={24} color={theme.primary} variant="Bulk" />
                        <Text style={[styles.actionLabel, { color: theme.text }]}>Quick Sync</Text>
                    </View>
                    <View style={[styles.actionBtn, { backgroundColor: theme.surface }]}>
                        <Chart size={24} color={theme.primary} variant="Bulk" />
                        <Text style={[styles.actionLabel, { color: theme.text }]}>Report Export</Text>
                    </View>
                    <View style={[styles.actionBtn, { backgroundColor: theme.surface }]}>
                        <Setting2 size={24} color={theme.primary} variant="Bulk" />
                        <Text style={[styles.actionLabel, { color: theme.text }]}>Config</Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    headerBg: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 300,
    },
    header: {
        paddingHorizontal: 24,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: 24
    },
    greeting: {
        fontSize: 14,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 1
    },
    title: {
        fontSize: 24,
        fontWeight: "900",
        marginTop: 4
    },
    badge: {
        flexDirection: "row",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: "center",
        gap: 6
    },
    badgeText: {
        color: "#FFF",
        fontSize: 10,
        fontWeight: "800",
        textTransform: "uppercase"
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 32
    },
    statCard: {
        width: (width - 56) / 2,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center"
    },
    statTitle: {
        fontSize: 12,
        fontWeight: "600"
    },
    statValue: {
        fontSize: 18,
        fontWeight: "900",
        marginTop: 2
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 16,
        marginLeft: 4
    },
    activityCard: {
        padding: 20,
        gap: 16,
        marginBottom: 32
    },
    activityRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    activityDot: {
        width: 8,
        height: 8,
        borderRadius: 4
    },
    activityText: {
        fontSize: 14,
        fontWeight: "500"
    },
    actionButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12
    },
    actionBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        alignItems: "center",
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: "700"
    }
});
