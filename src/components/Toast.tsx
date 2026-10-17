import { StyleSheet, Text, View } from "react-native";
import { icons } from "./Icons";
import { colors } from "../theme";
import type { ToastMessage } from "../types";

export function Toast({ toast }: { toast: ToastMessage }) {
  const Icon = toast.icon === "sparkles" ? icons.Sparkles : toast.icon === "heart" ? icons.HandHeart : toast.icon === "alert" ? icons.CircleAlert : icons.CircleCheck;
  const bar = toast.tone === "error" ? colors.streak : colors.accent;
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.card}>
        <View style={[styles.bar, { backgroundColor: bar }]} />
        <Icon size={18} color={bar} />
        <Text style={styles.text}>{toast.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, bottom: 108 },
  card: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    overflow: "hidden",
  },
  bar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  text: { flex: 1, color: colors.text, fontSize: 12, fontWeight: "600" },
});
