import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { TODAY } from "./dates";
import { bumpStreak, ensureUser, fetchBoard, fetchFriendships, initialsFor, insertTask, rowToItem, saveTaskDone, saveUserProgress, toPerson, type AppUser, type FriendshipRow } from "./db";
import { XP_PER_LEVEL } from "./sample";
import { supabase } from "./supabase";
import type { Item, Person, ToastMessage } from "./types";

const PROBE_USER = "00000000-0000-0000-0000-000000000099";
let signupName: string | null = null;

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
  users: AppUser[];
  currentUser: AppUser | null;
  signedIn: boolean;
  authReady: boolean;
  commitmentOn: boolean;
  toast: ToastMessage | null;
  completeItem: (id: string, date: string) => void;
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
      users,
      currentUser,
      signedIn,
      authReady,
      commitmentOn,
      toast,
      showToast,
      dismissToast: () => setToast(null),
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
        publish([], [], null);
        setSignedIn(false);
        showToast("Signed out");
      },
    };
  }, [items, friends, requests, users, currentUser, signedIn, authReady, commitmentOn, toast]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Store missing");
  return store;
}
