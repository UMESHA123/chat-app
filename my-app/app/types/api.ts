// ── Matches the backend Mongoose schemas exactly ──────────────────────────────

export interface ApiUser {
  _id: string;
  username: string;
  email: string;
  avatar: string | null;
  isOnline: boolean;
  lastSeen?: string;
  createdAt?: string;
}

export interface ApiParticipant {
  user: ApiUser;
  role: "admin" | "member";
  joinedAt: string;
}

export interface ApiAttachment {
  url: string;
  type: "image" | "video" | "file";
  filename?: string;
  size?: number;
  width?: number;
  height?: number;
  format?: string;
}

export interface ApiReadReceipt {
  user: string;
  readAt: string;
}

export interface ApiMessage {
  _id: string;
  conversation: string;
  sender: ApiUser;
  content: string;
  attachments: ApiAttachment[];
  readBy: ApiReadReceipt[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiConversation {
  _id: string;
  type: "direct" | "group";
  name?: string;
  groupAvatar?: string | null;
  participants: ApiParticipant[];
  lastMessage?: ApiMessage | null;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiNotification {
  _id: string;
  recipient: string;
  type: "new_message" | "group_invite" | "group_removed";
  conversation?: { _id: string; type: string; name?: string } | null;
  message?: ApiMessage | null;
  preview: string;
  isRead: boolean;
  createdAt: string;
}

// ── Auth response payloads ─────────────────────────────────────────────────────
export interface AuthResponse {
  token: string;
  user: ApiUser;
}
