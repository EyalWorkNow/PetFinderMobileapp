import React, { useState, useRef } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    View,
    NativeSyntheticEvent,
    NativeScrollEvent
} from "react-native";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppButton, useThemeColors } from "../components/ui";

interface OnboardingProps {
    onComplete: () => void;
}

const { width, height } = Dimensions.get("window");

const SLIDES = [
    {
        id: "1",
        title: "החברים שלנו, האחריות שלנו",
        description: "איבדתם כלב? מצאתם חתול אבוד ברחוב? הגעתם למקום הנכון. PetFind היא הרשת החברתית המהירה והחכמה ביותר לאיחוד משפחות עם חיות המחמד שלהן.",
        icon: "🐶"
    },
    {
        id: "2",
        title: "התאמות חכמות בזמן אמת",
        description: "כבר לא צריך לגלול שעות בקבוצות פייסבוק. בעזרת אלגוריתם מתקדם של זיהוי תמונה, מיקום, ופיצ'רים פיזיים - אנחנו נמצא את החיבורים בשבילכם ונתריע מיידית שיש התאמה.",
        icon: "⚡️"
    },
    {
        id: "3",
        title: "קהילה בטוחה ושקופה",
        description: "שמירה על הפרטיות שלכם היא ערך עליון. התכתבו בבטחה בתוך האפליקציה, שתפו מיקומים מדויקים רק כשצריך, וביחד – נחזיר כל חיה הביתה בול בזמן.",
        icon: "🛡️"
    }
];

export function OnboardingScreen({ onComplete }: OnboardingProps) {
    const colors = useThemeColors();
    const styles = getStyles(colors);
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / width);
        if (index !== currentIndex) {
            setCurrentIndex(index);
            Haptics.selectionAsync().catch(() => { });
        }
    };

    const handleNext = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
            await AsyncStorage.setItem("petfind.has_seen_onboarding", "true");
            onComplete();
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                renderItem={({ item }) => (
                    <View style={styles.slide}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.icon}>{item.icon}</Text>
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.description}>{item.description}</Text>
                        </View>
                    </View>
                )}
            />

            <View style={styles.footer}>
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                currentIndex === index ? styles.dotActive : null
                            ]}
                        />
                    ))}
                </View>

                <View style={styles.buttonWrapper}>
                    <AppButton
                        label={currentIndex === SLIDES.length - 1 ? "בואו נתחיל" : "המשך"}
                        onPress={handleNext}
                    />
                </View>
            </View>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg
    },
    slide: {
        width,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        paddingBottom: 100
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: colors.primarySoft,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 40,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 4
    },
    icon: {
        fontSize: 64
    },
    textContainer: {
        alignItems: "center",
        gap: 16
    },
    title: {
        fontSize: 28,
        fontWeight: "900",
        color: colors.primary,
        textAlign: "center"
    },
    description: {
        fontSize: 16,
        color: colors.muted,
        textAlign: "center",
        lineHeight: 24,
        fontWeight: "500",
        paddingHorizontal: 16
    },
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 50,
        backgroundColor: colors.surface,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 10
    },
    pagination: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
        marginBottom: 24
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.border
    },
    dotActive: {
        width: 24,
        backgroundColor: colors.primary
    },
    buttonWrapper: {
        width: "100%"
    }
});
