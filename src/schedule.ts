import { PENALTY_FT } from "./sample";
import type { Item } from "./types";

export function atRisk(items: Item[], penalty = PENALTY_FT) {
  return items.filter((item) => item.money && item.kind !== "deadline" && !item.done).length * penalty;
}

function habitDoneOn(item: Item, date: string) {
  if (item.doneDates.includes(date)) return true;
  return item.done && item.date === date && item.doneDates.length === 0;
}

export function itemsForDate(items: Item[], date: string): Item[] {
  const result: Item[] = [];
  for (const item of items) {
    if (item.kind === "habit") {
      if (item.date <= date) {
        result.push({ ...item, date, done: habitDoneOn(item, date), money: true });
      }
      continue;
    }
    if (item.kind === "deadline") {
      if (item.date === date) result.push({ ...item, xp: 0, money: false });
      continue;
    }
    if (item.date === date) result.push(item);
  }
  return result;
}

export function hasHabitOn(items: Item[], date: string) {
  return items.some((item) => item.kind === "habit" && item.date <= date);
}

export function hasDatedItemOn(items: Item[], date: string) {
  return items.some((item) => item.kind !== "habit" && item.date === date);
}
