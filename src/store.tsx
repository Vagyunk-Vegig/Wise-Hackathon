import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { acceptFriendship, bumpStreak, deleteAccount, ensureUser, fetchBoard, fetchFriendships, initialsFor, insertFriendship, insertTask, rowToItem, saveTaskDone, saveUserProgress, updateUserIcon, updateUsername, toPerson, type AppUser, type FriendshipRow } from "./db";
import { TODAY } from "./dates";
import { XP_PER_LEVEL } from "./sample";
import { supabase } from "./supabase";
import type { Item, Person, ToastMessage } from "./types";

const PROBE_USER = "00000000-0000-0000-0000-000000000099";
let signupName: string | null = null;

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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
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
  const rows = useRef(new Map<string, TaskRow>());
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
        void saveUserProgress(profile.id, profile.xp, profile.streaks).catch((error: unknown) => {
          showToast(error instanceof Error ? error.message : "Could not save XP", "error", "alert");
        });
        const notice = gained === 5 ? "Your poke helped — +5 XP" : `Your pokes helped — +${gained} XP`;
        setPokeNotice(notice);
        showToast(notice, "success", "heart");
      }
      const boardUsers = visibleUsers.map((user) => (user.id === profile.id ? profile : user));
      if (!cancelled) {
        setCompletedCounts(counts);
        setDailyTasks(daily);
        publish(boardUsers, ownTasks, sessionId, friendships);
        setSignedIn(true);
        setAuthReady(true);
      }
    };
    load().catch((error: unknown) => {
      if (!cancelled) {
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
      commitmentOn,
      pokeNotice,
      toast,
      showToast,
      dismissToast: () => setToast(null),
      dismissPokeNotice: () => setPokeNotice(null),
      setCommitment,
      completeItem: (id, date) => {
        const row = rows.current.get(id);
        const item = items.find((entry) => entry.id === id);
        if (!row || !item || item.kind === "deadline") return;
        const habitDone = item.doneDates.includes(date) || (item.done && item.date === date && item.doneDates.length === 0);
        if (item.kind === "habit" && (date > TODAY || habitDone)) return;
        if (item.kind !== "habit" && item.done) return;
        const baseXp = currentUser?.xp ?? 0;
        const nextXp = baseXp + item.xp;
        const previousLevel = Math.floor(baseXp / XP_PER_LEVEL) + 1;
        const nextLevel = Math.floor(nextXp / XP_PER_LEVEL) + 1;
        const streakUpdate = bumpStreak(currentUser?.streaks, date);
        setItems((current) =>
          current.map((entry) => {
            if (entry.id !== id) return entry;
            if (entry.kind === "habit") {
              if (entry.doneDates.includes(date)) return entry;
              return { ...entry, doneDates: [...entry.doneDates, date] };
            }
            return { ...entry, done: true };
          }),
        );
        if (currentUser) {
          setUsers((current) =>
            current.map((user) => (user.id === currentUser.id ? { ...user, xp: nextXp, streak: streakUpdate.count, streaks: streakUpdate.value } : user)),
          );
          setCompletedCounts((current) => ({ ...current, [currentUser.id]: (current[currentUser.id] ?? 0) + 1 }));
          if (item.date === TODAY) {
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
        if (currentUser) {
          void saveUserProgress(currentUser.id, nextXp, streakUpdate.value).catch((error: unknown) => {
            showToast(error instanceof Error ? error.message : "Could not save XP", "error", "alert");
          });
        }
        if (nextLevel > previousLevel) showToast(`Level ${nextLevel}`, "success", "sparkles");
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
        setItems((current) => [rowToItem(row), ...current]);
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
        setFriends((current) => current.map((entry) => (entry.id === id ? { ...entry, poke: "sent" } : entry)));
        setUsers((current) => current.map((user) => (user.id === currentUser.id ? { ...user, xp: nextXp, streaks } : user)));
        void saveUserProgress(currentUser.id, nextXp, streaks).catch((error: unknown) => {
          showToast(error instanceof Error ? error.message : "Could not save XP", "error", "alert");
        });
        if (helped) setPokeNotice("Your poke helped — +5 XP");
        showToast(helped ? "Your poke helped — +5 XP" : "Poked", "success", "heart");
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
      signInWithGoogle: async () => {
        const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });
        if (error) throw new Error(error.message);
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
  }, [items, friends, requests, outgoing, users, completedCounts, dailyTasks, currentUser, signedIn, authReady, commitmentOn, pokeNotice, toast]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Store missing");
  return store;
}
