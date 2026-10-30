import { StyleSheet } from "react-native";
export const radii = { control: 6, panel: 8 };
export const colors = {
  bg: "#41495d",
  panel: "#667795",
  border: "#19212b",
  cream: "#fff9eb",
  muted: "#c9d3df",
  gold: "#ffcf50",
  teal: "#6ac5aa",
  coral: "#ec947b",
};
export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: {
    color: colors.cream,
    fontWeight: "900",
    fontSize: 32,
    letterSpacing: -1,
  },
  body: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  label: {
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "800",
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: radii.control,
    paddingVertical: 13,
    paddingHorizontal: 23,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  secondary: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: { color: colors.bg, fontSize: 14, fontWeight: "900" },
  lightText: { color: colors.cream },
  disabled: { opacity: 0.42 },
  card: {
    padding: 17,
    borderRadius: radii.panel,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.panel,
  },
});
