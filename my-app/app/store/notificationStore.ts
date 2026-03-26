import { create } from "zustand";
import { notificationApi } from "../lib/api";
import type { ApiNotification } from "../types/api";

export interface NotificationState {
  notifications: ApiNotification[];
  isLoading: boolean;
  unreadCount: number;

  fetchNotifications: (token: string) => Promise<void>;
  addNotification: (n: ApiNotification) => void;
  markRead: (token: string, id: string) => Promise<void>;
  markAllRead: (token: string) => Promise<void>;
  markReadByConversation: (token: string, conversationId: string) => Promise<void>;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  isLoading: false,
  unreadCount: 0,

  fetchNotifications: async (token) => {
    set({ isLoading: true });
    try {
      const notifications = await notificationApi.list(token);
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + (n.isRead ? 0 : 1),
    })),

  markRead: async (token, id) => {
    const n = get().notifications.find((x) => x._id === id);
    if (!n || n.isRead) return;
    try {
      await notificationApi.markRead(token, id);
      set((state) => ({
        notifications: state.notifications.map((x) =>
          x._id === id ? { ...x, isRead: true } : x
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // silently ignore — badge will re-sync on next fetch
    }
  },

  markAllRead: async (token) => {
    try {
      await notificationApi.markAllRead(token);
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {
      // silently ignore
    }
  },

  markReadByConversation: async (token, conversationId) => {
    const unread = get().notifications.filter(
      (n) => !n.isRead && n.conversation?._id === conversationId
    );
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map((n) => notificationApi.markRead(token, n._id)));
      set((state) => ({
        notifications: state.notifications.map((n) =>
          !n.isRead && n.conversation?._id === conversationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - unread.length),
      }));
    } catch {
      // silently ignore
    }
  },

  reset: () => set({ notifications: [], isLoading: false, unreadCount: 0 }),
}));
