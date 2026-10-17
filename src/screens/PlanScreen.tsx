import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { icons } from "../components/Icons";
import { IconButton, ItemRow, Screen, SecondaryButton, SectionLabel, TopBar } from "../components/ui";
import { isoDate, monthGrid, shortDate, TODAY } from "../dates";
import { hasDatedItemOn, hasHabitOn, itemsForDate } from "../schedule";
import { colors } from "../theme";
import { useStore } from "../store";
import { useRootNav, type PlanStackParamList } from "../routes";

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];

export function PlanScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PlanStackParamList>>();
  const root = useRootNav();
  const { items, streak, totalXp } = useStore();
  const [mode, setMode] = useState<"calendar" | "list">("list");
  const [cursor, setCursor] = useState({ year: 2026, month: 10 });
  const [selected, setSelected] = useState("2026-10-20");
  const progress = (totalXp % 500) / 500;
  const planned = items.filter((item) => item.date > TODAY && item.kind !== "habit");
  const upcoming = [...new Set(planned.map((item) => item.date))].sort();
  const openCreate = (date?: string) => root?.navigate("Create", { date });

  return (
    <Screen>
      <TopBar progress={progress} streak={streak} onAvatar={() => root?.navigate("Profile")} onSettings={() => root?.navigate("Settings")} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.segment}>
          {(["calendar", "list"] as const).map((key) => (
            <Pressable key={key} onPress={() => setMode(key)} style={[styles.segmentItem, mode === key && styles.segmentOn]}>
              <Text style={[styles.segmentText, mode === key && styles.segmentTextOn]}>{key === "calendar" ? "Calendar" : "List"}</Text>
            </Pressable>
          ))}
        </View>
        {mode === "list" ? (
          upcoming.length === 0 ? (
            <View style={styles.emptyCard}>
              <icons.CalendarDays size={24} color={colors.accent} />
              <Text style={styles.emptyTitle}>Your week is clear.</Text>
              <Text style={styles.emptyBody}>Make room for a small daily win.</Text>
              <SecondaryButton label="Create" onPress={() => openCreate()} />
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <SectionLabel title="UPCOMING TASKS" />
              {upcoming.map((date) => {
                const group = planned.filter((item) => item.date === date);
                return (
                  <View key={date} style={{ gap: 8 }}>
                    <Pressable onPress={() => navigation.navigate("Day", { date })} style={styles.dayHead}>
                      <Text style={styles.dayTitle}>{shortDate(date)}</Text>
                      <Text style={styles.dayCount}>{group.length}</Text>
                      <icons.ChevronRight size={14} color={colors.secondary} />
                    </Pressable>
                    {group.map((item) => (
                      <ItemRow key={item.id} item={item} />
                    ))}
                  </View>
                );
              })}
            </View>
          )
        ) : (
          <Calendar cursor={cursor} selected={selected} onSelect={setSelected} onShift={(delta) => setCursor((current) => shiftMonth(current, delta))} onCreate={() => openCreate(selected)} items={items} />
        )}
      </ScrollView>
    </Screen>
  );
}

function shiftMonth(current: { year: number; month: number }, delta: number) {
  const date = new Date(Date.UTC(current.year, current.month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function Calendar({
  cursor,
  selected,
  onSelect,
  onShift,
  onCreate,
  items,
}: {
  cursor: { year: number; month: number };
  selected: string;
  onSelect: (iso: string) => void;
  onShift: (delta: number) => void;
  onCreate: () => void;
  items: ReturnType<typeof useStore>["items"];
}) {
  const cells = monthGrid(cursor.year, cursor.month);
  const monthName = new Date(Date.UTC(cursor.year, cursor.month - 1, 1)).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const dayItems = itemsForDate(items, selected);

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.month}>
        <IconButton onPress={() => onShift(-1)}>
          <icons.ChevronLeft size={18} color={colors.text} />
        </IconButton>
        <Text style={styles.monthTitle}>{monthName}</Text>
        <IconButton onPress={() => onShift(1)}>
          <icons.ChevronRight size={18} color={colors.text} />
        </IconButton>
      </View>
      <View style={styles.week}>
        {WEEK.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.weekText}>{label}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (!day) return <View key={`empty-${index}`} style={styles.cell} />;
          const iso = isoDate(cursor.year, cursor.month, day);
          const isToday = iso === TODAY;
          const isSelected = iso === selected;
          const habit = hasHabitOn(items, iso);
          const task = hasDatedItemOn(items, iso);
          return (
            <Pressable key={iso} onPress={() => onSelect(iso)} style={[styles.cell, isSelected && styles.cellSelected, isToday && !isSelected && styles.cellToday]}>
              <Text style={[styles.cellText, isSelected && { color: colors.onAccent }]}>{day}</Text>
              <View style={styles.dots}>
                {habit ? <View style={[styles.dot, { backgroundColor: isSelected ? colors.onAccent : colors.accent }]} /> : null}
                {task ? <View style={[styles.dot, { backgroundColor: isSelected ? colors.onAccent : colors.streak }]} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>{shortDate(selected)} · {dayItems.length}</Text>
        {dayItems.length === 0 ? (
          <View style={{ alignItems: "center", gap: 12, paddingVertical: 8 }}>
            <icons.CalendarPlus size={24} color={colors.accent} />
            <Text style={styles.emptyTitle}>Nothing planned for this day.</Text>
          </View>
        ) : (
          dayItems.map((item) => <ItemRow key={item.id} item={item} />)
        )}
        <SecondaryButton label="+ Add task" onPress={onCreate} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingTop: 24, gap: 24, paddingBottom: 32 },
  segment: { height: 44, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: "row", padding: 4 },
  segmentItem: { flex: 1, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  segmentOn: { backgroundColor: colors.accent },
  segmentText: { color: colors.secondary, fontSize: 13, fontWeight: "700" },
  segmentTextOn: { color: colors.onAccent },
  dayHead: { height: 44, flexDirection: "row", alignItems: "center", gap: 8 },
  dayTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: "700" },
  dayCount: { color: colors.secondary, fontSize: 13, fontWeight: "700" },
  month: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  week: { flexDirection: "row" },
  weekText: { flex: 1, textAlign: "center", color: colors.placeholder, fontSize: 10, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 4 },
  cell: { width: `${100 / 7}%`, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  cellToday: { borderWidth: 1.5, borderColor: colors.accent },
  cellSelected: { backgroundColor: colors.accent },
  cellText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  dots: { flexDirection: "row", gap: 2, height: 5, marginTop: 1 },
  dot: { width: 3, height: 3, borderRadius: 2 },
  sheet: { marginTop: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 10, gap: 8 },
  sheetTitle: { color: colors.text, fontSize: 13, fontWeight: "700", marginBottom: 2 },
  emptyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 20, alignItems: "center", gap: 12 },
  emptyTitle: { color: colors.text, fontSize: 14, fontWeight: "700", textAlign: "center" },
  emptyBody: { color: colors.secondary, fontSize: 11, lineHeight: 18, textAlign: "center" },
});
