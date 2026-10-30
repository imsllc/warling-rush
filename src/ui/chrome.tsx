import React from "react";
import { StyleSheet, Text, View, StyleProp, ViewStyle } from "react-native";
import { SoundPressable as Pressable } from "./SoundPressable";
import { GameIcon, IconName } from "./GameIcon";
import { colors, radii } from "./theme";
export function Resource({
  icon,
  value,
  size = 26,
  dark = false,
  accessibilityLabel,
}: {
  icon: "coin" | "meat" | "battle" | "heart";
  value: string | number;
  size?: number;
  dark?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <View
      style={styles.resource}
      accessibilityLabel={
        accessibilityLabel ??
        `${value} ${icon === "coin" ? "coins" : icon === "meat" ? "food" : icon === "battle" ? "damage" : "health"}`
      }
    >
      <GameIcon name={icon} size={size} />
      <Text
        style={[
          styles.value,
          { fontSize: size * 0.82 },
          dark && { color: colors.border },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}
export function GameButton({
  label,
  children,
  onPress,
  disabled = false,
  secondary = false,
  style,
}: {
  label: string;
  children?: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        style,
        disabled && { opacity: 0.42 },
        pressed && { transform: [{ translateY: 2 }] },
      ]}
    >
      {children || <Text style={styles.buttonText}>{label}</Text>}
    </Pressable>
  );
}
export type Tab = "battle" | "upgrades" | "store";
export function BottomNav({
  tab,
  onChange,
  disabled,
}: {
  tab: Tab;
  onChange: (tab: Tab) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.nav}>
      {(
        [
          ["upgrades", "upgrade", "Upgrades"],
          ["battle", "battle", "Battle"],
          ["store", "store", "Store"],
        ] as const
      ).map(([id, icon, label]) => (
        <Pressable
          key={id}
          accessibilityRole="tab"
          accessibilityLabel={label}
          accessibilityState={{ selected: tab === id, disabled }}
          disabled={disabled}
          onPress={() => onChange(id)}
          style={({ pressed }) => [
            styles.tab,
            tab === id && styles.active,
            pressed && styles.tabPressed,
          ]}
        >
          <GameIcon name={icon as IconName} size={32} />
        </Pressable>
      ))}
    </View>
  );
}
export const chrome = StyleSheet.create({
  resultAction: {
    width: 144,
    height: 60,
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  header: {
    height: 60,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  title: { color: colors.cream, fontSize: 22, fontWeight: "900" },
  scrim: {
    flex: 1,
    backgroundColor: "#18263988",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  dialog: {
    width: "100%",
    maxWidth: 370,
    padding: 24,
    gap: 18,
    backgroundColor: colors.bg,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: radii.panel,
    alignItems: "center",
  },
  dialogTitle: { fontSize: 30, fontWeight: "900", color: colors.cream },
  text: {
    fontSize: 14,
    color: colors.cream,
    textAlign: "center",
    lineHeight: 21,
  },
  error: { color: "#ffb4b7", fontSize: 13, textAlign: "center" },
});
const styles = StyleSheet.create({
  resource: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  value: { fontWeight: "900", color: colors.cream },
  button: {
    minHeight: 49,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: colors.border,
    borderRadius: radii.control,
    backgroundColor: "#14b6ed",
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: { backgroundColor: colors.panel },
  buttonText: { color: colors.cream, fontSize: 18, fontWeight: "900" },
  nav: {
    flexDirection: "row",
    height: 64,
    paddingHorizontal: 10,
    gap: 10,
    backgroundColor: colors.bg,
    borderTopWidth: 3,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    marginTop: 5,
    marginBottom: 6,
    borderRadius: 9,
    borderWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.border,
    backgroundColor: "#353d50",
    alignItems: "center",
    justifyContent: "center",
  },
  active: {
    borderColor: "#d5bd6e",
    backgroundColor: "#41485a",
    boxShadow: "0px 0px 6px 1px #ffcf5055",
  },
  tabPressed: { opacity: 0.8 },
});
