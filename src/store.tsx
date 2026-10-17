import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Linking } from "react-native";
import { bumpStreak, ensureUser, fetchBoard, fetchFriendships, initialsFor, insertTask, rowToItem, saveTaskDone, saveUserProgress, toPerson, type AppUser, type FriendshipRow } from "./db";
import { XP_PER_LEVEL } from "./sample";
import { supabase } from "./supabase";
import { TODAY } from "./dates";
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

type NewItem = Omit<Item, "id" | "done"> & { description?: string };

type Store = {
  items: Item[];
  totalXp: number;
  streak: number;
  friends: Person[];
  requests: Person[];
  users: AppUser[];
  currentUser: AppUser | null;
  signedIn: boolean;
  authReady: boolean;
  commitmentOn: boolean;
  toast: ToastMessage | null;
  completeItem: (id: string) => void;
  addItem: (item: NewItem) => Promise<void>;
  acceptRequest: (id: string) => void;
  poke: (id: string) => void;
  setCommitment: (on: boolean) => void;
  showToast: (text: string, tone?: ToastMessage["tone"], icon?: ToastMessage["icon"]) => void;
  dismissToast: () => void;
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [friends, setFriends] = useState<Person[]>([]);
  const [requests, setRequests] = useState<Person[]>([]);
  const [commitmentOn, setCommitment] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [penaltyFt, setPenaltyFt] = useState(800);
  const [fixedHabits, setFixedHabits] = useState<string[]>([]);
  const [remindersOn, setRemindersOn] = useState(false);
  const [dailyCount, setDailyCount] = useState(3);
  const [nudgeTime, setNudgeTime] = useState("17:00");
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const rows = useRef(new Map<string, TaskRow>());

  const showToast: Store["showToast"] = (text, tone = "success", icon = "check") => {
    setToast({ id: Date.now(), text, tone, icon });
  };

  const publish = (boardUsers: AppUser[], boardTasks: TaskRow[], preferredId: string | null, friendships: FriendshipRow[] = []) => {
    rows.current = new Map(boardTasks.map((row) => [String(row.id), row]));
    setItems(boardTasks.map(rowToItem));
    setUsers(boardUsers);
    const current = preferredId ? boardUsers.find((user) => user.id === preferredId) ?? null : null;
    setCurrentUserId(current?.id ?? null);
    const friendIds = new Set<string>();
    const requestIds = new Set<string>();
    for (const row of friendships) {
      if (!current) continue;
      if (row.user_sender === current.id) {
        if (row.is_accepted) friendIds.add(row.user_receiver);
      } else if (row.user_receiver === current.id) {
        if (row.is_accepted) friendIds.add(row.user_sender);
        else requestIds.add(row.user_sender);
      }
    }
    setFriends(boardUsers.filter((user) => friendIds.has(user.id)).map(toPerson));
    setRequests(boardUsers.filter((user) => requestIds.has(user.id)).map(toPerson));
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (typeof localStorage !== "undefined") localStorage.removeItem("habit.userId");
      const { data } = await supabase.auth.getSession();
      const sessionId = data.session?.user.id ?? null;
      if (!sessionId) {
        if (!cancelled) {
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
          color: "#B6FF70",
          streaks: { count: 0 },
        };
        showToast(error instanceof Error ? error.message : "Could not save the profile", "error", "alert");
      }
      board = { ...board, users: [profile, ...board.users.filter((user) => user.id !== sessionId)] };
      const visibleUsers = board.users.filter((user) => user.id !== PROBE_USER && user.username !== "probe");
      const ownTasks = board.tasks.filter((task) => task.user_id === sessionId);
      const friendships = await fetchFriendships().catch(() => []);
      if (!cancelled) {
        publish(visibleUsers, ownTasks, sessionId, friendships);
        const remote = data.session?.user.user_metadata?.onboarding as SavedOnboarding | undefined;
        const saved = readOnboarding(sessionId) ?? (remote?.complete && Array.isArray(remote.habits) ? remote : null);
        setPenaltyFt(saved?.penaltyFt ?? 800);
        setFixedHabits(saved?.habits ?? []);
        setRemindersOn(saved?.reminders ?? false);
        setDailyCount(saved?.dailyCount ?? 3);
        setNudgeTime(saved?.nudgeTime ?? "17:00");
        setOnboardingComplete(Boolean(saved?.complete));
        setOnboardingReady(true);
        setSignedIn(true);
        setAuthReady(true);
      }
    };
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
      users,
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
      toast,
      showToast,
      dismissToast: () => setToast(null),
      setCommitment,
      completeItem: (id) => {
        const row = rows.current.get(id);
        const item = items.find((entry) => entry.id === id);
        if (!row || !item || item.done || item.kind === "deadline") return;
        const baseXp = currentUser?.xp ?? 0;
        const nextXp = baseXp + item.xp;
        const previousLevel = Math.floor(baseXp / XP_PER_LEVEL) + 1;
        const nextLevel = Math.floor(nextXp / XP_PER_LEVEL) + 1;
        const streakUpdate = bumpStreak(currentUser?.streaks, item.date);
        setItems((current) => current.map((entry) => (entry.id === id ? { ...entry, done: true } : entry)));
        if (currentUser) {
          setUsers((current) =>
            current.map((user) => (user.id === currentUser.id ? { ...user, xp: nextXp, streak: streakUpdate.count, streaks: streakUpdate.value } : user)),
          );
        }
        void saveTaskDone(row, true)
          .then(() => {
            const meta = row.description;
            rows.current.set(id, { ...row, description: meta });
          })
          .catch((error: unknown) => showToast(error instanceof Error ? error.message : "Could not save task", "error", "alert"));
        if (currentUser) {
          void saveUserProgress(currentUser.id, nextXp, streakUpdate.value).catch((error: unknown) => {
            showToast(error instanceof Error ? error.message : "Could not save XP", "error", "alert");
          });
        }
        if (nextLevel > previousLevel) showToast(`Level ${nextLevel}`, "success", "sparkles");
        else showToast(`Task completed · +${item.xp} XP`);
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
        setItems((current) => [rowToItem(row), ...current]);
      },
      acceptRequest: (id) => {
        const person = requests.find((entry) => entry.id === id);
        if (!person) return;
        setRequests((current) => current.filter((entry) => entry.id !== id));
        setFriends((current) => [...current, { ...person, meta: "Not started", poke: "poke" }]);
      },
      poke: (id) => {
        const person = friends.find((entry) => entry.id === id);
        if (!person || person.poke !== "poke" || !currentUser) return;
        const nextXp = currentUser.xp + 5;
        setFriends((current) => current.map((entry) => (entry.id === id ? { ...entry, poke: "sent", meta: entry.meta.includes("poked") ? entry.meta : `${entry.meta} · poked today` } : entry)));
        setUsers((current) => current.map((user) => (user.id === currentUser.id ? { ...user, xp: nextXp } : user)));
        void saveUserProgress(currentUser.id, nextXp, currentUser.streaks).catch((error: unknown) => {
          showToast(error instanceof Error ? error.message : "Could not save XP", "error", "alert");
        });
        showToast("Your poke helped — +5 XP", "success", "heart");
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
        publish([], [], null);
        setSignedIn(false);
        showToast("Signed out");
      },
    };
  }, [items, friends, requests, users, currentUser, signedIn, authReady, penaltyFt, fixedHabits, remindersOn, dailyCount, nudgeTime, onboardingComplete, onboardingReady, commitmentOn, toast]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Store missing");
  return store;
}
