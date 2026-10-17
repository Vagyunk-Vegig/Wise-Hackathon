import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  AlarmClock,
  BadgeCheck,
  Blocks,
  CalendarCheck,
  Check,
  CheckCheck,
  CircleCheck,
  CircleDashed,
  Coffee,
  Compass,
  Crown,
  Flame,
  Infinity as InfinityIcon,
  Layers,
  Leaf,
  ListChecks,
  LockKeyhole,
  Medal,
  Mountain,
  Repeat2,
  Shield,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Sunrise,
  TreeDeciduous,
  Trees,
  Trophy,
  type LucideIcon,
} from "lucide-react-native";
import { badgeCategories, badgeCollection, badgeStats, type BadgeCard, type BadgeIcon, type BadgeStats } from "../badges";
import { icons } from "./Icons";
import { XP_PER_LEVEL } from "../sample";
import { colors } from "../theme";
import type { Item } from "../types";

const motif: Record<BadgeIcon, LucideIcon> = {
  star: Star,
  flame: Flame,
  crown: Crown,
  sprout: Sprout,
  leaf: Leaf,
  tree: TreeDeciduous,
  trees: Trees,
  mountain: Mountain,
  check: Check,
  checks: CheckCheck,
  list: ListChecks,
  badge: BadgeCheck,
  trophy: Trophy,
  sunrise: Sunrise,
  sun: Sun,
  alarm: AlarmClock,
  coffee: Coffee,
  calendar: CalendarCheck,
  sparkles: Sparkles,
  medal: Medal,
  blocks: Blocks,
  compass: Compass,
  layers: Layers,
  repeat: Repeat2,
  infinity: InfinityIcon,
};

function Emblem({ icon, tier, color, locked }: { icon: BadgeIcon; tier: number; color: string; locked: boolean }) {
  const Icon = motif[icon];
  const ink = locked ? colors.placeholder : color;
  return (
    <View style={styles.emblem}>
      <View style={styles.shield}>
        <Shield size={58} color={ink} strokeWidth={1.4} />
        <View style={styles.motif}>
          <Icon size={20} color={ink} />
        </View>
      </View>
      <View style={styles.pips}>
        {Array.from({ length: tier }, (_, index) => (
          <View key={index} style={[styles.pip, { backgroundColor: ink }]} />
        ))}
      </View>
    </View>
  );
}

export function BadgeCollection({
  name,
  xp,
  streak,
  completed,
  streaks,
  badges,
  items,
}: {
  name: string;
  xp: number;
  streak: number;
  completed: number;
  streaks: unknown;
  badges: string[];
  items: Item[] | null;
}) {
  const [filter, setFilter] = useState<"all" | "earned" | "progress">("all");
  const stats: BadgeStats = badgeStats({ xp, streak, streaks, badges, completed, items });
  const collection = badgeCollection(stats, filter);
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const into = xp % XP_PER_LEVEL;
  const percent = collection.total === 0 ? 0 : Math.round((collection.earned / collection.total) * 100);
  const filters = [
    { id: "all" as const, label: "All", count: collection.total },
    { id: "earned" as const, label: "Earned", count: collection.earned },
    { id: "progress" as const, label: "In progress", count: collection.progressCount },
  ];
  return (
    <View style={styles.wrap}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>{name.toUpperCase()}'S COLLECTION</Text>
        <Text style={styles.headline}>Every step earns a story.</Text>
        <Text style={styles.lead}>Build your habits. Collect your milestones.</Text>
      </View>
      <View style={styles.summary}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.count}>
              {collection.earned} <Text style={styles.countOf}>/ {collection.total}</Text>
            </Text>
            <Text style={styles.meta}>badges earned</Text>
          </View>
          <View style={styles.percent}>
            <Text style={styles.percentText}>{percent}% collected</Text>
          </View>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.level}>Level {level}</Text>
          <Text style={styles.meta}>{into}/{XP_PER_LEVEL} XP</Text>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.inline}>
            <icons.Flame size={13} color={colors.streak} fill={colors.streak} />
            <Text style={styles.meta}>{streak} day streak</Text>
          </View>
          <View style={styles.inline}>
            <icons.CircleCheck size={13} color={colors.accent} />
            <Text style={styles.meta}>{completed} completed</Text>
          </View>
        </View>
      </View>
      {collection.next ? (
        <View style={styles.next}>
          <View style={styles.nextTop}>
            <Emblem icon={collection.next.icon} tier={collection.next.tier} color={collection.next.color} locked={false} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.nextEyebrow, { color: collection.next.color }]}>UP NEXT · {collection.next.category.toUpperCase()}</Text>
              <Text style={styles.nextName}>{collection.next.name}</Text>
              <Text style={styles.lead}>{collection.next.detail}</Text>
            </View>
          </View>
          <View style={styles.nextBar}>
            <Text style={styles.level}>{collection.next.label}</Text>
            <Text style={[styles.meta, { color: collection.next.color }]}>{Math.round(collection.next.progress * 100)}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(collection.next.progress * 100)}%`, backgroundColor: collection.next.color }]} />
          </View>
        </View>
      ) : null}
      <View style={styles.filters}>
        {filters.map((entry) => {
          const on = filter === entry.id;
          return (
            <Pressable key={entry.id} accessibilityRole="button" accessibilityLabel={entry.label} onPress={() => setFilter(entry.id)} style={[styles.filter, on && styles.filterOn]}>
              <Text style={[styles.filterText, on && { color: colors.accent }]}>{entry.label}</Text>
              <Text style={[styles.filterCount, on && { color: colors.accent }]}>{entry.count}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.org}>
        <Text style={styles.meta}>{badgeCategories.length} categories · {collection.locked} locked</Text>
        <Text style={styles.by}>By category</Text>
      </View>
      {collection.groups.map((group) => (
        <View key={group.id} style={styles.group}>
          <View style={styles.groupHead}>
            <View style={styles.inline}>
              {groupIcon(group.icon, group.color)}
              <Text style={styles.groupTitle}>{group.title}</Text>
            </View>
            <Text style={[styles.groupCount, { color: group.color }]}>{group.earned} / {group.total} earned</Text>
          </View>
          <Text style={styles.groupBody}>{group.description}</Text>
          <View style={styles.grid}>
            {pairs(group.cards).map((row, rowIndex) => (
              <View key={row.map((card) => card.id).join()} style={styles.row}>
                {row.map((card, column) => (
                  <BadgeTile key={card.id} card={card} index={rowIndex * 2 + column} />
                ))}
                {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function BadgeTile({ card, index }: { card: BadgeCard; index: number }) {
  const [over, setOver] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = over || pinned;
  const overRef = useRef(false);
  const reduceMotion = useRef(false);
  const enter = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(8)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const emblem = useRef(new Animated.Value(card.status === "earned" ? 0.86 : 1)).current;
  const rewardOpacity = useRef(new Animated.Value(0)).current;
  const rewardScale = useRef(new Animated.Value(0.94)).current;
  const reward = card.rewardXp > 0 ? `+${card.rewardXp} XP` : "No bonus XP";

  useEffect(() => {
    let active = true;
    const settle = () => {
      enter.setValue(1);
      rise.setValue(0);
      emblem.setValue(1);
    };
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!active) return;
        reduceMotion.current = enabled;
        if (enabled) {
          settle();
          return;
        }
        const delay = index * 45;
        Animated.parallel([
          Animated.timing(enter, { toValue: 1, duration: 280, delay, useNativeDriver: true }),
          Animated.spring(rise, { toValue: 0, delay, friction: 8, tension: 80, useNativeDriver: true }),
          Animated.spring(emblem, { toValue: 1, delay, friction: 6, tension: 90, useNativeDriver: true }),
        ]).start();
      })
      .catch(() => {
        if (active) settle();
      });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
      reduceMotion.current = enabled;
      if (enabled) settle();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [emblem, enter, index, rise]);

  useEffect(() => {
    if (reduceMotion.current) {
      rewardOpacity.setValue(open ? 1 : 0);
      rewardScale.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.timing(rewardOpacity, { toValue: open ? 1 : 0, duration: open ? 160 : 120, useNativeDriver: true }),
      Animated.spring(rewardScale, { toValue: open ? 1 : 0.94, friction: 7, tension: 140, useNativeDriver: true }),
    ]).start();
  }, [open, rewardOpacity, rewardScale]);

  const lift = (up: boolean) => {
    if (reduceMotion.current) return;
    Animated.spring(scale, { toValue: up ? 1.03 : 1, friction: 7, tension: 160, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.tile, { opacity: enter, transform: [{ translateY: rise }, { scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${card.name}. ${reward}`}
        onHoverIn={() => {
          overRef.current = true;
          setOver(true);
          lift(true);
        }}
        onHoverOut={() => {
          overRef.current = false;
          setOver(false);
          lift(false);
        }}
        onPressIn={() => {
          if (!overRef.current) lift(true);
        }}
        onPressOut={() => {
          if (!overRef.current) lift(false);
        }}
        onPress={() => setPinned((value) => !value)}
        style={[styles.card, card.status === "progress" && { borderColor: card.color }, Platform.OS === "web" ? styles.cardWeb : null]}
      >
        <View style={styles.identity}>
          <Animated.View style={{ transform: [{ scale: emblem }] }}>
            <Emblem icon={card.icon} tier={card.tier} color={card.color} locked={card.status === "locked"} />
          </Animated.View>
          <Text style={[styles.cardName, card.status === "locked" && { color: colors.secondary }]}>{card.name}</Text>
          <Text style={styles.cardBody}>{card.description}</Text>
        </View>
        <View style={styles.state}>
          <View style={styles.inline}>
            {card.status === "earned" ? <CircleCheck size={11} color={card.color} /> : card.status === "progress" ? <CircleDashed size={11} color={card.color} /> : <LockKeyhole size={11} color={colors.placeholder} />}
            <Text style={[styles.stateText, { color: card.status === "locked" ? colors.placeholder : card.color }]}>
              {card.status === "earned" ? "Earned" : card.status === "progress" ? "In progress" : "Locked"}
            </Text>
          </View>
          <Text style={styles.detail}>{card.detail}</Text>
          {card.status === "progress" ? (
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(card.progress * 100)}%`, backgroundColor: card.color }]} />
            </View>
          ) : null}
        </View>
        <Animated.View pointerEvents="none" style={[styles.reward, { opacity: rewardOpacity, transform: [{ scale: rewardScale }] }]}>
          <Text style={[styles.rewardText, { color: card.color }]}>{reward}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function groupIcon(icon: BadgeIcon, color: string) {
  const Icon = motif[icon];
  return <Icon size={18} color={color} />;
}

function pairs<T>(list: T[]) {
  const rows: T[][] = [];
  for (let index = 0; index < list.length; index += 2) rows.push(list.slice(index, index + 2));
  return rows;
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  intro: { gap: 6 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: "700" },
  headline: { color: colors.text, fontSize: 26, fontWeight: "700" },
  lead: { color: colors.secondary, fontSize: 12, lineHeight: 18 },
  summary: { borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 14 },
  summaryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  count: { color: colors.text, fontSize: 30, fontWeight: "700" },
  countOf: { color: colors.secondary, fontSize: 16, fontWeight: "500" },
  meta: { color: colors.secondary, fontSize: 11 },
  percent: { borderRadius: 999, backgroundColor: colors.elevated, paddingHorizontal: 10, paddingVertical: 6 },
  percentText: { color: colors.accent, fontSize: 12, fontWeight: "700" },
  track: { height: 4, borderRadius: 999, backgroundColor: colors.pillTrack, overflow: "hidden" },
  fill: { height: 4, borderRadius: 999, backgroundColor: colors.accent },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  inline: { flexDirection: "row", alignItems: "center", gap: 5 },
  level: { color: colors.text, fontSize: 11, fontWeight: "600" },
  next: { borderRadius: 14, backgroundColor: colors.elevated, borderWidth: 1, borderColor: "#FFFFFF", padding: 16, gap: 12 },
  nextTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  nextEyebrow: { fontSize: 9, fontWeight: "700" },
  nextName: { color: colors.text, fontSize: 17, fontWeight: "700" },
  nextBar: { width: "100%", flexDirection: "row", justifyContent: "space-between" },
  filters: { flexDirection: "row", gap: 4, backgroundColor: colors.surface, borderRadius: 12, padding: 4 },
  filter: { flex: 1, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 5 },
  filterOn: { backgroundColor: colors.elevated },
  filterText: { color: colors.secondary, fontSize: 11, fontWeight: "600" },
  filterCount: { color: colors.muted, fontSize: 10 },
  org: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  by: { color: colors.accent, fontSize: 11 },
  group: { gap: 10 },
  groupHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  groupTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  groupCount: { fontSize: 11, fontWeight: "600" },
  groupBody: { color: colors.secondary, fontSize: 11, lineHeight: 16 },
  grid: { gap: 10 },
  row: { flexDirection: "row", gap: 10 },
  tile: { flex: 1 },
  card: { flex: 1, minHeight: 220, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 12, justifyContent: "space-between", gap: 8, overflow: "hidden" },
  cardWeb: { cursor: "pointer" },
  reward: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(8, 13, 11, 0.88)", alignItems: "center", justifyContent: "center" },
  rewardText: { fontSize: 20, fontWeight: "700" },
  identity: { alignItems: "center", gap: 6 },
  cardName: { color: colors.text, fontSize: 12, fontWeight: "700", textAlign: "center" },
  cardBody: { color: colors.secondary, fontSize: 10, lineHeight: 14, textAlign: "center" },
  state: { gap: 6, alignItems: "center" },
  stateText: { fontSize: 10, fontWeight: "600" },
  detail: { color: colors.muted, fontSize: 9, lineHeight: 12, textAlign: "center" },
  emblem: { width: 72, height: 76, alignItems: "center" },
  shield: { width: 64, height: 58, alignItems: "center", justifyContent: "center" },
  motif: { position: "absolute", top: 16 },
  pips: { flexDirection: "row", gap: 3, marginTop: 4 },
  pip: { width: 5, height: 3, borderRadius: 1 },
});
