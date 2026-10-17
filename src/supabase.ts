import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://dhqkgwohhnddwafcugrp.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRocWtnd29oaG5kZHdhZmN1Z3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNzM5NTgsImV4cCI6MjEwNzc0OTk1OH0.ZU2CPWdqPySn3y_ep5IbYDCDo9ebXzjiW3Eky4xYBOc";

const memory = new Map<string, string>();

const storage = {
  getItem: (key: string) => {
    if (typeof localStorage !== "undefined") return Promise.resolve(localStorage.getItem(key));
    return Promise.resolve(memory.get(key) ?? null);
  },
  setItem: (key: string, value: string) => {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    else memory.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof localStorage !== "undefined") localStorage.removeItem(key);
    else memory.delete(key);
    return Promise.resolve();
  },
};

const globalStore = globalThis as typeof globalThis & { __habitSupabase?: SupabaseClient };

export const supabase =
  globalStore.__habitSupabase ??
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
  });

globalStore.__habitSupabase = supabase;
