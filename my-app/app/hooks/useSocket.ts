"use client";

import { useEffect } from "react";
import { connectSocket, disconnectSocket } from "../lib/socket";
import { useAuthStore } from "../store/authStore";
import { useConversationStore } from "../store/conversationStore";
import { useNotificationStore } from "../store/notificationStore";
import type { ApiMessage, ApiNotification } from "../types/api";

export function useSocket() {
  const { token } = useAuthStore();
  const { addMessage, markMessagesRead } = useConversationStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);

    socket.on("connect", () => {
      console.log("[socket] connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("[socket] connect error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.warn("[socket] disconnected:", reason);
    });

    socket.on("message:receive", (msg: ApiMessage) => {
      addMessage(msg.conversation as string, msg);
    });

    socket.on("notification:new", (notification: ApiNotification) => {
      addNotification(notification);
    });

    socket.on("messages:read", ({ userId, conversationId }: { userId: string; conversationId: string }) => {
      markMessagesRead(conversationId, userId);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("message:receive");
      socket.off("notification:new");
      socket.off("messages:read");
    };
  }, [token, addMessage, addNotification, markMessagesRead]);

  // Disconnect when user logs out
  useEffect(() => {
    if (!token) disconnectSocket();
  }, [token]);
}
