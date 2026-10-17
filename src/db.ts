import { TODAY } from "./dates";
import { supabase } from "./supabase";
import { Category, type Item, type ItemKind, type Person } from "./types";

const META = "@@meta ";
const COLORS = ["#B6FF70", "#FF9F43", "#5EE0FF", "#FF6BB5", "#B388FF", "#7EE0C6"];

export type AppUser = {
  id: string;
  username: string;
  xp: number;
  streak: number;
  badges: string[];
  initials: string;
  color: string;
  streaks: unknown;
};

type TaskMeta = {
  note: string;
  date: string;
  done: boolean;
  xp: number;
  money: boolean;
  category: Category;
};

type TaskRow = {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  task_type: string;
};

type UserRow = {
  user_id: string;
  username: string | null;
  xp: number | string | null;
  streaks: unknown;
  badges: unknown;
};

const categoryValues = new Set<string>(Object.values(Category));

function isCategory(value: string): value is Category {
  return categoryValues.has(value);
}

export function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (name.replace(/\s+/g, "").slice(0, 2) || "??").toUpperCase();
}

export function readStreak(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") {
    const count = (value as { count?: unknown }).count;
    if (typeof count === "number" && Number.isFinite(count)) return count;
  }
  return 0;
}

function readBadges(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

export function toAppUser(row: UserRow, index: number): AppUser {
  const username = row.username?.trim() || "User";
  return {
    id: row.user_id,
    username,
    xp: Number(row.xp ?? 0) || 0,
    streak: readStreak(row.streaks),
    badges: readBadges(row.badges),
    initials: initialsFor(username),
    color: COLORS[index % COLORS.length],
    streaks: row.streaks,
  };
}

export function toPerson(user: AppUser): Person {
  return {
    id: user.id,
    name: user.username,
    initials: user.initials,
    color: user.color,
    meta: user.streak > 0 ? `${user.streak} day streak` : "Not started",
    poke: "poke",
  };
}

function xpFor(kind: ItemKind) {
  if (kind === "deadline") return 0;
  if (kind === "habit") return 10;
  return 20;
}

function kindFor(taskType: string): ItemKind {
  if (taskType === "habit") return "habit";
  if (taskType === "deadline") return "deadline";
  return "goal";
}

function taskTypeFor(kind: ItemKind) {
  if (kind === "habit") return "habit";
  if (kind === "deadline") return "deadline";
  return "daily";
}

function expirationDate(setup: string) {
  const today = TODAY;
  const next = shiftDate(setup, 1);
  return next > today ? next : today;
}

function decodeMeta(description: string | null, taskType: string, category: string): TaskMeta {
  if (description?.startsWith(META)) {
    try {
      const parsed = JSON.parse(description.slice(META.length)) as Partial<TaskMeta>;
      const kind = kindFor(taskType);
      return {
        note: typeof parsed.note === "string" ? parsed.note : "",
        date: typeof parsed.date === "string" ? parsed.date : TODAY,
        done: Boolean(parsed.done),
        xp: typeof parsed.xp === "number" ? parsed.xp : xpFor(kind),
        money: typeof parsed.money === "boolean" ? parsed.money : kind !== "deadline",
        category: parsed.category && isCategory(parsed.category) ? parsed.category : isCategory(category) ? category : Category.Other,
      };
    } catch {
      // keep the raw description as a note
    }
  }
  const kind = kindFor(taskType);
  return {
    note: description ?? "",
    date: TODAY,
    done: false,
    xp: xpFor(kind),
    money: kind !== "deadline",
    category: isCategory(category) ? category : Category.Other,
  };
}

function encodeMeta(meta: TaskMeta) {
  return META + JSON.stringify(meta);
}

export function rowToItem(row: TaskRow): Item {
  const meta = decodeMeta(row.description, row.task_type, row.category);
  return {
    id: String(row.id),
    title: row.title,
    kind: kindFor(row.task_type),
    category: meta.category,
    xp: meta.xp,
    money: meta.money,
    date: meta.date,
    done: meta.done,
  };
}

export type FriendshipRow = {
  id: number;
  is_accepted: boolean | null;
  user_sender: string;
  user_receiver: string;
};

export async function fetchFriendships() {
  const { data, error } = await supabase.from("friendship").select("id,is_accepted,user_sender,user_receiver");
  if (error) throw new Error(error.message);
  return (data ?? []) as FriendshipRow[];
}

export async function fetchBoard() {
  const [users, tasks] = await Promise.all([
    supabase.from("user").select("user_id,username,xp,streaks,badges"),
    supabase.from("task").select("id,user_id,title,description,category,task_type"),
  ]);
  if (users.error) throw new Error(users.error.message);
  if (tasks.error) throw new Error(tasks.error.message);
  return {
    users: ((users.data ?? []) as UserRow[]).map(toAppUser),
    tasks: (tasks.data ?? []) as TaskRow[],
  };
}

const userColumns = "user_id,username,xp,streaks,badges";

async function readUser(id: string) {
  const { data, error } = await supabase.from("user").select(userColumns).eq("user_id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toAppUser(data as UserRow, 0) : null;
}

export async function insertUser(id: string, username: string) {
  const { data, error } = await supabase
    .from("user")
    .insert({ user_id: id, username, xp: 0, streaks: { count: 0 }, badges: [] })
    .select(userColumns)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Could not save the profile.");
  return toAppUser(data as UserRow, 0);
}

export async function ensureUser(id: string, username: string) {
  const name = username.trim() || "you";
  const existing = await readUser(id);
  if (existing) {
    if (existing.username === name || name === "you") return existing;
    const blank = !existing.username.trim() || existing.username === "User";
    if (!blank) return existing;
    const { data, error } = await supabase.from("user").update({ username: name }).eq("user_id", id).select(userColumns).maybeSingle();
    if (error || !data) return existing;
    return toAppUser(data as UserRow, 0);
  }
  try {
    return await insertUser(id, name);
  } catch (error) {
    const again = await readUser(id);
    if (again) return again;
    throw error instanceof Error ? error : new Error("Could not save the profile.");
  }
}

export async function insertTask(input: {
  userId: string;
  title: string;
  kind: ItemKind;
  category: Category;
  date: string;
  note: string;
}) {
  const meta: TaskMeta = {
    note: input.note,
    date: input.date,
    done: false,
    xp: xpFor(input.kind),
    money: input.kind !== "deadline",
    category: input.category,
  };
  const { data, error } = await supabase
    .from("task")
    .insert({
      user_id: input.userId,
      title: input.title,
      description: encodeMeta(meta),
      category: input.category,
      task_type: taskTypeFor(input.kind),
      setup_date: input.date,
      expiration_date: expirationDate(input.date),
    })
    .select("id,user_id,title,description,category,task_type")
    .single();
  if (error) {
    if (error.message.includes("category_enum")) {
      throw new Error("This category is not in the task.category enum.");
    }
    if (error.message.includes("deadline task_username_key")) {
      throw new Error("The database allows only one task per account. In the Supabase SQL editor run: alter table public.task drop constraint \"deadline task_username_key\";");
    }
    throw new Error(error.message);
  }
  return data as TaskRow;
}

export async function saveTaskDone(row: TaskRow, done: boolean) {
  const meta = decodeMeta(row.description, row.task_type, row.category);
  const { error } = await supabase.from("task").update({ description: encodeMeta({ ...meta, done }) }).eq("id", row.id);
  if (error) throw new Error(error.message);
}

export function bumpStreak(current: unknown, today: string) {
  const base = current && typeof current === "object" && !Array.isArray(current) ? { ...(current as Record<string, unknown>) } : {};
  const last = typeof base.last === "string" ? base.last : null;
  const prev = readStreak(current);
  const yesterday = shiftDate(today, -1);
  const count = last === today ? prev : last === yesterday ? prev + 1 : last ? 1 : Math.max(prev, 1);
  return { value: { ...base, count, last: today }, count };
}

function shiftDate(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function saveUserProgress(id: string, xp: number, streaks: unknown) {
  const { error } = await supabase.from("user").update({ xp, streaks }).eq("user_id", id);
  if (error) throw new Error(error.message);
}
