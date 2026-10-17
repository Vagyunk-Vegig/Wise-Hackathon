import { StyleSheet, Text, View } from "react-native";
import { PENALTY_EUR } from "../sample";
import { moneyLabel, shortDate, TODAY } from "../dates";
import { colors } from "../theme";
import type { Item } from "../types";
import { ItemRow, QuietRow, SectionLabel } from "./ui";

export function atRisk(items: Item[]) {
  return items.filter((item) => item.money && !item.done).length * PENALTY_EUR;
}

export function DayList({
  date,
  items,
  onToggle,
  empty,
}: {
  date: string;
  items: Item[];
  onToggle?: (id: string) => void;
  empty?: React.ReactNode;
}) {
  const goals = items.filter((item) => item.kind === "goal");
  const habits = items.filter((item) => item.kind === "habit");
  const deadlines = items.filter((item) => item.kind === "deadline");
  const doneGoals = goals.filter((item) => item.done).length;
  const label = date === TODAY ? `Today · ${shortDate(date)}` : shortDate(date);

  if (items.length === 0 && empty) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.hero}>
          <Text style={styles.date}>{label}</Text>
          <Text style={styles.money}>{moneyLabel(0)}</Text>
        </View>
        {empty}
      </View>
    );
  }

  return (
    <View style={styles.list}>
      <View style={styles.hero}>
        <Text style={styles.date}>{label}</Text>
        <Text style={styles.money}>{moneyLabel(atRisk(items))}</Text>
      </View>
      <View style={{ gap: 16 }}>
        <View style={{ gap: 8 }}>
          <SectionLabel title={date === TODAY ? "TODAY'S GOALS" : "GOALS"} count={`${doneGoals}/${goals.length}`} />
          {goals.map((item) => (
            <ItemRow key={item.id} item={item} showCheck onToggle={onToggle ? () => onToggle(item.id) : undefined} />
          ))}
        </View>
        <View style={{ gap: 8 }}>
          <SectionLabel title="HABITS" />
          {habits.map((item) => (
            <ItemRow key={item.id} item={item} showCheck onToggle={onToggle ? () => onToggle(item.id) : undefined} />
          ))}
        </View>
        <View style={{ gap: 8 }}>
          <SectionLabel title="DEADLINE" />
          {deadlines.length === 0 ? <QuietRow title="Nothing due" /> : deadlines.map((item) => <ItemRow key={item.id} item={item} />)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 16 },
  hero: { alignItems: "center", paddingTop: 16, paddingBottom: 30 },
  date: { color: colors.muted, fontSize: 12, fontWeight: "600", textAlign: "center" },
  money: { color: colors.text, fontSize: 48, fontWeight: "700", letterSpacing: -1, marginTop: 26, textAlign: "center" },
});
