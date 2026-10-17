import { Category, type Item, type Person } from "./types";

export const XP_PER_LEVEL = 500;
export const PENALTY_FT = 800;
export const STARTING_XP = 5680;

export const sampleItems: Item[] = [
  { id: "project-report", title: "Project report", kind: "goal", category: Category.Work, xp: 50, money: true, date: "2026-10-16", done: false },
  { id: "clean-room", title: "Clean room", kind: "goal", category: Category.Other, xp: 20, money: true, date: "2026-10-16", done: true },
  { id: "meditate-16", title: "Meditate", kind: "habit", category: Category.Personal, xp: 15, money: true, date: "2026-10-16", done: false },
  { id: "water-16", title: "Drink water", kind: "habit", category: Category.Hygiene, xp: 10, money: true, date: "2026-10-16", done: true },
  { id: "essay", title: "Submit essay", kind: "deadline", category: Category.Study, xp: 0, money: false, date: "2026-10-16", done: false },
  { id: "study-group", title: "Study group", kind: "goal", category: Category.Study, xp: 25, money: true, date: "2026-10-17", done: false },
  { id: "clean-slides", title: "Clean slides", kind: "goal", category: Category.Work, xp: 20, money: true, date: "2026-10-17", done: false },
  { id: "water-17", title: "Drink water", kind: "habit", category: Category.Hygiene, xp: 10, money: true, date: "2026-10-17", done: false },
  { id: "workout-17", title: "Workout", kind: "habit", category: Category.Fitness, xp: 30, money: true, date: "2026-10-17", done: false },
  { id: "mentor", title: "Call mentor", kind: "goal", category: Category.Personal, xp: 15, money: true, date: "2026-10-18", done: false },
  { id: "workout-20", title: "Workout", kind: "habit", category: Category.Fitness, xp: 30, money: true, date: "2026-10-20", done: false },
  { id: "meditate-20", title: "Meditate", kind: "habit", category: Category.Personal, xp: 15, money: true, date: "2026-10-20", done: false },
  { id: "exam", title: "Algorithm exam", kind: "deadline", category: Category.Study, xp: 0, money: false, date: "2026-10-22", done: false },
];

export const habitDots = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31"];

export const taskDots = ["2026-10-14", "2026-10-16", "2026-10-22", "2026-10-28"];

export const sampleRequests: Person[] = [
  { id: "jordan", name: "Jordan", initials: "JO", icon: null, color: "#FF6BB5", meta: "Wants to connect", poke: "poke" },
];

export const sampleFriends: Person[] = [
  { id: "alex", name: "Alex", initials: "AL", icon: null, color: "#B6FF70", meta: "Done today", poke: "off" },
  { id: "maya", name: "Maya", initials: "MA", icon: null, color: "#FF9F43", meta: "2 left today", poke: "poke" },
  { id: "sam", name: "Sam", initials: "SA", icon: null, color: "#5EE0FF", meta: "5 left · poked today", poke: "sent" },
];

export const rankings = [
  { rank: 1, name: "Maya", initials: "MA", color: "#FF9F43", streak: 28, you: false },
  { rank: 2, name: "Alex", initials: "AL", color: "#B6FF70", streak: 24, you: false },
  { rank: 3, name: "You", initials: "MK", color: "#B6FF70", streak: 6, you: true },
  { rank: 4, name: "Sam", initials: "SA", color: "#5EE0FF", streak: 4, you: false },
  { rank: 5, name: "Jordan", initials: "JO", color: "#FF6BB5", streak: 2, you: false },
];
