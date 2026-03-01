import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type TaskType = "VET" | "CARE" | "OTHER";

export interface DashboardTask {
    id: string;
    title: string;
    date: string;
    time: string;
    type: TaskType;
}

export interface PetRecord {
    id: string;
    label: string;
    value: string;
    iconType: "danger" | "warning" | "info" | "success";
}

export interface PetProfile {
    name: string;
    breed: string;
    age: string;
    chipId: string;
    status: string;
}

interface PetVaultState {
    profile: PetProfile;
    records: PetRecord[];
    tasks: DashboardTask[];
    healthCondition: string;
    nextVetDate: string;
}

interface PetVaultContextProps extends PetVaultState {
    updateProfile: (profile: Partial<PetProfile>) => void;
    addRecord: (record: Omit<PetRecord, "id">) => void;
    removeRecord: (id: string) => void;
    addTask: (task: Omit<DashboardTask, "id">) => void;
    updateTask: (id: string, task: Partial<DashboardTask>) => void;
    removeTask: (id: string) => void;
    updateHealthSummary: (condition: string, nextDate: string) => void;
}

const defaultState: PetVaultState = {
    profile: {
        name: "Buddy",
        breed: "Golden Retriever",
        age: "3y",
        chipId: "985 000 123 456 789",
        status: "SAFE",
    },
    records: [
        { id: "1", label: "Behavior", value: "SkittishAroundStrangers", iconType: "warning" },
        { id: "2", label: "Motivation", value: "HighlyFoodMotivated", iconType: "success" },
        { id: "3", label: "Marks", value: "WhitePatchOnChest", iconType: "info" },
        { id: "4", label: "Triggers", value: "TerrifiedOfLoudNoises", iconType: "danger" }
    ],
    tasks: [
        { id: "1", title: "Rabies Booster", date: "Mar 12, 2026", time: "10:30 AM", type: "VET" },
        { id: "2", title: "Flea & Tick Treatment", date: "Apr 01, 2026", time: "08:00 AM", type: "CARE" },
        { id: "3", title: "Annual Checkup", date: "May 20, 2026", time: "16:00 PM", type: "VET" }
    ],
    healthCondition: "Good",
    nextVetDate: "12 Mar",
};

const PetVaultContext = createContext<PetVaultContextProps | undefined>(undefined);

export const PetVaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<PetVaultState>(defaultState);

    useEffect(() => {
        const loadData = async () => {
            try {
                const storedState = await AsyncStorage.getItem("petfind.petvault");
                if (storedState) {
                    setState(JSON.parse(storedState));
                }
            } catch (error) {
                console.error("Failed to load PetVault state", error);
            }
        };
        loadData();
    }, []);

    const recalculateHealthSummary = (currentTasks: DashboardTask[]) => {
        const vetTasks = currentTasks.filter(t => t.type === "VET");
        if (vetTasks.length > 0) {
            // Very naive date sorting for the purpose of the prototype
            const sorted = vetTasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const next = sorted[0].date.split(",")[0]; // "Mar 12"
            return { condition: "Good", nextVetDate: next };
        }
        return { condition: "Unknown", nextVetDate: "Not set" };
    };

    const saveState = async (newState: PetVaultState) => {
        setState(newState);
        try {
            await AsyncStorage.setItem("petfind.petvault", JSON.stringify(newState));
        } catch (error) {
            console.error("Failed to save PetVault state", error);
        }
    };

    const updateProfile = (profileUpdate: Partial<PetProfile>) => {
        saveState({ ...state, profile: { ...state.profile, ...profileUpdate } });
    };

    const addRecord = (record: Omit<PetRecord, "id">) => {
        const newRecord = { ...record, id: Date.now().toString() };
        saveState({ ...state, records: [...state.records, newRecord] });
    };

    const removeRecord = (id: string) => {
        saveState({ ...state, records: state.records.filter(r => r.id !== id) });
    };

    const addTask = (task: Omit<DashboardTask, "id">) => {
        const newTask = { ...task, id: Date.now().toString() };
        const newTasks = [...state.tasks, newTask];
        const healthVals = recalculateHealthSummary(newTasks);
        saveState({ ...state, tasks: newTasks, healthCondition: healthVals.condition, nextVetDate: healthVals.nextVetDate });
    };

    const updateTask = (id: string, taskUpdate: Partial<DashboardTask>) => {
        const updatedTasks = state.tasks.map(t => t.id === id ? { ...t, ...taskUpdate } : t);
        const healthVals = recalculateHealthSummary(updatedTasks);
        saveState({ ...state, tasks: updatedTasks, healthCondition: healthVals.condition, nextVetDate: healthVals.nextVetDate });
    };

    const removeTask = (id: string) => {
        const updatedTasks = state.tasks.filter(t => t.id !== id);
        const healthVals = recalculateHealthSummary(updatedTasks);
        saveState({ ...state, tasks: updatedTasks, healthCondition: healthVals.condition, nextVetDate: healthVals.nextVetDate });
    };

    const updateHealthSummary = (condition: string, nextDate: string) => {
        saveState({ ...state, healthCondition: condition, nextVetDate: nextDate });
    };

    return (
        <PetVaultContext.Provider value={{
            ...state,
            updateProfile,
            addRecord,
            removeRecord,
            addTask,
            updateTask,
            removeTask,
            updateHealthSummary
        }}>
            {children}
        </PetVaultContext.Provider>
    );
};

export const usePetVault = () => {
    const context = useContext(PetVaultContext);
    if (!context) {
        throw new Error("usePetVault must be used within a PetVaultProvider");
    }
    return context;
};
