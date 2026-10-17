import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { STARTING_XP, XP_PER_LEVEL, sampleFriends, sampleItems, sampleRequests } from "./sample";
import type { Item, Person, ToastMessage } from "./types";

type Store = {
  items: Item[];
  totalXp: number;
  streak: number;
  friends: Person[];
  requests: Person[];
  commitmentOn: boolean;
  toast: ToastMessage | null;
  completeItem: (id: string) => void;
  addItem: (item: Omit<Item, "id" | "done">) => void;
  acceptRequest: (id: string) => void;
  poke: (id: string) => void;
  setCommitment: (on: boolean) => void;
  showToast: (text: string, tone?: ToastMessage["tone"], icon?: ToastMessage["icon"]) => void;
  dismissToast: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState(sampleItems);
  const [totalXp, setTotalXp] = useState(STARTING_XP);
  const [friends, setFriends] = useState(sampleFriends);
  const [requests, setRequests] = useState(sampleRequests);
  const [commitmentOn, setCommitment] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const api = useMemo<Store>(() => {
    const showToast: Store["showToast"] = (text, tone = "success", icon = "check") => {
      setToast({ id: Date.now(), text, tone, icon });
    };

    return {
      items,
      totalXp,
      streak: 6,
      friends,
      requests,
      commitmentOn,
      toast,
      showToast,
      dismissToast: () => setToast(null),
      setCommitment,
      completeItem: (id) => {
        const item = items.find((entry) => entry.id === id);
        if (!item || item.done || item.kind === "deadline") return;
        const nextXp = totalXp + item.xp;
        const previousLevel = Math.floor(totalXp / XP_PER_LEVEL) + 1;
        const nextLevel = Math.floor(nextXp / XP_PER_LEVEL) + 1;
        setItems((current) => current.map((entry) => (entry.id === id ? { ...entry, done: true } : entry)));
        setTotalXp(nextXp);
        if (nextLevel > previousLevel) showToast(`Level ${nextLevel}`, "success", "sparkles");
        else showToast(`Task completed · +${item.xp} XP`);
      },
      addItem: (item) => {
        setItems((current) => [{ ...item, id: `${item.title}-${item.date}-${current.length}`, done: false }, ...current]);
      },
      acceptRequest: (id) => {
        const person = requests.find((entry) => entry.id === id);
        if (!person) return;
        setRequests((current) => current.filter((entry) => entry.id !== id));
        setFriends((current) => [...current, { ...person, meta: "Not started", poke: "poke" }]);
      },
      poke: (id) => {
        const person = friends.find((entry) => entry.id === id);
        if (!person || person.poke !== "poke") return;
        setFriends((current) => current.map((entry) => (entry.id === id ? { ...entry, poke: "sent", meta: entry.meta.includes("poked") ? entry.meta : `${entry.meta} · poked today` } : entry)));
        setTotalXp((current) => current + 5);
        showToast("Your poke helped — +5 XP", "success", "heart");
      },
    };
  }, [items, totalXp, friends, requests, commitmentOn, toast]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Store missing");
  return store;
}
