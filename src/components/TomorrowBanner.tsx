import { Pressable, StyleSheet, Text, View } from "react-native";
import { shiftDate, TODAY } from "../dates";
import { colors, radius } from "../theme";
import { useStore } from "../store";
import type { Item } from "../types";
import { icons } from "./Icons";

export function tomorrowItemCount(items: Item[]) {
  const tomorrow = shiftDate(TODAY, 1);
  return items.filter((item) => item.kind === "goal" && item.date === tomorrow).length;
}

export function tomorrowQuotaFilled(items: Item[], dailyCount: number) {
  return dailyCount > 0 && tomorrowItemCount(items) >= dailyCount;
}

export function TomorrowBanner({
  onPress,
  pendingDate,
  stayVisible = false,
}: {
  onPress: () => void;
  pendingDate?: string;
  stayVisible?: boolean;
}) {
  const { items, onboardingComplete, dailyCount } = useStore();
  if (!onboardingComplete || dailyCount <= 0) return null;
  const target = dailyCount;
  const tomorrow = shiftDate(TODAY, 1);
  const saved = tomorrowItemCount(items);
  const filled = saved >= target;
  if (filled && !stayVisible) return null;
  const done = Math.min(target, saved + (!filled && pendingDate === tomorrow ? 1 : 0));

  return (
    <Pressable
      onPress={onPress}
      disabled={filled}
      style={[styles.banner, filled && styles.bannerFilled]}
      accessibilityLabel={`Tomorrow ${done}/${target}. Write tomorrow's tasks.`}
    >
      <View style={styles.copy}>
        <Text style={[styles.title, filled && styles.titleFilled]}>{`Tomorrow ${done}/${target}`}</Text>
        <Text style={styles.body}>{filled ? "Tomorrow's tasks are set." : "Write tomorrow's tasks."}</Text>
      </View>
      {filled ? null : <icons.Plus size={20} color={colors.accent} />}
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
  bannerFilled: { borderColor: colors.border, opacity: 0.7 },
  title: { color: colors.accent, fontSize: 15, fontWeight: "700" },
  titleFilled: { color: colors.secondary },
  body: { color: colors.secondary, fontSize: 13 },
});
