import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Linking } from "react-native";
import { badgeRewardText, settleBadges } from "./badges";
import { acceptFriendship, bumpStreak, deleteAccount, ensureUser, fetchBoard, fetchFriendships, initialsFor, insertFriendship, insertTask, readStreak, rowToItem, saveTaskDone, saveUserProgress, updateUserIcon, updateUsername, toPerson, type AppUser, type FriendshipRow } from "./db";
import { TODAY } from "./dates";
import { XP_PER_LEVEL } from "./sample";
import { supabase } from "./supabase";
import { Category, type Item, type Person, type ToastMessage } from "./types";

const PROBE_USER = "00000000-0000-0000-0000-000000000099";

function webRedirectOrigin() {
  if (typeof window === "undefined" || !window.location) return undefined;
  const origin = window.location.origin;
  return typeof origin === "string" && origin.length > 0 ? origin : undefined;
}
let signupName: string | null = null;

type SavedOnboarding = { complete: true; penaltyFt: number; habits: string[]; reminders: boolean; dailyCount: number; nudgeTime: string };
const onboardingMemory = new Map<string, string>();

function onboardingKey(userId: string) {
  return `habit.onboarding.${userId}`;
}

function readOnboarding(userId: string): SavedOnboarding | null {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(onboardingKey(userId)) : (onboardingMemory.get(onboardingKey(userId)) ?? null);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SavedOnboarding>;
    if (!parsed.complete || !Array.isArray(parsed.habits)) return null;
    const dailyCount = typeof parsed.dailyCount === "number" && parsed.dailyCount >= 0 && parsed.dailyCount <= 6 ? parsed.dailyCount : 3;
    const nudgeTime = typeof parsed.nudgeTime === "string" && /^\d{2}:\d{2}$/.test(parsed.nudgeTime) ? parsed.nudgeTime : "17:00";
    return { complete: true, penaltyFt: parsed.penaltyFt ?? 800, habits: parsed.habits, reminders: Boolean(parsed.reminders), dailyCount, nudgeTime };
  } catch {
    return null;
  }
}

function writeOnboarding(userId: string, value: SavedOnboarding) {
  const raw = JSON.stringify(value);
  if (typeof localStorage !== "undefined") localStorage.setItem(onboardingKey(userId), raw);
  else onboardingMemory.set(onboardingKey(userId), raw);
}

function categoryForHabit(title: string) {
  const key = title.toLowerCase();
  if (key.includes("water")) return Category.Hygiene;
  if (key.includes("workout") || key.includes("run")) return Category.Fitness;
  return Category.Personal;
}

const POKE_LIMIT = 5;

type PokeLog = { date: string; ids: string[]; rewarded: string[] };

function readPokeLog(streaks: unknown): PokeLog {
  const empty = { date: TODAY, ids: [] as string[], rewarded: [] as string[] };
  if (!streaks || typeof streaks !== "object" || Array.isArray(streaks)) return empty;
  const pokes = (streaks as { pokes?: Partial<PokeLog> }).pokes;
  if (!pokes || pokes.date !== TODAY) return empty;
  return {
    date: TODAY,
    ids: Array.isArray(pokes.ids) ? pokes.ids.filter((id): id is string => typeof id === "string") : [],
    rewarded: Array.isArray(pokes.rewarded) ? pokes.rewarded.filter((id): id is string => typeof id === "string") : [],
  };
}

function writePokeLog(streaks: unknown, log: PokeLog) {
  if (Array.isArray(streaks)) return { count: streaks.length, pokes: log };
  if (streaks && typeof streaks === "object") return { ...(streaks as Record<string, unknown>), pokes: log };
  return { count: 0, pokes: log };
}

function finishedDaily(tasks: { done: number; total: number } | undefined) {
  return Boolean(tasks && tasks.total > 0 && tasks.done >= tasks.total);
}

function signupError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("error sending confirmation") || lower.includes("confirmation email")) {
    return "Supabase blocked the confirmation email, so the account was not created. In Supabase, open Authentication, then Sign In / Providers, then Email, and turn off Confirm email. Then sign up again.";
  }
  return message;
}

type TaskRow = {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  task_type: string;
};

type NewItem = Omit<Item, "id" | "done" | "doneDates"> & { description?: string };

type Store = {
  items: Item[];
  totalXp: number;
  streak: number;
  friends: Person[];
  requests: Person[];
  outgoing: string[];
  users: AppUser[];
  completedCounts: Record<string, number>;
  dailyTasks: Record<string, { done: number; total: number }>;
  currentUser: AppUser | null;
  signedIn: boolean;
  authReady: boolean;
  commitmentOn: boolean;
  pokeNotice: string | null;
  toast: ToastMessage | null;
  completeItem: (id: string, date: string) => void;
  addItem: (item: NewItem) => Promise<void>;
  acceptRequest: (id: string) => void;
  sendRequest: (id: string) => Promise<void>;
  poke: (id: string) => void;
  setProfileIcon: (icon: string | null) => Promise<void>;
  renameUser: (username: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  setCommitment: (on: boolean) => void;
  showToast: (text: string, tone?: ToastMessage["tone"], icon?: ToastMessage["icon"]) => void;
  dismissToast: () => void;
  dismissPokeNotice: () => void;
  refreshBoard: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  penaltyFt: number;
  fixedHabits: string[];
  remindersOn: boolean;
  dailyCount: number;
  nudgeTime: string;
  onboardingComplete: boolean;
  onboardingReady: boolean;
  finishOnboarding: (input: { penaltyFt: number; habits: string[]; reminders: boolean; dailyCount: number; nudgeTime: string }) => Promise<void>;
  updateOnboarding: (input: { penaltyFt: number; habits: string[]; reminders: boolean; dailyCount: number; nudgeTime: string }) => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({});
  const [dailyTasks, setDailyTasks] = useState<Record<string, { done: number; total: number }>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [friends, setFriends] = useState<Person[]>([]);
  const [requests, setRequests] = useState<Person[]>([]);
  const [outgoing, setOutgoing] = useState<string[]>([]);
  const [commitmentOn, setCommitment] = useState(false);
  const [pokeNotice, setPokeNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [penaltyFt, setPenaltyFt] = useState(800);
  const [fixedHabits, setFixedHabits] = useState<string[]>([]);
  const [remindersOn, setRemindersOn] = useState(false);
  const [dailyCount, setDailyCount] = useState(3);
  const [nudgeTime, setNudgeTime] = useState("17:00");
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const rows = useRef(new Map<string, TaskRow>());
  const reload = useRef<() => Promise<void>>(async () => undefined);
  const friendshipRows = useRef<FriendshipRow[]>([]);
  const sending = useRef(new Set<string>());

  const showToast: Store["showToast"] = (text, tone = "success", icon = "check") => {
    setToast({ id: Date.now(), text, tone, icon });
  };

  const publish = (boardUsers: AppUser[], boardTasks: TaskRow[], preferredId: string | null, friendships: FriendshipRow[] = []) => {
    rows.current = new Map(boardTasks.map((row) => [String(row.id), row]));
    setItems(boardTasks.map(rowToItem));
    setUsers(boardUsers);
    const current = preferredId ? boardUsers.find((user) => user.id === preferredId) ?? null : null;
    setCurrentUserId(current?.id ?? null);
    friendshipRows.current = friendships;
    relate(boardUsers, current?.id ?? null, friendships);
  };

  const relate = (boardUsers: AppUser[], currentId: string | null, links: FriendshipRow[]) => {
    const friendIds = new Set<string>();
    const requestIds = new Set<string>();
    const outgoingIds = new Set<string>();
    for (const row of links) {
      if (!currentId) continue;
      const sent = row.user_sender === currentId;
      const received = row.user_receiver === currentId;
      if (!sent && !received) continue;
      const other = sent ? row.user_receiver : row.user_sender;
      if (row.is_accepted) friendIds.add(other);
      else if (sent) outgoingIds.add(other);
      else requestIds.add(other);
    }
    const poked = new Set(readPokeLog(boardUsers.find((user) => user.id === currentId)?.streaks).ids);
    setFriends(
      boardUsers
        .filter((user) => friendIds.has(user.id))
        .map((user) => {
          const person = toPerson(user);
          return poked.has(user.id) ? { ...person, poke: "sent" as const } : person;
        }),
    );
    setRequests(boardUsers.filter((user) => requestIds.has(user.id)).map(toPerson));
    setOutgoing([...outgoingIds]);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (typeof localStorage !== "undefined") localStorage.removeItem("habit.userId");
      const { data } = await supabase.auth.getSession();
      const sessionId = data.session?.user.id ?? null;
      if (!sessionId) {
        if (!cancelled) {
          setCompletedCounts({});
          setDailyTasks({});
          publish([], [], null);
          setPenaltyFt(800);
          setFixedHabits([]);
          setRemindersOn(false);
          setDailyCount(3);
          setNudgeTime("17:00");
          setOnboardingComplete(false);
          setOnboardingReady(true);
          setSignedIn(false);
          setAuthReady(true);
        }
        return;
      }
      let board = await fetchBoard();
      const metadata = data.session?.user.user_metadata;
      const metadataName = [metadata?.username, metadata?.full_name, metadata?.name].find((value) => typeof value === "string" && value.trim());
      const username = signupName || (typeof metadataName === "string" ? metadataName.trim() : "") || data.session?.user.email?.split("@")[0] || "you";
      let profile: AppUser;
      try {
        profile = await ensureUser(sessionId, username);
        signupName = null;
      } catch (error) {
        profile = {
          id: sessionId,
          username,
          xp: 0,
          streak: 0,
          badges: [],
          initials: initialsFor(username),
          icon: null,
          color: "#B6FF70",
          streaks: { count: 0 },
        };
        showToast(error instanceof Error ? error.message : "Could not save the profile", "error", "alert");
      }
      board = { ...board, users: [profile, ...board.users.filter((user) => user.id !== sessionId)] };
      const visibleUsers = board.users.filter((user) => user.id !== PROBE_USER && user.username !== "probe");
      const ownTasks = board.tasks.filter((task) => task.user_id === sessionId);
      const counts: Record<string, number> = {};
      const daily: Record<string, { done: number; total: number }> = {};
      for (const task of board.tasks) {
        const item = rowToItem(task);
        if (item.done) counts[task.user_id] = (counts[task.user_id] ?? 0) + 1;
        if (item.date !== TODAY || item.kind === "deadline") continue;
        const current = daily[task.user_id] ?? { done: 0, total: 0 };
        daily[task.user_id] = { done: current.done + (item.done ? 1 : 0), total: current.total + 1 };
      }
      const friendships = await fetchFriendships().catch(() => []);
      const log = readPokeLog(profile.streaks);
      let gained = 0;
      for (const id of log.ids) {
        if (log.rewarded.includes(id) || !finishedDaily(daily[id])) continue;
        log.rewarded.push(id);
        gained += 5;
      }
      if (gained > 0) {
        profile = { ...profile, xp: profile.xp + gained, streaks: writePokeLog(profile.streaks, log) };
        const notice = gained === 5 ? "Your poke helped — +5 XP" : `Your pokes helped — +${gained} XP`;
        setPokeNotice(notice);
        showToast(notice, "success", "heart");
      }
      const ownItems = ownTasks.map(rowToItem);
      const settled = settleBadges({ xp: profile.xp, streak: profile.streak, streaks: profile.streaks, badges: profile.badges, completed: 0, items: ownItems });
      if (settled.changed) {
        profile = { ...profile, xp: settled.xp, streak: readStreak(settled.streaks), streaks: settled.streaks, badges: settled.badges };
        void saveUserProgress(profile.id, settled.xp, settled.streaks, settled.badges).catch((error: unknown) => {
          showToast(error instanceof Error ? error.message : "Could not save XP", "error", "alert");
        });
        const reward = badgeRewardText(settled.gained);
        if (reward) showToast(reward, "success", "sparkles");
      } else if (gained > 0) {
        void saveUserProgress(profile.id, profile.xp, profile.streaks).catch((error: unknown) => {
          showToast(error instanceof Error ? error.message : "Could not save XP", "error", "alert");
        });
      }
      const boardUsers = visibleUsers.map((user) => (user.id === profile.id ? profile : user));
      if (!cancelled) {
        const remote = data.session?.user.user_metadata?.onboarding as SavedOnboarding | undefined;
        const saved = readOnboarding(sessionId) ?? (remote?.complete && Array.isArray(remote.habits) ? remote : null);
        setPenaltyFt(saved?.penaltyFt ?? 800);
        setFixedHabits(saved?.habits ?? []);
        setRemindersOn(saved?.reminders ?? false);
        setDailyCount(saved?.dailyCount ?? 3);
        setNudgeTime(saved?.nudgeTime ?? "17:00");
        setOnboardingComplete(Boolean(saved?.complete));
        setOnboardingReady(true);
        setCompletedCounts(counts);
        setDailyTasks(daily);
        publish(boardUsers, ownTasks, sessionId, friendships);
        setSignedIn(true);
        setAuthReady(true);
      }
    };
    reload.current = () => load();
    load().catch((error: unknown) => {
      if (!cancelled) {
        setOnboardingReady(true);
        setSignedIn(false);
        setAuthReady(true);
        showToast(error instanceof Error ? error.message : "Could not load Supabase", "error", "alert");
      }
    });
    const { data } = supabase.auth.onAuthStateChange(() => {
      // Reloading inside this callback deadlocks sign-up: it holds the auth lock until getSession finishes.
      setTimeout(() => {
        if (cancelled) return;
        load().catch(() => undefined);
      }, 0);
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const currentUser = users.find((user) => user.id === currentUserId) ?? null;

  const api = useMemo<Store>(() => {
    return {
      items,
      totalXp: currentUser?.xp ?? 0,
      streak: currentUser?.streak ?? 0,
      friends,
      requests,
      outgoing,
      users,
      completedCounts,
      dailyTasks,
      currentUser,
      signedIn,
      authReady,
      penaltyFt,
      fixedHabits,
      remindersOn,
      dailyCount,
      nudgeTime,
      onboardingComplete,
      onboardingReady,
      commitmentOn,
      pokeNotice,
      toast,
      showToast,
      dismissToast: () => setToast(null),
      dismissPokeNotice: () => setPokeNotice(null),
      refreshBoard: () => reload.current(),
      setCommitment,
      completeItem: (id, date) => {
        const row = rows.current.get(id);
        const item = items.find((entry) => entry.id === id);
        if (!row || !item) return;
        if (item.kind === "deadline" && date !== TODAY) return;
        const habitDone = item.doneDates.includes(date) || (item.done && item.date === date && item.doneDates.length === 0);
        if (item.kind === "habit" && (date > TODAY || habitDone)) return;
        if (item.kind !== "habit" && item.done) return;
        const baseXp = currentUser?.xp ?? 0;
        const nextXp = baseXp + item.xp;
        const previousLevel = Math.floor(baseXp / XP_PER_LEVEL) + 1;
        const streakUpdate = bumpStreak(currentUser?.streaks, date);
        const nextItems = items.map((entry) => {
          if (entry.id !== id) return entry;
          if (entry.kind === "habit") {
            if (entry.doneDates.includes(date)) return entry;
            return { ...entry, doneDates: [...entry.doneDates, date] };
          }
          return { ...entry, done: true };
        });
        const settled = currentUser
          ? settleBadges({ xp: nextXp, streak: streakUpdate.count, streaks: streakUpdate.value, badges: currentUser.badges, completed: 0, items: nextItems, claimMorning: true })
          : null;
        const savedXp = settled?.xp ?? nextXp;
        const nextLevel = Math.floor(savedXp / XP_PER_LEVEL) + 1;
        setItems(nextItems);
        if (currentUser && settled) {
          setUsers((current) =>
            current.map((user) => (user.id === currentUser.id ? { ...user, xp: settled.xp, streak: streakUpdate.count, streaks: settled.streaks, badges: settled.badges } : user)),
          );
          setCompletedCounts((current) => ({ ...current, [currentUser.id]: (current[currentUser.id] ?? 0) + 1 }));
          if (item.date === TODAY && item.kind !== "deadline") {
            setDailyTasks((current) => {
              const previous = current[currentUser.id] ?? { done: 0, total: 0 };
              return { ...current, [currentUser.id]: { ...previous, done: previous.done + 1 } };
            });
          }
        }
        void saveTaskDone(row, true, item.kind === "habit" ? date : undefined)
          .then((saved) => {
            rows.current.set(id, saved);
          })
          .catch((error: unknown) => showToast(error instanceof Error ? error.message : "Could not save task", "error", "alert"));
        const reward = settled ? badgeRewardText(settled.gained) : null;
        if (currentUser && settled) {
          void saveUserProgress(currentUser.id, settled.xp, settled.streaks, settled.badges).catch((error: unknown) => {
            showToast(error instanceof Error ? error.message : "Could not save XP", "error", "alert");
          });
        }
        if (reward) showToast(reward, "success", "sparkles");
        else if (nextLevel > previousLevel) showToast(`Level ${nextLevel}`, "success", "sparkles");
        else if (item.kind === "deadline") showToast("Deadline completed");
        else showToast(`${item.kind === "habit" ? "Habit" : "Task"} completed · +${item.xp} XP`);
      },
      addItem: async (item) => {
        if (!currentUser) throw new Error("Sign in first.");
        const row = await insertTask({
          userId: currentUser.id,
          title: item.title,
          kind: item.kind,
          category: item.category,
          date: item.date,
          note: item.description ?? "",
        });
        rows.current.set(String(row.id), row);
        const created = rowToItem(row);
        const nextItems = [created, ...items];
        setItems(nextItems);
        const settled = settleBadges({ xp: currentUser.xp, streak: currentUser.streak, streaks: currentUser.streaks, badges: currentUser.badges, completed: 0, items: nextItems });
        if (settled.changed) {
          setUsers((current) => current.map((user) => (user.id === currentUser.id ? { ...user, xp: settled.xp, streaks: settled.streaks, badges: settled.badges } : user)));
          void saveUserProgress(currentUser.id, settled.xp, settled.streaks, settled.badges).catch((error: unknown) => {
            showToast(error instanceof Error ? error.message : "Could not save XP", "error", "alert");
          });
          const reward = badgeRewardText(settled.gained);
          if (reward) showToast(reward, "success", "sparkles");
        }
      },
      acceptRequest: (id) => {
        const person = requests.find((entry) => entry.id === id);
        const row = friendshipRows.current.find((entry) => !entry.is_accepted && entry.user_sender === id && entry.user_receiver === currentUser?.id);
        if (!person || !row || !currentUser) return;
        const previous = friendshipRows.current;
        const next = previous.map((entry) => (entry.id === row.id ? { ...entry, is_accepted: true } : entry));
        friendshipRows.current = next;
        relate(users, currentUser.id, next);
        void acceptFriendship(row.id)
          .then(() => showToast("Friend request accepted"))
          .catch((error: unknown) => {
            friendshipRows.current = previous;
            relate(users, currentUser.id, previous);
            showToast(error instanceof Error ? error.message : "Could not accept the request", "error", "alert");
          });
      },
      sendRequest: async (id) => {
        if (!currentUser || id === currentUser.id || sending.current.has(id)) return;
        const existing = friendshipRows.current.some((entry) => (entry.user_sender === currentUser.id && entry.user_receiver === id) || (entry.user_sender === id && entry.user_receiver === currentUser.id));
        if (existing) return;
        sending.current.add(id);
        try {
          const row = await insertFriendship(currentUser.id, id);
          const next = [...friendshipRows.current, row];
          friendshipRows.current = next;
          relate(users, currentUser.id, next);
          showToast("Friend request sent");
        } catch (error) {
          showToast(error instanceof Error ? error.message : "Could not send the friend request", "error", "alert");
        } finally {
          sending.current.delete(id);
        }
      },
      poke: (id) => {
        const person = friends.find((entry) => entry.id === id);
        if (!person || person.poke !== "poke" || !currentUser) return;
        const log = readPokeLog(currentUser.streaks);
        if (log.ids.includes(id)) return;
        if (log.ids.length >= POKE_LIMIT) {
          showToast("You can only poke 5 people a day.", "error", "alert");
          return;
        }
        log.ids.push(id);
        const helped = finishedDaily(dailyTasks[id]);
        if (helped) log.rewarded.push(id);
        const nextXp = currentUser.xp + (helped ? 5 : 0);
        const streaks = writePokeLog(currentUser.streaks, log);
        const settled = settleBadges({ xp: nextXp, streak: currentUser.streak, streaks, badges: currentUser.badges, completed: 0, items });
        setFriends((current) => current.map((entry) => (entry.id === id ? { ...entry, poke: "sent" } : entry)));
        setUsers((current) => current.map((user) => (user.id === currentUser.id ? { ...user, xp: settled.xp, streaks: settled.streaks, badges: settled.badges } : user)));
        void saveUserProgress(currentUser.id, settled.xp, settled.streaks, settled.badges).catch((error: unknown) => {
          showToast(error instanceof Error ? error.message : "Could not save XP", "error", "alert");
        });
        if (helped) setPokeNotice("Your poke helped — +5 XP");
        const reward = badgeRewardText(settled.gained);
        showToast(reward ?? (helped ? "Your poke helped — +5 XP" : "Poked"), "success", reward ? "sparkles" : "heart");
      },
      setProfileIcon: async (icon) => {
        if (!currentUser || currentUser.icon === icon) return;
        const previous = currentUser.icon;
        setUsers((current) => current.map((user) => (user.id === currentUser.id ? { ...user, icon } : user)));
        try {
          await updateUserIcon(currentUser.id, icon);
        } catch (error) {
          setUsers((current) => current.map((user) => (user.id === currentUser.id ? { ...user, icon: previous } : user)));
          showToast(error instanceof Error ? error.message : "Could not save the icon", "error", "alert");
        }
      },
      renameUser: async (username) => {
        if (!currentUser) throw new Error("Sign in first.");
        const name = username.trim();
        if (!name || name === currentUser.username) return;
        const previous = currentUser;
        setUsers((current) => current.map((user) => (user.id === currentUser.id ? { ...user, username: name, initials: initialsFor(name) } : user)));
        try {
          await updateUsername(currentUser.id, name);
          showToast("Username saved");
        } catch (error) {
          setUsers((current) => current.map((user) => (user.id === currentUser.id ? previous : user)));
          throw error;
        }
      },
      deleteAccount: async () => {
        if (!currentUser) throw new Error("Sign in first.");
        await deleteAccount(currentUser.id);
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);
        setCompletedCounts({});
        setDailyTasks({});
        setPokeNotice(null);
        publish([], [], null);
        setSignedIn(false);
        showToast("Account deleted");
      },
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        showToast("Signed in");
      },
      finishOnboarding: async ({ penaltyFt: amount, habits, reminders, dailyCount: count, nudgeTime: time }) => {
        if (!currentUser) throw new Error("Sign in first.");
        const titles = habits.map((habit) => habit.trim()).filter(Boolean);
        for (const title of titles) {
          if (items.some((item) => item.date === TODAY && item.title === title)) continue;
          const row = await insertTask({
            userId: currentUser.id,
            title,
            kind: "goal",
            category: categoryForHabit(title),
            date: TODAY,
            note: "",
          });
          rows.current.set(String(row.id), row);
          setItems((current) => [rowToItem(row), ...current]);
        }
        const saved = { complete: true as const, penaltyFt: amount, habits: titles, reminders, dailyCount: count, nudgeTime: time };
        writeOnboarding(currentUser.id, saved);
        await supabase.auth.updateUser({ data: { onboarding: saved } }).catch(() => undefined);
        setPenaltyFt(amount);
        setFixedHabits(titles);
        setRemindersOn(reminders);
        setDailyCount(count);
        setNudgeTime(time);
        setOnboardingComplete(true);
      },
      updateOnboarding: async ({ penaltyFt: amount, habits, reminders, dailyCount: count, nudgeTime: time }) => {
        if (!currentUser) throw new Error("Sign in first.");
        const titles = habits.map((habit) => habit.trim()).filter(Boolean);
        for (const title of titles) {
          if (items.some((item) => item.date === TODAY && item.title === title)) continue;
          const row = await insertTask({
            userId: currentUser.id,
            title,
            kind: "goal",
            category: categoryForHabit(title),
            date: TODAY,
            note: "",
          });
          rows.current.set(String(row.id), row);
          setItems((current) => [rowToItem(row), ...current]);
        }
        const saved = { complete: true as const, penaltyFt: amount, habits: titles, reminders, dailyCount: count, nudgeTime: time };
        writeOnboarding(currentUser.id, saved);
        await supabase.auth.updateUser({ data: { onboarding: saved } }).catch(() => undefined);
        setPenaltyFt(amount);
        setFixedHabits(titles);
        setRemindersOn(reminders);
        setDailyCount(count);
        setNudgeTime(time);
        setOnboardingComplete(true);
      },
      signInWithGoogle: async () => {
        const redirectTo = webRedirectOrigin();
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo, skipBrowserRedirect: redirectTo == null },
        });
        if (error) throw new Error(error.message);
        if (redirectTo == null) {
          if (!data?.url) throw new Error("Could not start Google sign-in");
          await Linking.openURL(data.url);
        }
      },
      signUp: async (email, password, username) => {
        signupName = username;
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
        if (error) {
          signupName = null;
          throw new Error(signupError(error.message));
        }
        if (!data.session || !data.user) {
          signupName = null;
          throw new Error("This project still requires a confirmation email, so the new account cannot sign in. In Supabase, open Authentication, then Sign In / Providers, then Email, and turn off Confirm email.");
        }
        showToast("Account created");
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);
        setCompletedCounts({});
        setDailyTasks({});
        setPokeNotice(null);
        publish([], [], null);
        setSignedIn(false);
        showToast("Signed out");
      },
    };
  }, [items, friends, requests, outgoing, users, completedCounts, dailyTasks, currentUser, signedIn, authReady, penaltyFt, fixedHabits, remindersOn, dailyCount, nudgeTime, onboardingComplete, onboardingReady, commitmentOn, pokeNotice, toast]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Store missing");
  return store;
}
