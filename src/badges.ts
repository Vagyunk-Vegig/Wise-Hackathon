import { TODAY, shiftDate } from "./dates";
import { readStreak } from "./db";
import { itemsForDate } from "./schedule";
import { levelProgress } from "./sample";
import { colors } from "./theme";
import type { Item } from "./types";

export type BadgeCategoryId = "streak" | "task" | "level" | "morning" | "perfect" | "habit";
export type BadgeMetric = "streak" | "longest" | "level" | "completed" | "mornings" | "perfect" | "habits" | "habitChecks";
export type BadgeIcon =
  | "star"
  | "flame"
  | "crown"
  | "sprout"
  | "leaf"
  | "tree"
  | "trees"
  | "mountain"
  | "check"
  | "checks"
  | "list"
  | "badge"
  | "trophy"
  | "sunrise"
  | "sun"
  | "alarm"
  | "coffee"
  | "calendar"
  | "sparkles"
  | "medal"
  | "blocks"
  | "compass"
  | "layers"
  | "repeat"
  | "infinity";

export type BadgeDef = {
  id: string;
  category: BadgeCategoryId;
  name: string;
  description: string;
  rewardXp: number;
  tier: number;
  icon: BadgeIcon;
  metric: BadgeMetric;
  threshold: number;
  unit: string;
  requires?: string;
};

export const PERFECT_GOLD = "#DBCB8D";

export const badgeCategories: { id: BadgeCategoryId; title: string; color: string; icon: BadgeIcon }[] = [
  { id: "streak", title: "Streaks", color: colors.streak, icon: "flame" },
  { id: "task", title: "Task milestones", color: colors.achievement, icon: "check" },
  { id: "level", title: "Level journey", color: colors.hygiene, icon: "sprout" },
  { id: "morning", title: "Morning rituals", color: colors.study, icon: "sunrise" },
  { id: "perfect", title: "Perfect days", color: PERFECT_GOLD, icon: "calendar" },
  { id: "habit", title: "Habit building", color: colors.personal, icon: "repeat" },
];

export const badges: BadgeDef[] = [
  { id: "streak-7", category: "streak", name: "7 Day Streak", description: "Stay active for 7 days in a row.", rewardXp: 20, tier: 1, icon: "star", metric: "streak", threshold: 7, unit: "days" },
  { id: "streak-14", category: "streak", name: "14 Day Streak", description: "Stay active for 14 days in a row.", rewardXp: 40, tier: 2, icon: "flame", metric: "streak", threshold: 14, unit: "days", requires: "streak-7" },
  { id: "streak-30", category: "streak", name: "30 Day Streak", description: "Stay active for 30 days in a row.", rewardXp: 80, tier: 3, icon: "flame", metric: "streak", threshold: 30, unit: "days", requires: "streak-14" },
  { id: "streak-60", category: "streak", name: "60 Day Streak", description: "Stay active for 60 days in a row.", rewardXp: 120, tier: 4, icon: "flame", metric: "streak", threshold: 60, unit: "days", requires: "streak-30" },
  { id: "streak-100", category: "streak", name: "100 Day Streak", description: "Stay active for 100 days in a row.", rewardXp: 200, tier: 5, icon: "crown", metric: "streak", threshold: 100, unit: "days", requires: "streak-60" },
  { id: "streak-longest", category: "streak", name: "Longest streak", description: "Beat your personal streak record.", rewardXp: 20, tier: 1, icon: "flame", metric: "longest", threshold: 7, unit: "days" },
  { id: "task-1", category: "task", name: "First Task", description: "Complete your very first task.", rewardXp: 10, tier: 1, icon: "check", metric: "completed", threshold: 1, unit: "tasks" },
  { id: "task-10", category: "task", name: "10 Tasks", description: "Complete 10 tasks in total.", rewardXp: 20, tier: 2, icon: "checks", metric: "completed", threshold: 10, unit: "tasks", requires: "task-1" },
  { id: "task-50", category: "task", name: "50 Tasks", description: "Complete 50 tasks in total.", rewardXp: 40, tier: 3, icon: "list", metric: "completed", threshold: 50, unit: "tasks", requires: "task-10" },
  { id: "task-100", category: "task", name: "100 Tasks", description: "Complete 100 tasks in total.", rewardXp: 80, tier: 4, icon: "list", metric: "completed", threshold: 100, unit: "tasks", requires: "task-50" },
  { id: "task-250", category: "task", name: "250 Tasks", description: "Complete 250 tasks in total.", rewardXp: 120, tier: 5, icon: "badge", metric: "completed", threshold: 250, unit: "tasks", requires: "task-100" },
  { id: "task-500", category: "task", name: "500 Tasks", description: "Complete 500 tasks in total.", rewardXp: 200, tier: 6, icon: "trophy", metric: "completed", threshold: 500, unit: "tasks", requires: "task-250" },
  { id: "level-1", category: "level", name: "Level 1", description: "Begin your journey at Level 1.", rewardXp: 0, tier: 1, icon: "sprout", metric: "level", threshold: 1, unit: "levels" },
  { id: "level-5", category: "level", name: "Level 5", description: "Earn enough XP to reach Level 5.", rewardXp: 25, tier: 2, icon: "leaf", metric: "level", threshold: 5, unit: "levels", requires: "level-1" },
  { id: "level-10", category: "level", name: "Level 10", description: "Earn enough XP to reach Level 10.", rewardXp: 50, tier: 3, icon: "leaf", metric: "level", threshold: 10, unit: "levels", requires: "level-5" },
  { id: "level-15", category: "level", name: "Level 15", description: "Earn enough XP to reach Level 15.", rewardXp: 75, tier: 4, icon: "tree", metric: "level", threshold: 15, unit: "levels", requires: "level-10" },
  { id: "level-20", category: "level", name: "Level 20", description: "Earn enough XP to reach Level 20.", rewardXp: 100, tier: 5, icon: "trees", metric: "level", threshold: 20, unit: "levels", requires: "level-15" },
  { id: "level-30", category: "level", name: "Level 30", description: "Earn enough XP to reach Level 30.", rewardXp: 150, tier: 6, icon: "mountain", metric: "level", threshold: 30, unit: "levels", requires: "level-20" },
  { id: "morning-1", category: "morning", name: "Early Bird", description: "Complete a task before 9 AM.", rewardXp: 10, tier: 1, icon: "sunrise", metric: "mornings", threshold: 1, unit: "days" },
  { id: "morning-5", category: "morning", name: "Morning Momentum", description: "Finish a task before 9 AM on 5 days.", rewardXp: 20, tier: 2, icon: "sunrise", metric: "mornings", threshold: 5, unit: "days", requires: "morning-1" },
  { id: "morning-10", category: "morning", name: "Rise & Shine", description: "Finish a task before 9 AM on 10 days.", rewardXp: 40, tier: 3, icon: "sun", metric: "mornings", threshold: 10, unit: "days", requires: "morning-5" },
  { id: "morning-25", category: "morning", name: "Dawn Regular", description: "Finish a task before 9 AM on 25 days.", rewardXp: 80, tier: 4, icon: "alarm", metric: "mornings", threshold: 25, unit: "days", requires: "morning-10" },
  { id: "morning-50", category: "morning", name: "Sunrise Club", description: "Finish a task before 9 AM on 50 days.", rewardXp: 120, tier: 5, icon: "coffee", metric: "mornings", threshold: 50, unit: "days", requires: "morning-25" },
  { id: "morning-100", category: "morning", name: "Morning Master", description: "Finish a task before 9 AM on 100 days.", rewardXp: 200, tier: 6, icon: "sun", metric: "mornings", threshold: 100, unit: "days", requires: "morning-50" },
  { id: "perfect-1", category: "perfect", name: "Clean Slate", description: "Finish every planned item in a day.", rewardXp: 15, tier: 1, icon: "calendar", metric: "perfect", threshold: 1, unit: "days" },
  { id: "perfect-5", category: "perfect", name: "Five for Five", description: "Finish all planned items on 5 days.", rewardXp: 30, tier: 2, icon: "checks", metric: "perfect", threshold: 5, unit: "days", requires: "perfect-1" },
  { id: "perfect-10", category: "perfect", name: "Perfect Ten", description: "Finish all planned items on 10 days.", rewardXp: 50, tier: 3, icon: "star", metric: "perfect", threshold: 10, unit: "days", requires: "perfect-5" },
  { id: "perfect-25", category: "perfect", name: "Golden Days", description: "Finish all planned items on 25 days.", rewardXp: 80, tier: 4, icon: "sparkles", metric: "perfect", threshold: 25, unit: "days", requires: "perfect-10" },
  { id: "perfect-50", category: "perfect", name: "All Clear", description: "Finish all planned items on 50 days.", rewardXp: 120, tier: 5, icon: "medal", metric: "perfect", threshold: 50, unit: "days", requires: "perfect-25" },
  { id: "perfect-100", category: "perfect", name: "Century of Wins", description: "Finish all planned items on 100 days.", rewardXp: 200, tier: 6, icon: "trophy", metric: "perfect", threshold: 100, unit: "days", requires: "perfect-50" },
  { id: "habit-1", category: "habit", name: "First Habit", description: "Create your first habit.", rewardXp: 10, tier: 1, icon: "sprout", metric: "habits", threshold: 1, unit: "habits" },
  { id: "habit-3", category: "habit", name: "Routine Builder", description: "Create 3 habits in total.", rewardXp: 20, tier: 2, icon: "blocks", metric: "habits", threshold: 3, unit: "habits", requires: "habit-1" },
  { id: "habit-5", category: "habit", name: "Habit Explorer", description: "Create 5 habits in total.", rewardXp: 30, tier: 3, icon: "compass", metric: "habits", threshold: 5, unit: "habits", requires: "habit-3" },
  { id: "habit-10", category: "habit", name: "Habit Architect", description: "Create 10 habits in total.", rewardXp: 50, tier: 4, icon: "layers", metric: "habits", threshold: 10, unit: "habits", requires: "habit-5" },
  { id: "habit-30", category: "habit", name: "Habit Regular", description: "Check in to the same habit 30 times.", rewardXp: 40, tier: 1, icon: "repeat", metric: "habitChecks", threshold: 30, unit: "check-ins" },
  { id: "habit-100", category: "habit", name: "Second Nature", description: "Check in to the same habit 100 times.", rewardXp: 80, tier: 2, icon: "infinity", metric: "habitChecks", threshold: 100, unit: "check-ins", requires: "habit-30" },
];

export type BadgeStats = {
  streak: number;
  longest: number;
  xp: number;
  level: number;
  completed: number;
  mornings: number;
  perfect: number;
  habits: number;
  habitChecks: number;
  earned: string[];
};

export type BadgeStatus = "earned" | "progress" | "locked";

export type BadgeCard = {
  id: string;
  name: string;
  description: string;
  icon: BadgeIcon;
  tier: number;
  color: string;
  status: BadgeStatus;
  detail: string;
  progress: number;
  rewardXp: number;
};

export type BadgeGroup = {
  id: BadgeCategoryId;
  title: string;
  description: string;
  color: string;
  icon: BadgeIcon;
  earned: number;
  total: number;
  cards: BadgeCard[];
};

type StreakBag = Record<string, unknown>;

function bag(value: unknown): StreakBag {
  if (value && typeof value === "object" && !Array.isArray(value)) return { ...(value as StreakBag) };
  if (typeof value === "number") return { count: value };
  return {};
}

function numberField(value: unknown, key: string) {
  const raw = bag(value)[key];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
}

function stringList(value: unknown, key: string) {
  const raw = bag(value)[key];
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
}

export function taskCompletions(items: Item[]) {
  return items.reduce((count, item) => {
    if (item.kind === "deadline") return count;
    if (item.kind === "habit") return count + item.doneDates.length;
    return count + (item.done ? 1 : 0);
  }, 0);
}

export function perfectDates(items: Item[]) {
  const planned = items.filter((item) => item.kind !== "deadline");
  if (planned.length === 0) return [];
  let cursor = planned.reduce((earliest, item) => (item.date < earliest ? item.date : earliest), planned[0].date);
  if (cursor > TODAY) return [];
  const dates: string[] = [];
  while (cursor <= TODAY) {
    const day = itemsForDate(items, cursor).filter((item) => item.kind !== "deadline");
    if (day.length > 0 && day.every((item) => item.done)) dates.push(cursor);
    cursor = shiftDate(cursor, 1);
  }
  return dates;
}

function habitCount(items: Item[]) {
  return items.filter((item) => item.kind === "habit").length;
}

function habitChecks(items: Item[]) {
  return items.filter((item) => item.kind === "habit").reduce((best, item) => Math.max(best, item.doneDates.length), 0);
}

export function rememberProgress(streaks: unknown, items: Item[] | null, claimMorning: boolean) {
  const next = bag(streaks);
  const count = readStreak(streaks);
  next.count = count;
  next.longest = Math.max(numberField(streaks, "longest"), count);
  const mornings = stringList(streaks, "mornings");
  if (claimMorning && new Date().getHours() < 9 && !mornings.includes(TODAY)) mornings.push(TODAY);
  next.mornings = mornings;
  if (items) {
    next.perfectDays = perfectDates(items);
    next.habits = habitCount(items);
    next.habitChecks = habitChecks(items);
  }
  return next;
}

export function badgeStats(input: { xp: number; streak: number; streaks: unknown; badges: string[]; completed: number; items?: Item[] | null }): BadgeStats {
  const xp = Math.max(0, input.xp);
  const mornings = stringList(input.streaks, "mornings");
  const live = input.items ?? null;
  return {
    streak: input.streak,
    longest: Math.max(numberField(input.streaks, "longest"), input.streak),
    xp,
    level: levelProgress(xp).level,
    completed: live ? taskCompletions(live) : input.completed,
    mornings: mornings.length,
    perfect: live ? perfectDates(live).length : stringList(input.streaks, "perfectDays").length,
    habits: live ? habitCount(live) : numberField(input.streaks, "habits"),
    habitChecks: live ? habitChecks(live) : numberField(input.streaks, "habitChecks"),
    earned: input.badges,
  };
}

function metricValue(badge: BadgeDef, stats: BadgeStats) {
  return stats[badge.metric];
}

export function settleBadges(input: { xp: number; streak: number; streaks: unknown; badges: string[]; completed: number; items?: Item[] | null; claimMorning?: boolean }) {
  const streaks = rememberProgress(input.streaks, input.items ?? null, Boolean(input.claimMorning));
  let xp = Math.max(0, input.xp);
  const earned = new Set(input.badges);
  const gained: BadgeDef[] = [];
  let guard = 0;
  while (guard < badges.length) {
    guard += 1;
    const stats = badgeStats({ ...input, xp, streak: readStreak(streaks), streaks, badges: [...earned] });
    const next = badges.find((badge) => !earned.has(badge.id) && (!badge.requires || earned.has(badge.requires)) && metricValue(badge, stats) >= badge.threshold);
    if (!next) break;
    earned.add(next.id);
    xp += next.rewardXp;
    gained.push(next);
  }
  const known = new Set(badges.map((badge) => badge.id));
  const extras = input.badges.filter((id) => !known.has(id));
  const badgesOut = [...badges.filter((badge) => earned.has(badge.id)).map((badge) => badge.id), ...extras];
  const changed =
    gained.length > 0 ||
    xp !== input.xp ||
    numberField(input.streaks, "longest") !== numberField(streaks, "longest") ||
    stringList(input.streaks, "mornings").join() !== stringList(streaks, "mornings").join() ||
    stringList(input.streaks, "perfectDays").join() !== stringList(streaks, "perfectDays").join() ||
    numberField(input.streaks, "habits") !== numberField(streaks, "habits") ||
    numberField(input.streaks, "habitChecks") !== numberField(streaks, "habitChecks");
  return { xp, streaks, badges: badgesOut, gained, changed };
}

export function badgeRewardText(gained: BadgeDef[]) {
  const rewarded = gained.filter((badge) => badge.rewardXp > 0);
  if (rewarded.length === 0) return null;
  const xp = rewarded.reduce((sum, badge) => sum + badge.rewardXp, 0);
  if (rewarded.length === 1) return `${rewarded[0].name} · +${rewarded[0].rewardXp} XP`;
  return `${rewarded.map((badge) => badge.name).join(", ")} · +${xp} XP`;
}

function categoryBlurb(id: BadgeCategoryId, stats: BadgeStats) {
  if (id === "streak") return "Keep the chain alive, one day at a time.";
  if (id === "task") return `${stats.completed} completed. Every check counts.`;
  if (id === "level") return "Grow with every bit of XP you earn.";
  if (id === "morning") return `${stats.mornings} mornings started with a win before 9 AM.`;
  if (id === "perfect") return `${stats.perfect} days with every planned item done.`;
  return `${stats.habits} habits created. Your strongest: ${stats.habitChecks} check-ins.`;
}

function oneUnit(unit: string) {
  if (unit === "check-ins") return "check-in";
  return unit.endsWith("s") ? unit.slice(0, -1) : unit;
}

export function badgeCollection(stats: BadgeStats, filter: "all" | "earned" | "progress" = "all") {
  const earned = new Set(stats.earned);
  const cards: (BadgeCard & { category: BadgeCategoryId })[] = badges.map((badge) => {
    const category = badgeCategories.find((entry) => entry.id === badge.category) ?? badgeCategories[0];
    const current = metricValue(badge, stats);
    const ready = !badge.requires || earned.has(badge.requires);
    const status: BadgeStatus = earned.has(badge.id) ? "earned" : ready ? "progress" : "locked";
    const required = badges.find((entry) => entry.id === badge.requires);
    const shown = Math.max(0, Math.min(current, badge.threshold));
    const detail =
      status === "earned" && badge.id === "streak-longest"
        ? `Personal best · ${stats.longest} days`
        : status === "earned"
          ? "Milestone complete"
          : status === "locked"
            ? `Earn ${required?.name ?? "the previous badge"} first`
            : `${shown} / ${badge.threshold} ${badge.unit}`;
    return {
      id: badge.id,
      category: badge.category,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      tier: badge.tier,
      color: category.color,
      status,
      detail,
      progress: badge.threshold === 0 ? 1 : Math.max(0, Math.min(1, current / badge.threshold)),
      rewardXp: badge.rewardXp,
    };
  });
  const next = [...cards.filter((card) => card.status === "progress")].sort((a, b) => b.progress - a.progress)[0] ?? null;
  const nextBadge = badges.find((badge) => badge.id === next?.id);
  const nextCategory = badgeCategories.find((category) => category.id === next?.category);
  const remaining = nextBadge ? Math.max(0, nextBadge.threshold - metricValue(nextBadge, stats)) : 0;
  const groups = badgeCategories
    .map((category) => {
      const mine = cards.filter((card) => card.category === category.id);
      const visible = mine.filter((card) => filter === "all" || card.status === filter);
      return {
        id: category.id,
        title: category.title,
        description: categoryBlurb(category.id, stats),
        color: category.color,
        icon: category.icon,
        earned: mine.filter((card) => card.status === "earned").length,
        total: mine.length,
        cards: visible,
      };
    })
    .filter((group) => group.cards.length > 0);
  return {
    groups,
    earned: cards.filter((card) => card.status === "earned").length,
    total: badges.length,
    locked: cards.filter((card) => card.status === "locked").length,
    progressCount: cards.filter((card) => card.status === "progress").length,
    next: next && nextBadge && nextCategory
      ? {
          name: next.name,
          category: nextCategory.title,
          color: next.color,
          icon: next.icon,
          tier: next.tier,
          detail: `Just ${remaining} more ${remaining === 1 ? oneUnit(nextBadge.unit) : nextBadge.unit}. Keep showing up.`,
          label: next.detail,
          progress: next.progress,
        }
      : null,
  };
}
