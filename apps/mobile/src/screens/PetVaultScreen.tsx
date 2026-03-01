import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
    Pet,
    Health,
    NotificationStatus,
    Calendar,
    AddCircle,
    Profile2User,
    Record,
    Verify,
    Edit2
} from "iconsax-react-native";
import { colors, useThemeColors, AppButton, AppCard } from "../components/ui";
import { usePetVault, DashboardTask } from "../context/PetVaultContext";
import { TaskFormModal } from "../components/petvault/TaskFormModal";
import { RecordFormModal } from "../components/petvault/RecordFormModal";
import { EditProfileModal } from "../components/petvault/EditProfileModal";
import { useTranslation } from "../i18n/useTranslation";

const { width } = Dimensions.get("window");

export function PetVaultScreen() {
    const insets = useSafeAreaInsets();
    const theme = useThemeColors();
    const { profile, records, tasks, healthCondition, nextVetDate } = usePetVault();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<"passport" | "health">("passport");

    const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState<DashboardTask | null>(null);
    const [isRecordModalVisible, setIsRecordModalVisible] = useState(false);
    const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

    const openTaskModal = (task?: DashboardTask) => {
        setSelectedTask(task || null);
        setIsTaskModalVisible(true);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <Text style={[styles.title, { color: theme.text }]}>{t("PetVaultHub")}</Text>
                {activeTab === "health" ? (
                    <Pressable
                        style={[styles.addBtn, { backgroundColor: theme.primarySoft }]}
                        onPress={() => openTaskModal()}
                    >
                        <AddCircle size={24} color={theme.primary} variant="Bulk" />
                    </Pressable>
                ) : (
                    <Pressable
                        style={[styles.addBtn, { backgroundColor: theme.primarySoft }]}
                        onPress={() => setIsRecordModalVisible(true)}
                    >
                        <AddCircle size={24} color={theme.primary} variant="Bulk" />
                    </Pressable>
                )}
            </View>

            <View style={styles.tabBar}>
                {(["passport", "health"] as const).map((tTab) => (
                    <Pressable
                        key={tTab}
                        onPress={() => setActiveTab(tTab)}
                        style={[styles.tab, activeTab === tTab && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
                    >
                        <Text style={[styles.tabText, { color: activeTab === tTab ? theme.text : theme.muted }]}>
                            {tTab === "passport" ? t("DigitalPassport") : t("HealthTracker")}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
                {activeTab === "passport" ? (
                    <>
                        {/* Main Pet Card */}
                        <LinearGradient colors={[theme.primary, "#6366f1"]} style={styles.petIDCard}>
                            <Pressable style={styles.petCardHeader} onPress={() => setIsProfileModalVisible(true)}>
                                <Pet size={32} color="#fff" />
                                <View style={styles.verifiedBadge}>
                                    <Verify size={14} color="#fff" variant="Bold" />
                                    <Text style={styles.verifiedText}>{t("EditProfile")}</Text>
                                </View>
                            </Pressable>
                            <View style={styles.petCardBody}>
                                <View style={styles.petAvatarBg}>
                                    <Pet size={40} color={theme.primary} variant="Bulk" />
                                </View>
                                <View>
                                    <Text style={styles.petName}>{profile.name}</Text>
                                    <Text style={styles.petBreed}>{profile.breed} • {profile.age}</Text>
                                </View>
                            </View>
                            <View style={styles.petCardFooter}>
                                <View>
                                    <Text style={styles.footerLabel}>{t("CHIPID")}</Text>
                                    <Text style={styles.footerVal}>{profile.chipId}</Text>
                                </View>
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={styles.footerLabel}>{t("STATUS")}</Text>
                                    <Text style={styles.footerVal}>{profile.status}</Text>
                                </View>
                            </View>
                        </LinearGradient>

                        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("CriticalSearchIntel")}</Text>

                        <View style={styles.intelList}>
                            {records.map((item) => (
                                <AppCard key={item.id} style={styles.intelItem}>
                                    <View style={[styles.intelIconBg, { backgroundColor: item.iconType === "danger" ? theme.dangerSoft : item.iconType === "warning" ? "#FEF3C7" : item.iconType === "success" ? theme.successSoft : theme.primarySoft }]}>
                                        {item.iconType === "danger" && <NotificationStatus size={20} color={theme.danger} variant="Bold" />}
                                        {item.iconType === "warning" && <Health size={20} color="#F59E0B" variant="Bold" />}
                                        {item.iconType === "info" && <Edit2 size={20} color={theme.primary} variant="Bold" />}
                                        {item.iconType === "success" && <Record size={20} color={theme.success} variant="Bold" />}
                                    </View>
                                    <View style={{ flex: 1, gap: 2 }}>
                                        <Text style={[styles.intelLabel, { color: theme.text }]}>{t(item.label as any) || item.label}</Text>
                                        <Text style={[styles.intelValue, { color: theme.muted }]}>{t(item.value as any) || item.value}</Text>
                                    </View>
                                </AppCard>
                            ))}
                        </View>
                    </>
                ) : (
                    <>
                        <View style={[styles.healthSummary, { backgroundColor: theme.surface }]}>
                            <View style={styles.summaryItem}>
                                <Health size={28} color="#EF4444" variant="Bulk" />
                                <Text style={[styles.summaryVal, { color: theme.text }]}>{healthCondition}</Text>
                                <Text style={[styles.summaryLabel, { color: theme.muted }]}>{t("Condition")}</Text>
                            </View>
                            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
                            <View style={styles.summaryItem}>
                                <Calendar size={28} color="#3B82F6" variant="Bulk" />
                                <Text style={[styles.summaryVal, { color: theme.text }]}>{nextVetDate}</Text>
                                <Text style={[styles.summaryLabel, { color: theme.muted }]}>{t("NextVet")}</Text>
                            </View>
                        </View>

                        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("UpcomingTasks")}</Text>

                        {tasks.map((task) => (
                            <Pressable
                                key={task.id}
                                style={[styles.taskCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={() => openTaskModal(task)}
                            >
                                <View style={[styles.taskIndicator, { backgroundColor: task.type === "VET" ? "#EF4444" : task.type === "CARE" ? "#F59E0B" : "#3B82F6" }]} />
                                <View style={{ flex: 1, gap: 4 }}>
                                    <Text style={[styles.taskTitle, { color: theme.text }]}>{task.title}</Text>
                                    <View style={styles.row}>
                                        <Calendar size={14} color={theme.muted} />
                                        <Text style={{ color: theme.muted, fontSize: 12 }}>{task.date} • {task.time}</Text>
                                    </View>
                                </View>
                                <View style={styles.editBtn}>
                                    <Edit2 size={18} color={theme.muted} />
                                </View>
                            </Pressable>
                        ))}
                    </>
                )}
            </ScrollView>

            <TaskFormModal
                visible={isTaskModalVisible}
                onClose={() => setIsTaskModalVisible(false)}
                initialTask={selectedTask}
            />

            <RecordFormModal
                visible={isRecordModalVisible}
                onClose={() => setIsRecordModalVisible(false)}
            />

            <EditProfileModal
                visible={isProfileModalVisible}
                onClose={() => setIsProfileModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingBottom: 16 },
    title: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
    addBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    tabBar: { flexDirection: "row", paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
    tab: { paddingVertical: 12, marginRight: 24 },
    tabText: { fontSize: 15, fontWeight: "800" },
    content: { padding: 24, gap: 24 },
    petIDCard: { padding: 24, borderRadius: 32, gap: 24, elevation: 8, shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 10 } },
    petCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    verifiedText: { color: "#fff", fontSize: 11, fontWeight: "800" },
    petCardBody: { flexDirection: "row", alignItems: "center", gap: 16 },
    petAvatarBg: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
    petName: { color: "#fff", fontSize: 24, fontWeight: "900" },
    petBreed: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600" },
    petCardFooter: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)", paddingTop: 20 },
    footerLabel: { color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "800" },
    footerVal: { color: "#fff", fontSize: 13, fontWeight: "900", marginTop: 2 },
    sectionTitle: { fontSize: 22, fontWeight: "900" },
    intelList: { gap: 12 },
    intelItem: { flexDirection: "row", alignItems: "flex-start", padding: 16, gap: 12, borderRadius: 20 },
    intelIconBg: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    intelLabel: { fontSize: 15, fontWeight: "800" },
    intelValue: { fontSize: 13, lineHeight: 18, marginTop: 2 },
    healthSummary: { flexDirection: "row", padding: 24, borderRadius: 32, gap: 20 },
    summaryItem: { flex: 1, alignItems: "center", gap: 4 },
    summaryVal: { fontSize: 20, fontWeight: "900" },
    summaryLabel: { fontSize: 12, fontWeight: "600" },
    summaryDivider: { width: 1, height: "60%", alignSelf: "center" },
    taskCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 24, borderWidth: 1, gap: 16 },
    taskIndicator: { width: 6, height: 40, borderRadius: 3 },
    taskTitle: { fontSize: 16, fontWeight: "800" },
    row: { flexDirection: "row", alignItems: "center", gap: 6 },
    editBtn: { padding: 8 },
});
