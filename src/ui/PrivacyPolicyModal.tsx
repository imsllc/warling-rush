import React from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import policy from "../privacyPolicy.json";
import { colors, ui } from "./theme";
import { GameButton } from "./chrome";

export function PrivacyPolicyModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide">
      <SafeAreaView style={ui.screen}>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            Privacy Policy
          </Text>
          <GameButton label="Close" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text selectable style={styles.paragraph}>
            {policy.updated}
          </Text>
          {policy.blocks.map((block, index) => (
            <Text
              key={index}
              selectable
              accessibilityRole={block.type === "h2" ? "header" : undefined}
              style={block.type === "h2" ? styles.section : styles.paragraph}
            >
              {block.type === "li" ? "• " : ""}
              {block.text}
            </Text>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  heading: {
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 24, fontWeight: "900", color: colors.cream },
  content: { padding: 20, paddingBottom: 36 },
  section: {
    color: colors.gold,
    fontSize: 19,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    color: colors.cream,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 12,
  },
});
