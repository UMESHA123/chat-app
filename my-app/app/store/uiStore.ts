/**
 * UI Store
 * ──────────────────────────────────────────────────────────────────────────────
 * Owns purely visual/transient state that does not need persistence:
 *   • Which modal is open
 *   • Whether the "About Group" panel is visible
 *   • Notification badge count
 *   • Mobile sidebar visibility
 *   • Global toast/alert queue
 */

import { create } from "zustand";

export type ModalType = "chat" | "group" | null;

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export interface UIState {
  // ── Modals ──────────────────────────────────────────────────────────────────
  modal: ModalType;
  setModal: (modal: ModalType) => void;

  // ── Group info panel ────────────────────────────────────────────────────────
  aboutGroupOpen: boolean;
  setAboutGroupOpen: (open: boolean) => void;
  toggleAboutGroup: () => void;

  // ── Mobile sidebar ──────────────────────────────────────────────────────────
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // ── Notifications ───────────────────────────────────────────────────────────
  notificationCount: number;
  setNotificationCount: (n: number) => void;
  incrementNotifications: () => void;
  clearNotifications: () => void;

  // ── Toasts ──────────────────────────────────────────────────────────────────
  toasts: Toast[];
  pushToast: (type: Toast["type"], message: string) => void;
  dismissToast: (id: string) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  // ── Modals ──────────────────────────────────────────────────────────────────
  modal: null,
  setModal: (modal) => set({ modal }),

  // ── About group ─────────────────────────────────────────────────────────────
  aboutGroupOpen: false,
  setAboutGroupOpen: (open) => set({ aboutGroupOpen: open }),
  toggleAboutGroup: () => set((s) => ({ aboutGroupOpen: !s.aboutGroupOpen })),

  // ── Mobile sidebar ──────────────────────────────────────────────────────────
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // ── Notifications ────────────────────────────────────────────────────────────
  notificationCount: 0,
  setNotificationCount: (n) => set({ notificationCount: n }),
  incrementNotifications: () => set((s) => ({ notificationCount: s.notificationCount + 1 })),
  clearNotifications: () => set({ notificationCount: 0 }),

  // ── Toasts ───────────────────────────────────────────────────────────────────
  toasts: [],
  pushToast: (type, message) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { id: `${Date.now()}-${Math.random()}`, type, message },
      ],
    })),
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
