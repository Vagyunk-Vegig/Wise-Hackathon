import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { contributionMonthLabels, contributionWeeks, longDate, TODAY } from "../dates";
import { colors } from "../theme";

const CELL = 12;
const GAP = 3;
const LEVELS = ["#1A221E", "#1E4A28", colors.heat2, colors.heat3, colors.heat4];
const WEEKDAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

function levelFor(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

export function ActivityCalendar({ counts }: { counts: Record<string, number> }) {
  const scrollRef = useRef<{ scrollToEnd: (options?: { animated?: boolean }) => void } | null>(null);
  const scrolled = useRef(false);
  const weeks = contributionWeeks(TODAY);
  const labels = contributionMonthLabels(weeks);
  const [selected, setSelected] = useState<string | null>(null);
  const total = weeks.reduce((sum, week) => sum + week.reduce((weekSum, day) => weekSum + (day > TODAY ? 0 : counts[day] ?? 0), 0), 0);
  const selectedCount = selected && selected <= TODAY ? counts[selected] ?? 0 : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.total}>{total} completed in the last year</Text>
      <View style={styles.graph}>
        <View style={styles.weekdays}>
          <View style={styles.monthGap} />
          {WEEKDAYS.map((label, index) => (
            <Text key={index} style={styles.weekday}>{label}</Text>
          ))}
        </View>
        <ScrollView
          ref={(node) => {
            scrollRef.current = node;
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={() => {
            if (scrolled.current) return;
            scrolled.current = true;
            scrollRef.current?.scrollToEnd({ animated: false });
          }}
        >
          <View>
            <View style={styles.months}>
              {labels.map((label, index) => (
                <View key={index} style={styles.monthSlot}>
                  {label ? <Text style={styles.month}>{label}</Text> : null}
                </View>
              ))}
            </View>
            <View style={styles.columns}>
              {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.column}>
                  {week.map((day) => {
                    const count = day > TODAY ? 0 : counts[day] ?? 0;
                    const chosen = selected === day;
                    return (
                      <Pressable
                        key={day}
                        accessibilityRole="button"
                        accessibilityLabel={`${count} completed on ${longDate(day)}`}
                        onPress={() => setSelected(day)}
                        style={[styles.cell, { backgroundColor: LEVELS[levelFor(count)] }, chosen && styles.cellOn]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
      <View style={styles.footer}>
        <Text style={styles.caption}>{selected ? `${selectedCount} completed on ${longDate(selected)}` : "Tap a day"}</Text>
        <View style={styles.legend}>
          <Text style={styles.legendText}>Less</Text>
          {LEVELS.map((color) => (
            <View key={color} style={[styles.cell, { backgroundColor: color }]} />
          ))}
          <Text style={styles.legendText}>More</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, gap: 10 },
  total: { color: colors.secondary, fontSize: 12, fontWeight: "700" },
  graph: { flexDirection: "row", gap: 6 },
  weekdays: { width: 28, gap: GAP },
  monthGap: { height: 14 },
  weekday: { height: CELL, color: colors.muted, fontSize: 9, lineHeight: CELL },
  months: { height: 14, flexDirection: "row", gap: GAP },
  monthSlot: { width: CELL, overflow: "visible" },
  month: { position: "absolute", width: 32, color: colors.muted, fontSize: 9 },
  columns: { flexDirection: "row", gap: GAP },
  column: { gap: GAP },
  cell: { width: CELL, height: CELL, borderRadius: 2 },
  cellOn: { borderWidth: 1, borderColor: colors.text },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  caption: { flex: 1, color: colors.secondary, fontSize: 11 },
  legend: { flexDirection: "row", alignItems: "center", gap: 3 },
  legendText: { color: colors.muted, fontSize: 10 },
});
