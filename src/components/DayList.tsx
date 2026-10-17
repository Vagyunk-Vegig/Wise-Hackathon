import { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { PENALTY_FT } from "../sample";
import { moneyLabel, shortDate, TODAY } from "../dates";
import { colors } from "../theme";
import { useStore } from "../store";
import type { Item } from "../types";
import { icons } from "./Icons";
import { ItemRow, QuietRow, SectionLabel } from "./ui";

export function atRisk(items: Item[], penalty = PENALTY_FT) {
  return items.filter((item) => item.money && item.kind !== "deadline" && !item.done).length * penalty;
}

function openFirst(items: Item[]) {
  return [...items].sort((a, b) => Number(a.done) - Number(b.done));
}

function dayIsClear(items: Item[]) {
  const moneyItems = items.filter((item) => item.money && item.kind !== "deadline");
  return moneyItems.length > 0 && moneyItems.every((item) => item.done);
}

function ClearMark() {
  const scale = useRef(new Animated.Value(1)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!active) return;
      reduceMotion.current = enabled;
      if (enabled) return;
      scale.setValue(0.72);
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();
    });
    return () => {
      active = false;
    };
  }, [scale]);

  const press = () => {
    if (reduceMotion.current) return;
    ring.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
      ]),
      Animated.timing(ring, { toValue: 1, duration: 420, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable onPress={press} accessibilityRole="button" accessibilityLabel="Nothing at risk" style={styles.markHit}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.markRing,
          {
            opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
            transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }],
          },
        ]}
      />
      <Animated.View style={[styles.mark, { transform: [{ scale }] }]}>
        <icons.Check size={34} color={colors.onAccent} strokeWidth={2.8} />
      </Animated.View>
    </Pressable>
  );
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
  const { penaltyFt } = useStore();
  const goals = openFirst(items.filter((item) => item.kind === "goal"));
  const habits = openFirst(items.filter((item) => item.kind === "habit"));
  const deadlines = openFirst(items.filter((item) => item.kind === "deadline"));
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
        {dayIsClear(items) ? <ClearMark /> : <Text style={styles.money}>{moneyLabel(atRisk(items, penaltyFt))}</Text>}
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
            <ItemRow key={item.id} item={item} showCheck={date <= TODAY} onToggle={date <= TODAY && onToggle ? () => onToggle(item.id) : undefined} />
          ))}
        </View>
        <View style={{ gap: 8 }}>
          <SectionLabel title="DEADLINE" />
          {deadlines.length === 0 ? <QuietRow title="Nothing due" /> : deadlines.map((item) => (
            <ItemRow key={item.id} item={item} showCheck={date === TODAY} onToggle={date === TODAY && onToggle ? () => onToggle(item.id) : undefined} />
          ))}
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
  markHit: { marginTop: 18, width: 88, height: 88, alignItems: "center", justifyContent: "center" },
  mark: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  markRing: { position: "absolute", width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: colors.accent },
});
