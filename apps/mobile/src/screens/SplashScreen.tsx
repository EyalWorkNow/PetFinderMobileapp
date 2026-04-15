import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { colors } from "../components/ui";
import { AppLogo } from "../components/ui/AppLogo";

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
          <AppLogo size={90} />
        </View>
        <Text style={styles.title}>PetFinder</Text>
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
