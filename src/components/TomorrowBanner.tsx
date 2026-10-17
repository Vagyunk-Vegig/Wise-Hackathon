import { Pressable, StyleSheet, Text, View } from "react-native";
import { shiftDate, TODAY } from "../dates";
import { colors, radius } from "../theme";
import { useStore } from "../store";
import type { Item } from "../types";
import { icons } from "./Icons";

export function tomorrowItemCount(items: Item[]) {
  const tomorrow = shiftDate(TODAY, 1);
  return items.filter((item) => item.date === tomorrow).length;
}

export function TomorrowBanner({ onPress, pendingDate }: { onPress: () => void; pendingDate?: string }) {
  const { items, onboardingComplete, dailyCount } = useStore();
  if (!onboardingComplete || dailyCount <= 0) return null;
  const target = dailyCount;
  const tomorrow = shiftDate(TODAY, 1);
  const saved = tomorrowItemCount(items);
  if (saved >= target) return null;
  const done = Math.min(target, saved + (pendingDate === tomorrow ? 1 : 0));

  return (
    <Pressable onPress={onPress} style={styles.banner} accessibilityLabel={`Tomorrow ${done}/${target}. Write tomorrow's tasks.`}>
      <View style={styles.copy}>
        <Text style={styles.title}>{`Tomorrow ${done}/${target}`}</Text>
        <Text style={styles.body}>Write tomorrow's tasks.</Text>
      </View>
      <icons.Plus size={20} color={colors.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  copy: { flex: 1, gap: 2 },
  title: { color: colors.accent, fontSize: 15, fontWeight: "700" },
  body: { color: colors.secondary, fontSize: 13 },
});
