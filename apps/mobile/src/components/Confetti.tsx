import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const EMOJIS = ["🐶", "🐱", "🎉", "💖", "🦴", "🐾", "✨"];
const NUM_PARTICLES = 40;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function Particle({ delay, x, y }: { delay: number; x: number; y: number }) {
    const anim = useRef(new Animated.Value(0)).current;
    const emoji = useRef(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]).current;
    const size = useRef(Math.random() * 16 + 16).current;

    const destX = x + (Math.random() - 0.5) * 300;
    const destY = y - (Math.random() * 400 + 200);

    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
                toValue: 1,
                duration: Math.random() * 800 + 1000,
                useNativeDriver: true
            })
        ]).start();
    }, [anim, delay]);

    const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, destY - y]
    });

    const translateX = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, destX - x]
    });

    const opacity = anim.interpolate({
        inputRange: [0, 0.7, 1],
        outputRange: [0, 1, 0]
    });

    const rotate = anim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", `${(Math.random() - 0.5) * 720}deg`]
    });

    return (
        <Animated.Text
            style={[
                styles.particle,
                {
                    fontSize: size,
                    left: x,
                    top: y,
                    opacity,
                    transform: [
                        { translateY },
                        { translateX },
                        { rotate }
                    ]
                }
            ]}
        >
            {emoji}
        </Animated.Text>
    );
}

export function Confetti({ active }: { active: boolean }) {
    if (!active) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {Array.from({ length: NUM_PARTICLES }).map((_, i) => (
                <Particle
                    key={i}
                    delay={Math.random() * 400}
                    x={SCREEN_WIDTH / 2}
                    y={SCREEN_HEIGHT - 100}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    particle: {
        position: "absolute",
        textAlign: "center"
    }
});
