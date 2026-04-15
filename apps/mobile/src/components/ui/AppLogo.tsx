import React from "react";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { useThemeColors } from "../ui";

interface AppLogoProps {
    size?: number;
    color?: string;
    secondaryColor?: string;
}

export function AppLogo({ size = 216, color, secondaryColor }: AppLogoProps) {
    const theme = useThemeColors();
    const primary = color || theme.primary;
    const secondary = secondaryColor || theme.primaryDark;

    // Scale factor based on the original 216x216 viewbox
    const scale = size / 216;

    return (
        <Svg width={size} height={size} viewBox="0 0 216 216" fill="none">
            <Defs>
                <LinearGradient id="logo_grad_main" x1="107.81" y1="5.35889" x2="107.81" y2="210.359" gradientUnits="userSpaceOnUse">
                    <Stop stopColor={primary} />
                    <Stop offset="1" stopColor={secondary} />
                </LinearGradient>
                <LinearGradient id="logo_grad_inner" x1="108.349" y1="73.356" x2="108.349" y2="116.77" gradientUnits="userSpaceOnUse">
                    <Stop stopColor={primary} />
                    <Stop offset="1" stopColor={secondary} />
                </LinearGradient>
            </Defs>

            {/* Outer Pin / Drop Shape */}
            <Path
                d="M 182.44,79.85 C 182.44,40.28 150.07,5.36 108,5.36 H 107.62 C 65.55,5.36 33.18,39.96 33.18,79.85 C 33.18,95.96 38.76,109.84 47.19,122.11 L 108.01,210.36 L 167.09,125.91 C 176.46,113.75 182.44,98.69 182.44,79.85 Z"
                fill="url(#logo_grad_main)"
            />

            {/* Inner White Circle */}
            <Path
                d="M 107.62,20.7 C 74.67,20.7 50.18,48.88 50.18,80.21 C 50.18,111.66 75.73,137.88 107.62,137.88 C 139.52,137.88 165.44,111.67 165.44,80.21 C 165.44,49.09 140.14,20.7 107.62,20.7 Z"
                fill="white"
            />

            {/* Ears / Features */}
            <Path
                d="M 102.22,47.82 C 99.87,43.98 96.76,42.26 93.78,42.41 C 87.84,42.71 85.93,50.32 85.91,55.17 C 85.88,62.92 90.75,70.66 97.02,70.49 C 103.16,70.31 105.66,62.89 105.37,57.73 C 105.17,54.43 104.21,50.94 102.22,47.82 Z"
                fill="url(#logo_grad_inner)"
            />
            <Path
                d="M 122.81,42.26 C 116.29,42.26 110.22,50.49 110.22,58.54 C 110.22,65.86 113.71,70.54 119.24,70.54 C 125.76,70.54 130.84,61.97 130.66,55.06 C 130.49,48.66 127.46,42.26 122.81,42.26 Z"
                fill="url(#logo_grad_inner)"
            />

            {/* Eyes */}
            <Path
                d="M 140.97,62.26 C 134.71,62.26 128.55,70.73 128.66,77.6 C 128.78,83.16 131.46,86.92 136.38,86.8 C 143.08,86.63 148.22,78.43 148.11,72.48 C 147.99,67.15 145.48,62.26 140.97,62.26 Z"
                fill="url(#logo_grad_inner)"
            />
            <Path
                d="M 75.41,62.26 C 69.81,62.26 67.82,67.77 67.82,72.39 C 67.82,80.08 73.71,86.81 79.97,86.81 C 85.22,86.81 87.21,81.36 87.21,77.22 C 87.21,69.91 81.32,62.26 75.41,62.26 Z"
                fill="url(#logo_grad_inner)"
            />

            {/* Nose / Muzzle */}
            <Path
                d="M 130.61,91.91 C 126.95,89.06 124.36,86.75 121.91,81.86 C 118.62,75.8 113.48,73.36 108.34,73.36 C 102.07,73.36 97.1,76.93 94.51,82.76 C 92.28,87.21 89.93,89.41 85.88,92.44 C 80.8,96.23 79.47,100.21 79.47,104.95 C 79.47,112.15 84.94,116.99 90.98,116.76 C 97.02,116.64 100.04,112.85 108.01,112.73 C 113.15,112.67 117.19,116.64 124.63,116.64 C 132.83,116.64 137.23,109.72 137.23,104.21 C 137.23,99.06 135.01,95.33 130.61,91.91 Z"
                fill="url(#logo_grad_inner)"
            />
        </Svg>
    );
}
