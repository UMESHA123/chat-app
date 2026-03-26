/**
 * Central re-export for all Zustand stores.
 * Import from here instead of from individual store files to keep import
 * paths short and to make it easy to add cross-store logic in the future.
 */

export { useAuthStore } from "./authStore";
export type { AuthState } from "./authStore";

export { useConversationStore } from "./conversationStore";
export type { ConversationState } from "./conversationStore";

export { useUIStore } from "./uiStore";
export type { UIState, ModalType, Toast } from "./uiStore";

export { useUserStore } from "./userStore";
export type { UserState } from "./userStore";
