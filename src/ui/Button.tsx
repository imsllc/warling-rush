import React from "react";
import { Text } from "react-native";
import { SoundPressable as Pressable } from "./SoundPressable";
import { ui } from "./theme";
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        secondary && ui.secondary,
        disabled && ui.disabled,
        pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
      ]}
    >
      <Text style={[ui.buttonText, secondary && ui.lightText]}>{title}</Text>
    </Pressable>
  );
}
