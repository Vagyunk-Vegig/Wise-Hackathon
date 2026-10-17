import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { categoryMeta, icons, profileIcons, type ProfileIconName } from "./Icons";
import { colors, radius } from "../theme";
import type { Item } from "../types";
import { dueChip } from "../dates";
import { XP_PER_LEVEL } from "../sample";
import { useStore } from "../store";

export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.screen, { paddingTop: insets.top }]}>{children}</View>;
}

export function IconButton({ onPress, children }: { onPress?: () => void; children: ReactNode }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.iconHit}>
      <View style={styles.iconButton}>{children}</View>
    </Pressable>
  );
}

export function AvatarMark({ icon, initials, size, textColor, background }: { icon: string | null; initials: string; size: number; textColor: string; background: string }) {
  const Icon = icon && icon in profileIcons ? profileIcons[icon as ProfileIconName] : null;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: background, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {Icon ? <Icon size={Math.round(size * 0.46)} color={textColor} /> : <Text style={{ color: textColor, fontSize: Math.round(size * 0.32), fontWeight: "800" }}>{initials}</Text>}
    </View>
  );
}

export function TopBar({
  progress,
  streak,
  onAvatar,
  onSettings,
}: {
  progress?: number;
  streak: number;
  onAvatar: () => void;
  onSettings: () => void;
}) {
  const { currentUser, totalXp } = useStore();
  const initials = currentUser?.initials ?? "··";
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onAvatar} style={styles.avatarWrap}>
        <AvatarMark icon={currentUser?.icon ?? null} initials={initials} size={40} textColor={colors.onAccent} background={colors.accent} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{level}</Text>
        </View>
      </Pressable>
      {progress == null ? <View style={{ flex: 1 }} /> : (
        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      )}
      <View style={styles.streak}>
        <icons.Flame size={16} color={colors.streak} fill={colors.streak} />
        <Text style={styles.streakText}>{streak}</Text>
      </View>
      <IconButton onPress={onSettings}>
        <icons.Settings size={18} color={colors.text} />
      </IconButton>
    </View>
  );
}

export function SectionLabel({ title, count }: { title: string; count?: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count ? <Text style={styles.sectionCount}>{count}</Text> : null}
    </View>
  );
}

export function ItemRow({ item, onToggle, showCheck = false }: { item: Item; onToggle?: () => void; showCheck?: boolean }) {
  const meta = categoryMeta[item.category];
  const goal = item.kind === "goal";
  const deadline = item.kind === "deadline";
  const dim = item.done && !goal;
  const contentDim = item.done;
  return (
    <View style={[styles.row, dim && { opacity: 0.48 }]}>
      {goal ? <View style={[styles.stripe, { backgroundColor: item.done ? colors.accent : colors.goalOpen }]} /> : null}
      {!deadline || item.category ? (
        <View style={[styles.tile, { backgroundColor: `${meta.color}17` }, goal && contentDim && { opacity: 0.48 }]}>
          <meta.Icon size={17} color={meta.color} />
        </View>
      ) : null}
      <Text style={[styles.rowTitle, goal && contentDim && { opacity: 0.48 }]} numberOfLines={1}>
        {item.title}
      </Text>
      {item.xp > 0 ? <Text style={[styles.xp, goal && contentDim && { opacity: 0.48 }]}>+{item.xp} XP</Text> : null}
      {item.money && !deadline ? (
        <View style={[styles.euro, goal && contentDim && { opacity: 0.48 }]}>
          <Text style={styles.euroText}>Ft</Text>
        </View>
      ) : null}
      {deadline && !item.done ? (
        <View style={[styles.chip, dueChip(item.date) === "Due today" ? styles.chipHot : dueChip(item.date) === "Overdue" ? styles.chipBad : styles.chipSoon]}>
          <Text style={[styles.chipText, dueChip(item.date) === "Due today" ? { color: colors.due } : dueChip(item.date) === "Overdue" ? { color: "#FF8ABF" } : { color: colors.accent }]}>
            {dueChip(item.date)}
          </Text>
        </View>
      ) : null}
      {showCheck ? (
        <Pressable onPress={onToggle} disabled={item.done} hitSlop={8} accessibilityRole="checkbox" accessibilityState={{ checked: item.done }} accessibilityLabel={item.title}>
          <View style={[styles.check, item.done && styles.checkOn]}>
            {item.done ? <icons.Check size={14} color={colors.onAccent} strokeWidth={3} /> : null}
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

export function QuietRow({ title }: { title: string }) {
  return (
    <View style={[styles.row, styles.quiet]}>
      <Text style={styles.quietText}>{title}</Text>
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled }: { label: string; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} style={[styles.primary, disabled && { opacity: 0.7 }]}>
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.secondary}>
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

export function PageHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <View style={styles.pageHeader}>
      <IconButton onPress={onBack}>
        <icons.ChevronLeft size={18} color={colors.text} />
      </IconButton>
      <Text style={[styles.pageTitle, right ? styles.pageTitleCenter : null]}>{title}</Text>
      {right ?? <View style={{ width: 44 }} />}
    </View>
  );
}

export function tabBarStyle(bottom: number): ViewStyle {
  return { paddingBottom: Math.max(bottom, 10), backgroundColor: colors.tab, borderTopWidth: 1, borderTopColor: colors.border };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  iconHit: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: { height: 48, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  avatarWrap: { width: 44, height: 44 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.onAccent, fontSize: 13, fontWeight: "800" },
  badge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  badgeText: { color: colors.onAccent, fontSize: 8, fontWeight: "800" },
  track: { flex: 1, height: 8, borderRadius: 99, backgroundColor: colors.track, overflow: "hidden" },
  trackFill: { height: 8, backgroundColor: colors.accent, borderRadius: 99 },
  streak: { flexDirection: "row", alignItems: "center", gap: 4 },
  streakText: { color: colors.streak, fontSize: 15, fontWeight: "800" },
  section: { height: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: colors.secondary, fontSize: 10, fontWeight: "700", letterSpacing: 1.1 },
  sectionCount: { color: colors.text, fontSize: 13, fontWeight: "700" },
  row: {
    minHeight: 52,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    overflow: "hidden",
  },
  stripe: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  tile: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowTitle: { flex: 1, color: colors.text, fontSize: 13, fontWeight: "600" },
  xp: { color: colors.accent, fontSize: 11, fontWeight: "700" },
  euro: { width: 22, height: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.euro, alignItems: "center", justifyContent: "center" },
  euroText: { color: colors.muted, fontSize: 8, fontWeight: "700" },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.euro },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent, alignItems: "center", justifyContent: "center" },
  chip: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 5 },
  chipHot: { backgroundColor: "rgba(255,107,107,0.09)" },
  chipSoon: { backgroundColor: "rgba(182,255,112,0.12)" },
  chipBad: { backgroundColor: "rgba(255,138,191,0.14)" },
  chipText: { fontSize: 11, fontWeight: "700" },
  quiet: { paddingHorizontal: 14 },
  quietText: { color: colors.secondary, fontSize: 13, fontWeight: "500" },
  primary: { height: 46, borderRadius: radius.card, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  primaryText: { color: colors.onAccent, fontSize: 15, fontWeight: "700" },
  secondary: { height: 46, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.text, fontSize: 15, fontWeight: "700" },
  pageHeader: { height: 48, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8 },
  pageTitle: { flex: 1, color: colors.text, fontSize: 24, fontWeight: "700" },
  pageTitleCenter: { textAlign: "center", fontSize: 16 },
});
