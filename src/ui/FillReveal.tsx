import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { foodFillFraction } from "./foodProgress";

// The colored copy stays anchored to the original artwork while its clipping
// window grows upward. The muted copy keeps the unfilled area readable.
export function FillReveal({
  amount,
  target = 1,
  fillColor = "transparent",
  style,
  contentStyle,
  children,
}: {
  amount: SharedValue<number>;
  target?: number;
  fillColor?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const height = useSharedValue(0);
  const revealStyle = useAnimatedStyle(() => ({
    height: height.value * foodFillFraction(amount.value, target),
  }));
  const contentSize = useAnimatedStyle(() => ({ height: height.value }));
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.container, style]}
      onLayout={({ nativeEvent }) => {
        height.value = nativeEvent.layout.height;
      }}
    >
      <View style={[styles.content, contentStyle, styles.muted]}>
        {children}
      </View>
      <Animated.View style={[styles.reveal, revealStyle]}>
        <Animated.View
          style={[
            styles.coloredContent,
            contentStyle,
            contentSize,
            { backgroundColor: fillColor },
          ]}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: "hidden" },
  content: { alignItems: "center" },
  muted: { opacity: 0.34 },
  reveal: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  coloredContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
