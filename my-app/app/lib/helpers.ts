import type { ApiConversation, ApiUser } from "../types/api";

// ── Avatar color ───────────────────────────────────────────────────────────────
const PALETTE = [
  "#7c3aed", "#2563eb", "#059669", "#d97706",
  "#dc2626", "#db2777", "#0891b2", "#6d28d9",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

// ── Conversation display helpers ───────────────────────────────────────────────

/** Returns the display name for a conversation. */
export function getConvName(conv: ApiConversation, currentUserId: string): string {
  if (conv.type === "group") return conv.name ?? "Group Chat";
  const partner = getConvPartner(conv, currentUserId);
  return partner?.username ?? "Unknown";
}

/** Returns the other participant in a direct conversation. */
export function getConvPartner(conv: ApiConversation, currentUserId: string): ApiUser | null {
  if (conv.type !== "direct") return null;
  return conv.participants.find((p) => p.user._id !== currentUserId)?.user ?? null;
}

/** Returns the avatar color for a conversation. */
export function getConvColor(conv: ApiConversation, currentUserId: string): string {
  if (conv.type === "group") return "#7c3aed";
  const partner = getConvPartner(conv, currentUserId);
  return partner ? getAvatarColor(partner.username) : "#6b7280";
}

/** Returns the last message preview string. */
export function getLastMessagePreview(conv: ApiConversation): string {
  const msg = conv.lastMessage;
  if (!msg) return "No messages yet";
  if (msg.isDeleted) return "Message deleted";
  if (msg.content) return msg.content;
  if (msg.attachments?.length) {
    const hasImage = msg.attachments.some((a) => a.type === "image");
    return hasImage ? "📷 Photo" : "📎 Attachment";
  }
  return "";
}

/** Formats a date string to a relative time label (e.g., "2 hours ago"). */
export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/** Formats a date string as a short time (e.g., "10:32 AM"). */
export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
