/**
 * User Store
 * ──────────────────────────────────────────────────────────────────────────────
 * Caches the user-search results used by the "Create Chat" / "Create Group"
 * dropdowns.  Results are kept for STALE_MS before a fresh fetch is triggered.
 */

import { create } from "zustand";
import { userApi, ApiError } from "../lib/api";
import type { ApiUser } from "../types/api";

const STALE_MS = 2 * 60 * 1_000; // 2 minutes

export interface UserState {
  // ── All users (initial / search="" load) ───────────────────────────────────
  users: ApiUser[];
  isLoading: boolean;
  error: string | null;
  fetchedAt: number;

  // ── Search ──────────────────────────────────────────────────────────────────
  query: string;
  results: ApiUser[];
  isSearching: boolean;

  // ── Actions ─────────────────────────────────────────────────────────────────
  /** Load all users (with optional force refresh). */
  fetchUsers: (token: string, force?: boolean) => Promise<void>;
  /** Search users by query string (debounced by the caller). */
  searchUsers: (token: string, q: string) => Promise<void>;
  clearSearch: () => void;
}

export const useUserStore = create<UserState>()((set, get) => ({
  users: [],
  isLoading: false,
  error: null,
  fetchedAt: 0,

  query: "",
  results: [],
  isSearching: false,

  fetchUsers: async (token, force = false) => {
    const { isLoading, fetchedAt } = get();
    const isStale = Date.now() - fetchedAt > STALE_MS;
    if ((!isStale && !force) || isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const users = await userApi.search(token, "");
      console.log("[userStore] fetchUsers success →", users.length, "users");
      set({ users, isLoading: false, fetchedAt: Date.now() });
    } catch (err) {
      const msg = err instanceof ApiError
        ? `${err.status}: ${err.message}`
        : err instanceof Error
          ? err.message
          : "Failed to load users";
      console.error("[userStore] fetchUsers error →", err);
      set({ error: msg, isLoading: false });
    }
  },

  searchUsers: async (token, q) => {
    set({ query: q, isSearching: true });
    try {
      const results = await userApi.search(token, q);
      // Only update if the query hasn't changed mid-flight
      if (get().query === q) {
        set({ results, isSearching: false });
      }
    } catch {
      set({ isSearching: false });
    }
  },

  clearSearch: () => set({ query: "", results: [], isSearching: false }),
}));
