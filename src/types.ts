export enum Category {
  Study = "study",
  Fitness = "fitness",
  Hygiene = "hygiene",
  Work = "work",
  Personal = "personal",
  Other = "other",
}
export type ItemKind = "goal" | "habit" | "deadline";
export type PokeState = "poke" | "sent" | "off";

export type Item = {
  id: string;
  title: string;
  kind: ItemKind;
  category: Category;
  xp: number;
  money: boolean;
  date: string;
  done: boolean;
};

export type Person = {
  id: string;
  name: string;
  initials: string;
  icon: string | null;
  color: string;
  meta: string;
  poke: PokeState;
};

export type ToastMessage = {
  id: number;
  text: string;
  tone: "success" | "error";
  icon: "check" | "sparkles" | "heart" | "alert";
};
