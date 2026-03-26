import type {
  AuthResponse,
  ApiUser,
  ApiConversation,
  ApiMessage,
  ApiNotification,
  ApiAttachment,
} from "../types/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ── Error class ───────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...(extraHeaders as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!headers["Content-Type"] && !(rest.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE}${path}`, { ...rest, headers });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (payload as { message?: string }).message ?? res.statusText);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (identifier: string, password: string) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }),

  register: (username: string, email: string, password: string) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),

  me: (token: string) =>
    request<{ user: ApiUser }>("/api/auth/me", { token }),
};

// ── Conversations ─────────────────────────────────────────────────────────────
export const conversationApi = {
  list: (token: string) =>
    request<ApiConversation[]>("/api/conversations", { token }),

  createDirect: (token: string, userId: string) =>
    request<ApiConversation>("/api/conversations/direct", {
      method: "POST",
      token,
      body: JSON.stringify({ userId }),
    }),

  createGroup: (token: string, name: string, participantIds: string[]) =>
    request<ApiConversation>("/api/conversations/group", {
      method: "POST",
      token,
      body: JSON.stringify({ name, participantIds }),
    }),

  get: (token: string, id: string) =>
    request<ApiConversation>(`/api/conversations/${id}`, { token }),

  addParticipants: (token: string, id: string, userIds: string[]) =>
    request<ApiConversation>(`/api/conversations/${id}/participants`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ userIds }),
    }),

  removeParticipant: (token: string, id: string, userId: string) =>
    request<ApiConversation>(`/api/conversations/${id}/participants/${userId}`, {
      method: "DELETE",
      token,
    }),

  delete: (token: string, id: string) =>
    request<{ success: boolean }>(`/api/conversations/${id}`, {
      method: "DELETE",
      token,
    }),
};

// ── Messages ──────────────────────────────────────────────────────────────────
export const messageApi = {
  list: (token: string, conversationId: string, options: { before?: string; limit?: number } = {}) => {
    const params = new URLSearchParams();
    if (options.before) params.set('before', options.before);
    if (options.limit) params.set('limit', String(options.limit));
    return request<{ data: ApiMessage[]; hasMore: boolean }>(
      `/api/conversations/${conversationId}/messages?${params.toString()}`,
      { token }
    );
  },

  send: (
    token: string,
    conversationId: string,
    content: string,
    attachments: ApiAttachment[] = []
  ) =>
    request<ApiMessage>(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      token,
      body: JSON.stringify({ content, attachments }),
    }),

  markRead: (token: string, messageId: string) =>
    request<{ success: boolean }>(`/api/messages/${messageId}/read`, {
      method: "PATCH",
      token,
    }),

  delete: (token: string, messageId: string) =>
    request<{ success: boolean }>(`/api/messages/${messageId}`, {
      method: "DELETE",
      token,
    }),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const userApi = {
  search: (token: string, q = "") =>
    request<ApiUser[]>(`/api/users?q=${encodeURIComponent(q)}`, { token }),

  getById: (token: string, id: string) =>
    request<ApiUser>(`/api/users/${id}`, { token }),

  updateProfile: (token: string, updates: Partial<Pick<ApiUser, "username" | "avatar">>) =>
    request<ApiUser>("/api/users/me", {
      method: "PATCH",
      token,
      body: JSON.stringify(updates),
    }),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationApi = {
  list: (token: string) =>
    request<ApiNotification[]>("/api/notifications", { token }),

  markRead: (token: string, id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: "PATCH",
      token,
    }),

  markAllRead: (token: string) =>
    request<{ success: boolean }>("/api/notifications/read-all", {
      method: "PATCH",
      token,
    }),
};

// ── Upload ────────────────────────────────────────────────────────────────────
export const uploadApi = {
  upload: async (token: string, files: File[]): Promise<{ files: ApiAttachment[] }> => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    return request<{ files: ApiAttachment[] }>("/api/upload", {
      method: "POST",
      token,
      body: formData,
    });
  },

  delete: (token: string, publicId: string) =>
    request<{ success: boolean }>(`/api/upload/${publicId}`, {
      method: "DELETE",
      token,
    }),
};
