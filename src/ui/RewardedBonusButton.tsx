import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SoundPressable } from "./SoundPressable";
import { GameIcon } from "./GameIcon";
import { chrome } from "./chrome";

export function RewardedBonusButton({
  onPress,
  disabled,
  busy,
  amount,
}: {
  onPress: () => void;
  disabled: boolean;
  busy: boolean;
  amount: number;
}) {
  return (
    <SoundPressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Watch a rewarded ad to double your battle reward from ${amount} to ${amount * 2} coins`}
      accessibilityState={{ disabled, busy }}
      style={({ pressed }) => [
        styles.button,
        chrome.resultAction,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.row}>
        {busy ? (
          <ActivityIndicator color="#173a24" />
        ) : (
          <GameIcon name="video" size={24} />
        )}
        <Text style={styles.label}>Collect x2</Text>
      </View>
    </SoundPressable>
  );
}
const styles = StyleSheet.create({
  button: {
    borderRadius: 6,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: "#285137",
    backgroundColor: "#91db69",
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  label: { color: "#173a24", fontSize: 16, fontWeight: "900" },
  disabled: { opacity: 0.5 },
  pressed: { transform: [{ translateY: 2 }] },
});
