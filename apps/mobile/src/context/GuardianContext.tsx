import React, { createContext, useContext, useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { Alert } from "react-native";

interface GuardianState {
    points: number;
    level: number;
    tier: string;
    streak: number;
    isPatrolling: boolean;
}

interface GuardianContextType extends GuardianState {
    awardPoints: (amount: number, reason: string) => void;
    togglePatrol: () => void;
}

const GuardianContext = createContext<GuardianContextType | undefined>(undefined);

const TIERS = ["Recruit", "Scout", "Guardian", "Elite Protector", "Neighborhood Legend"];

export const GuardianProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [points, setPoints] = useState(150); // Starting bonus
    const [level, setLevel] = useState(1);
    const [tier, setTier] = useState(TIERS[0]);
    const [streak] = useState(3);
    const [isPatrolling, setIsPatrolling] = useState(false);

    useEffect(() => {
        const newLevel = Math.floor(points / 500) + 1;
        if (newLevel > level) {
            setLevel(newLevel);
            setTier(TIERS[Math.min(newLevel - 1, TIERS.length - 1)]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Level Up! 🏆", `You've reached Level ${newLevel}: ${TIERS[Math.min(newLevel - 1, TIERS.length - 1)]}`);
        }
    }, [points]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isPatrolling) {
            timer = setInterval(() => {
                awardPoints(1, "Patrol Bonus");
            }, 3000); // 1 point every 3 seconds for demo purposes
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isPatrolling]);

    const awardPoints = (amount: number, reason: string) => {
        setPoints(prev => prev + amount);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // In a real app, show a toast or small UI popup
        console.log(`Awarded ${amount} points for ${reason}`);
    };

    const togglePatrol = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setIsPatrolling(!isPatrolling);
        if (!isPatrolling) {
            awardPoints(10, "Starting Patrol");
        }
    };

    return (
        <GuardianContext.Provider value={{
            points, level, tier, streak, isPatrolling,
            awardPoints, togglePatrol
        }}>
            {children}
        </GuardianContext.Provider>
    );
};

export const useGuardian = () => {
    const context = useContext(GuardianContext);
    if (!context) throw new Error("useGuardian must be used within GuardianProvider");
    return context;
};
