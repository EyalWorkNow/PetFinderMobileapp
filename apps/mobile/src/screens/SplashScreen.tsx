import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "../components/ui";

export function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true
      })
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: "center", gap: 10 }}>
        <View style={styles.logoWrap}>
          <Svg width={86} height={86} viewBox="0 0 86 86">
            <Circle cx={43} cy={43} r={40} fill="#0A4A72" />
            <Path d="M43 20c-9 0-16 7-16 16 0 10 16 27 16 27s16-17 16-27c0-9-7-16-16-16z" fill="#F08A24" />
            <Circle cx={43} cy={37} r={6} fill="#fff" />
            <Circle cx={33} cy={31} r={4} fill="#fff" />
            <Circle cx={53} cy={31} r={4} fill="#fff" />
            <Circle cx={31} cy={42} r={4} fill="#fff" />
            <Circle cx={55} cy={42} r={4} fill="#fff" />
          </Svg>
        </View>
        <Text style={styles.title}>PetFind</Text>
        <Text style={styles.subtitle}>Reconnect families with their pets</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    gap: 10
  },
  logoWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#DDEBFA",
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.primary
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15
  }
});
