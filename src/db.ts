import { isProfileIcon } from "./components/Icons";
import { TODAY } from "./dates";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from "./supabase";
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
  icon: string | null;
  color: string;
  streaks: unknown;
};

type TaskMeta = {
  note: string;
  date: string;
  done: boolean;
  doneDates: string[];
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
  icon?: string | null;
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
    icon: typeof row.icon === "string" && isProfileIcon(row.icon) ? row.icon : null,
    color: COLORS[index % COLORS.length],
    streaks: row.streaks,
  };
}

export function toPerson(user: AppUser): Person {
  return {
    id: user.id,
    name: user.username,
    initials: user.initials,
    icon: user.icon,
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

function expirationDate(kind: ItemKind, setup: string) {
  if (kind === "habit") return "2099-12-31";
  const today = TODAY;
  const next = shiftDate(setup, 1);
  return next > today ? next : today;
}

function readDoneDates(value: unknown, done: boolean, date: string) {
  const listed = Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && /^\d{4}-\d{2}-\d{2}$/.test(entry)) : [];
  if (done && !listed.includes(date)) listed.push(date);
  return listed;
}

function decodeMeta(description: string | null, taskType: string, category: string): TaskMeta {
  if (description?.startsWith(META)) {
    try {
      const parsed = JSON.parse(description.slice(META.length)) as Partial<TaskMeta>;
      const kind = kindFor(taskType);
      const date = typeof parsed.date === "string" ? parsed.date : TODAY;
      const done = Boolean(parsed.done);
      return {
        note: typeof parsed.note === "string" ? parsed.note : "",
        date,
        done,
        doneDates: readDoneDates(parsed.doneDates, done && kind === "habit", date),
        xp: xpFor(kind),
        money: kind !== "deadline",
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
    doneDates: [],
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
    doneDates: meta.doneDates,
  };
}

export type FriendshipRow = {
  id: number;
  is_accepted: boolean | null;
  user_sender: string;
  user_receiver: string;
};

const friendshipColumns = "id,is_accepted,user_sender,user_receiver";

function toFriendship(row: FriendshipRow): FriendshipRow {
  return { ...row, id: Number(row.id), is_accepted: Boolean(row.is_accepted) };
}

export async function fetchFriendships() {
  const { data, error } = await supabase.from("friendship").select(friendshipColumns);
  if (error) throw new Error(error.message);
  return ((data ?? []) as FriendshipRow[]).map(toFriendship);
}

export async function insertFriendship(sender: string, receiver: string) {
  const { data, error } = await supabase
    .from("friendship")
    .insert({ user_sender: sender, user_receiver: receiver, is_accepted: false, acceptance_date: null })
    .select(friendshipColumns)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Could not send the friend request.");
  return toFriendship(data as FriendshipRow);
}

export async function acceptFriendship(id: number) {
  const { error } = await supabase.from("friendship").update({ is_accepted: true, acceptance_date: new Date().toISOString().slice(0, 10) }).eq("id", id);
  if (error) throw new Error(error.message);
}

async function selectUsers(columns: string) {
  const first = await supabase.from("user").select(columns);
  const next = first.error ? narrowerColumns(columns, first.error.message) : null;
  if (next) return selectUsers(next);
  return first;
}

async function selectUser(id: string, columns: string) {
  const first = await supabase.from("user").select(columns).eq("user_id", id).maybeSingle();
  const next = first.error ? narrowerColumns(columns, first.error.message) : null;
  if (next) return selectUser(id, next);
  return first;
}

export async function fetchBoard() {
  const [users, tasks] = await Promise.all([
    selectUsers(userColumns),
    supabase.from("task").select("id,user_id,title,description,category,task_type"),
  ]);
  if (users.error) throw new Error(users.error.message);
  if (tasks.error) throw new Error(tasks.error.message);
  return {
    users: ((users.data ?? []) as unknown as UserRow[]).map(toAppUser),
    tasks: (tasks.data ?? []) as TaskRow[],
  };
}

const userColumns = "user_id,username,xp,streaks,badges,icon";
const legacyUserColumns = "user_id,username,xp,streaks,badges";

function narrowerColumns(columns: string, message: string) {
  if (columns === userColumns && message.toLowerCase().includes("icon")) return legacyUserColumns;
  return null;
}

async function readUser(id: string) {
  const { data, error } = await selectUser(id, userColumns);
  if (error) throw new Error(error.message);
  return data ? toAppUser(data as unknown as UserRow, 0) : null;
}

export async function updateUsername(id: string, username: string) {
  const name = username.trim();
  if (!name) throw new Error("Add a username.");
  if (name.length > 24) throw new Error("Use a username of at most 24 characters.");
  const { error } = await supabase.from("user").update({ username: name }).eq("user_id", id);
  if (error) throw new Error(error.message);
  const authUpdate = await supabase.auth.updateUser({ data: { username: name } });
  if (authUpdate.error) throw new Error(authUpdate.error.message);
  return name;
}

function deleteDenied(message: string) {
  const text = message.toLowerCase();
  return text.includes("row-level security") || text.includes("permission") || text.includes("policy");
}

async function deleteAuthUser() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return false;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
  });
  return response.ok;
}

export async function deleteAccount(id: string) {
  const rpc = await supabase.rpc("delete_own_account");
  if (!rpc.error) return;
  const missing = /delete_own_account|could not find the function|schema cache/i.test(rpc.error.message);
  if (!missing) throw new Error(rpc.error.message);

  const friendship = await supabase.from("friendship").delete().or(`user_sender.eq.${id},user_receiver.eq.${id}`);
  if (friendship.error) {
    throw new Error(deleteDenied(friendship.error.message) ? "Account deletion is blocked. Add the delete_own_account function in the Supabase SQL editor." : friendship.error.message);
  }
  const tasks = await supabase.from("task").delete().eq("user_id", id);
  if (tasks.error) {
    throw new Error(deleteDenied(tasks.error.message) ? "Account deletion is blocked. Add the delete_own_account function in the Supabase SQL editor." : tasks.error.message);
  }
  const profile = await supabase.from("user").delete().eq("user_id", id);
  if (profile.error) {
    throw new Error(deleteDenied(profile.error.message) ? "Account deletion is blocked. Add the delete_own_account function in the Supabase SQL editor." : profile.error.message);
  }
  await deleteAuthUser();
}

export async function updateUserIcon(id: string, icon: string | null) {
  const { error } = await supabase.from("user").update({ icon }).eq("user_id", id);
  if (error) {
    if (error.message.toLowerCase().includes("icon")) {
      throw new Error("The profile icon column is missing. In the Supabase SQL editor, add icon text to the user table.");
    }
    throw new Error(error.message);
  }
}

export async function insertUser(id: string, username: string) {
  const { data, error } = await supabase
    .from("user")
    .insert({ user_id: id, username, xp: 0, streaks: { count: 0 }, badges: [] })
    .select(userColumns)
    .maybeSingle();
  const next = error ? narrowerColumns(userColumns, error.message) : null;
  if (next) {
    const again = await supabase.from("user").insert({ user_id: id, username, xp: 0, streaks: { count: 0 }, badges: [] }).select(next).maybeSingle();
    if (again.error) {
      const legacy = narrowerColumns(next, again.error.message);
      if (!legacy) throw new Error(again.error.message);
      const last = await supabase.from("user").insert({ user_id: id, username, xp: 0, streaks: { count: 0 }, badges: [] }).select(legacy).maybeSingle();
      if (last.error) throw new Error(last.error.message);
      if (!last.data) throw new Error("Could not save the profile.");
      return toAppUser(last.data as unknown as UserRow, 0);
    }
    if (!again.data) throw new Error("Could not save the profile.");
    return toAppUser(again.data as unknown as UserRow, 0);
  }
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
    const updated = await supabase.from("user").update({ username: name }).eq("user_id", id).select(userColumns).maybeSingle();
    const next = updated.error ? narrowerColumns(userColumns, updated.error.message) : null;
    const data = next ? (await supabase.from("user").update({ username: name }).eq("user_id", id).select(next).maybeSingle()).data : updated.data;
    if (!data) return existing;
    return toAppUser(data as unknown as UserRow, 0);
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
    doneDates: [],
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
      expiration_date: expirationDate(input.kind, input.date),
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

export async function saveTaskDone(row: TaskRow, done: boolean, occurrenceDate?: string) {
  const meta = decodeMeta(row.description, row.task_type, row.category);
  const kind = kindFor(row.task_type);
  const next: TaskMeta =
    kind === "habit" && occurrenceDate
      ? { ...meta, doneDates: meta.doneDates.includes(occurrenceDate) ? meta.doneDates : [...meta.doneDates, occurrenceDate] }
      : { ...meta, done };
  const description = encodeMeta(next);
  const { error } = await supabase.from("task").update({ description }).eq("id", row.id);
  if (error) throw new Error(error.message);
  return { ...row, description };
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
