import React from "react";
import { Pressable, PressableProps } from "react-native";
import { playSound } from "../audio";

export function SoundPressable({ onPress, ...props }: PressableProps) {
  return (
    <Pressable
      android_disableSound
      {...props}
      onPress={
        onPress
          ? (event) => {
              playSound("click");
              onPress(event);
            }
          : undefined
      }
    />
  );
}
