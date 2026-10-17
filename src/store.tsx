import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { acceptFriendship, bumpStreak, ensureUser, fetchBoard, fetchFriendships, initialsFor, insertFriendship, insertTask, rowToItem, saveTaskDone, saveUserProgress, toPerson, type AppUser, type FriendshipRow } from "./db";
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

type NewItem = Omit<Item, "id" | "done"> & { description?: string };

type Store = {
  items: Item[];
  totalXp: number;
  streak: number;
  friends: Person[];
  requests: Person[];
  outgoing: string[];
  users: AppUser[];
  completedCounts: Record<string, number>;
  currentUser: AppUser | null;
  signedIn: boolean;
  authReady: boolean;
  commitmentOn: boolean;
  toast: ToastMessage | null;
  completeItem: (id: string) => void;
  addItem: (item: NewItem) => Promise<void>;
  acceptRequest: (id: string) => void;
  sendRequest: (id: string) => Promise<void>;
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
  const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [friends, setFriends] = useState<Person[]>([]);
  const [requests, setRequests] = useState<Person[]>([]);
  const [outgoing, setOutgoing] = useState<string[]>([]);
  const [commitmentOn, setCommitment] = useState(false);
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
    setFriends(boardUsers.filter((user) => friendIds.has(user.id)).map(toPerson));
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
      const counts: Record<string, number> = {};
      for (const task of board.tasks) {
        if (!rowToItem(task).done) continue;
        counts[task.user_id] = (counts[task.user_id] ?? 0) + 1;
      }
      const friendships = await fetchFriendships().catch(() => []);
      if (!cancelled) {
        setCompletedCounts(counts);
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
      outgoing,
      users,
      completedCounts,
      currentUser,
      signedIn,
      authReady,
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
          setCompletedCounts((current) => ({ ...current, [currentUser.id]: (current[currentUser.id] ?? 0) + 1 }));
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
        setCompletedCounts({});
        publish([], [], null);
        setSignedIn(false);
        showToast("Signed out");
      },
    };
  }, [items, friends, requests, outgoing, users, completedCounts, currentUser, signedIn, authReady, commitmentOn, toast]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Store missing");
  return store;
}
