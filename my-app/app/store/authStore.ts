/**
 * Auth Store
 * ──────────────────────────────────────────────────────────────────────────────
 * Manages the logged-in user and JWT token.
 * Persisted to localStorage so the session survives page refreshes.
 * skipHydration: true → rehydrate() is called manually in <StoreHydration />
 * so it never runs on the server.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authApi, ApiError } from "../lib/api";
import type { ApiUser } from "../types/api";

export interface AuthState {
  // ── State ──────────────────────────────────────────────────────────────────
  user: ApiUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // ── Actions ────────────────────────────────────────────────────────────────
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  /** Called after an OAuth redirect with the token from the URL query param. */
  loginWithToken: (token: string, user: ApiUser) => void;
  logout: () => void;
  clearError: () => void;
  updateUser: (updates: Partial<ApiUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (identifier, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await authApi.login(identifier, password);
          set({ user, token, isLoading: false });
        } catch (err) {
          set({
            error: err instanceof ApiError ? err.message : "Login failed",
            isLoading: false,
          });
          throw err;
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await authApi.register(username, email, password);
          set({ user, token, isLoading: false });
        } catch (err) {
          set({
            error: err instanceof ApiError ? err.message : "Registration failed",
            isLoading: false,
          });
          throw err;
        }
      },

      loginWithToken: (token, user) => set({ token, user, error: null }),

      logout: () => set({ user: null, token: null, error: null }),

      clearError: () => set({ error: null }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "chat-auth",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)
      ),
      // Only persist what matters — never persist loading/error
      partialize: (state) => ({ user: state.user, token: state.token }),
      skipHydration: true,
    }
  )
);
