/**
 * Conversation Store
 * ──────────────────────────────────────────────────────────────────────────────
 * Owns the conversations list and per-conversation message cache.
 *
 * Cache strategy
 *   • Conversations are re-fetched only when `hasLoaded` is false or the caller
 *     explicitly forces a refresh.
 *   • Messages are stored per conversation with page tracking and a 5-minute
 *     stale TTL — re-fetched on demand.
 */

import { create } from "zustand";
import { conversationApi, messageApi, ApiError } from "../lib/api";
import type { ApiConversation, ApiMessage } from "../types/api";

// ── Message cache entry per conversation ──────────────────────────────────────
interface MessageEntry {
  messages: ApiMessage[];
  isLoading: boolean;
  hasLoaded: boolean;
  oldestCursor: string | undefined; // ISO timestamp of oldest loaded message
  hasMore: boolean;
  fetchedAt: number; // epoch ms — used for staleness check
}

const STALE_MS = 5 * 60 * 1_000; // 5 minutes

function emptyEntry(): MessageEntry {
  return { messages: [], isLoading: false, hasLoaded: false, oldestCursor: undefined, hasMore: true, fetchedAt: 0 };
}

// ── Store shape ───────────────────────────────────────────────────────────────
export interface ConversationState {
  // Conversations indexed by _id for O(1) lookup; allIds keeps insertion order
  byId: Record<string, ApiConversation>;
  allIds: string[];
  selectedId: string | null;
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;

  // Per-conversation message cache
  messageCache: Record<string, MessageEntry>;

  // ── Conversation actions ────────────────────────────────────────────────────
  fetchConversations: (token: string, force?: boolean) => Promise<void>;
  selectConversation: (id: string | null) => void;
  addConversation: (conv: ApiConversation) => void;
  upsertConversation: (conv: ApiConversation) => void;
  removeConversation: (id: string) => void;
  leaveConversation: (token: string, id: string) => Promise<void>;

  // ── Message actions ─────────────────────────────────────────────────────────
  fetchMessages: (token: string, conversationId: string, force?: boolean) => Promise<void>;
  fetchMoreMessages: (token: string, conversationId: string) => Promise<void>;
  addMessage: (conversationId: string, message: ApiMessage) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  markMessagesRead: (conversationId: string, userId: string) => void;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  getMessages: (conversationId: string) => ApiMessage[];
  getConversationsSorted: () => ApiConversation[];
  reset: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────
export const useConversationStore = create<ConversationState>()((set, get) => ({
  byId: {},
  allIds: [],
  selectedId: null,
  isLoading: false,
  hasLoaded: false,
  error: null,
  messageCache: {},

  // ── Fetch all conversations ─────────────────────────────────────────────────
  fetchConversations: async (token, force = false) => {
    const { hasLoaded, isLoading } = get();
    if ((hasLoaded && !force) || isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const convs = await conversationApi.list(token);
      const byId: Record<string, ApiConversation> = {};
      const allIds: string[] = [];
      // Sort newest activity first
      convs
        .slice()
        .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
        .forEach((c) => { byId[c._id] = c; allIds.push(c._id); });
      set({ byId, allIds, isLoading: false, hasLoaded: true });
    } catch (err) {
      set({
        error: err instanceof ApiError ? err.message : "Failed to load conversations",
        isLoading: false,
      });
    }
  },

  selectConversation: (id) => set({ selectedId: id }),

  addConversation: (conv) =>
    set((state) => ({
      byId: { ...state.byId, [conv._id]: conv },
      // Put new conversations at the front
      allIds: state.allIds.includes(conv._id)
        ? state.allIds
        : [conv._id, ...state.allIds],
    })),

  upsertConversation: (conv) =>
    set((state) => {
      const exists = state.allIds.includes(conv._id);
      const allIds = exists
        ? state.allIds
        : [conv._id, ...state.allIds];
      return { byId: { ...state.byId, [conv._id]: conv }, allIds };
    }),

  leaveConversation: async (token, id) => {
    await conversationApi.delete(token, id);
    get().removeConversation(id);
  },

  removeConversation: (id) =>
    set((state) => {
      const { [id]: _removed, ...byId } = state.byId;
      const { [id]: _cache, ...messageCache } = state.messageCache;
      return {
        byId,
        allIds: state.allIds.filter((i) => i !== id),
        messageCache,
        selectedId: state.selectedId === id ? null : state.selectedId,
      };
    }),

  // ── Fetch messages (first page) ─────────────────────────────────────────────
  fetchMessages: async (token, conversationId, force = false) => {
    const entry = get().messageCache[conversationId] ?? emptyEntry();
    const isStale = Date.now() - entry.fetchedAt > STALE_MS;

    if ((entry.hasLoaded && !isStale && !force) || entry.isLoading) return;

    set((state) => ({
      messageCache: {
        ...state.messageCache,
        [conversationId]: { ...entry, isLoading: true },
      },
    }));

    try {
      const { data, hasMore } = await messageApi.list(token, conversationId, {});
      set((state) => ({
        messageCache: {
          ...state.messageCache,
          [conversationId]: {
            messages: data,
            isLoading: false,
            hasLoaded: true,
            oldestCursor: data[0]?.createdAt,
            hasMore,
            fetchedAt: Date.now(),
          },
        },
      }));
    } catch {
      set((state) => ({
        messageCache: {
          ...state.messageCache,
          [conversationId]: { ...entry, isLoading: false },
        },
      }));
    }
  },

  // ── Fetch next page of older messages ───────────────────────────────────────
  fetchMoreMessages: async (token, conversationId) => {
    const entry = get().messageCache[conversationId] ?? emptyEntry();
    if (!entry.hasMore || entry.isLoading) return;

    set((state) => ({
      messageCache: {
        ...state.messageCache,
        [conversationId]: { ...entry, isLoading: true },
      },
    }));

    try {
      const { data: older, hasMore } = await messageApi.list(token, conversationId, { before: entry.oldestCursor });
      set((state) => {
        // Re-read from state to avoid stale closure over `entry`
        const current = state.messageCache[conversationId] ?? emptyEntry();
        return {
          messageCache: {
            ...state.messageCache,
            [conversationId]: {
              ...current,
              messages: [...older, ...current.messages],
              isLoading: false,
              oldestCursor: older[0]?.createdAt ?? current.oldestCursor,
              hasMore,
              fetchedAt: Date.now(),
            },
          },
        };
      });
    } catch {
      set((state) => ({
        messageCache: {
          ...state.messageCache,
          [conversationId]: { ...(state.messageCache[conversationId] ?? emptyEntry()), isLoading: false },
        },
      }));
    }
  },

  // ── Append a new outgoing / incoming message ─────────────────────────────────
  addMessage: (conversationId, message) =>
    set((state) => {
      const entry = state.messageCache[conversationId] ?? emptyEntry();
      const conv = state.byId[conversationId];

      return {
        messageCache: {
          ...state.messageCache,
          [conversationId]: {
            ...entry,
            messages: [...entry.messages, message],
          },
        },
        // Bubble the conversation to the top with updated lastMessage
        byId: conv
          ? {
              ...state.byId,
              [conversationId]: {
                ...conv,
                lastMessage: message,
                lastActivityAt: message.createdAt,
              },
            }
          : state.byId,
        allIds: [conversationId, ...state.allIds.filter((id) => id !== conversationId)],
      };
    }),

  markMessagesRead: (conversationId, userId) =>
    set((state) => {
      const entry = state.messageCache[conversationId];
      if (!entry) return {};
      return {
        messageCache: {
          ...state.messageCache,
          [conversationId]: {
            ...entry,
            messages: entry.messages.map((m) => {
              if (m.readBy.some((r) => r.user === userId)) return m;
              return {
                ...m,
                readBy: [...m.readBy, { user: userId, readAt: new Date().toISOString() }],
              };
            }),
          },
        },
      };
    }),

  deleteMessage: (conversationId, messageId) =>
    set((state) => {
      const entry = state.messageCache[conversationId];
      if (!entry) return {};
      return {
        messageCache: {
          ...state.messageCache,
          [conversationId]: {
            ...entry,
            messages: entry.messages.map((m) =>
              m._id === messageId ? { ...m, isDeleted: true, content: "", attachments: [] } : m
            ),
          },
        },
      };
    }),

  // ── Selectors ───────────────────────────────────────────────────────────────
  getMessages: (conversationId) =>
    get().messageCache[conversationId]?.messages ?? [],

  getConversationsSorted: () => {
    const { byId, allIds } = get();
    return allIds.map((id) => byId[id]).filter(Boolean);
  },

  reset: () =>
    set({
      byId: {},
      allIds: [],
      selectedId: null,
      isLoading: false,
      hasLoaded: false,
      error: null,
      messageCache: {},
    }),
}));
