"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";
import CreateChatModal from "../components/CreateChatModal";
import CreateGroupModal from "../components/CreateGroupModal";
import AboutGroupPanel from "../components/AboutGroupPanel";
import { useAuthStore } from "../store/authStore";
import { useConversationStore } from "../store/conversationStore";
import { useUIStore } from "../store/uiStore";
import { useSocket } from "../hooks/useSocket";
import { useNotificationStore } from "../store/notificationStore";

export default function InboxPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const { fetchConversations, getConversationsSorted, selectedId, byId } = useConversationStore();
  const { modal, setModal, aboutGroupOpen } = useUIStore();
  const { fetchNotifications } = useNotificationStore();
  useSocket();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (token) fetchNotifications(token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  useEffect(() => {
    if (token) fetchConversations(token);
  }, [token, fetchConversations]);

  const conversations = getConversationsSorted();
  const selectedConv = selectedId ? byId[selectedId] : null;

  // On mobile: show sidebar OR chat, never both
  // On desktop: show both side by side
  const showSidebar = !isMobile || !selectedConv;
  const showChat = !isMobile || !!selectedConv;

  if (!token || !user) return null;

  return (
    <div className="h-screen flex flex-col bg-[#111111] overflow-hidden">
      <Navbar isMobile={isMobile} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {conversations.length === 0 ? (
          /* ── Empty inbox ── */
          <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center px-6">
            <svg
              width="72" height="72" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.2"
              strokeLinecap="round" strokeLinejoin="round"
              className="text-white/30"
            >
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>

            <div>
              <h2 className="text-3xl font-extrabold text-white leading-tight mb-2">
                No chats yet
              </h2>
              <p className="text-gray-500 text-sm max-w-[240px] mx-auto leading-relaxed">
                Start a conversation with your contacts
              </p>
            </div>

            <button
              onClick={() => setModal("chat")}
              className="btn-primary text-sm px-6 py-3"
            >
              <PlusCircle size={17} />
              Create a chat
            </button>
          </div>
        ) : (
          /* ── Inbox with conversations ── */
          <>
            {/* Sidebar */}
            {showSidebar && (
              <div
                style={{ width: isMobile ? "100%" : "320px" }}
                className="shrink-0 flex flex-col"
              >
                <ChatSidebar />
              </div>
            )}

            {/* Chat area */}
            {showChat && (
              <div className="flex flex-1 min-w-0">
                {selectedConv ? (
                  <>
                    <ChatWindow conv={selectedConv} isMobile={isMobile} />
                    {aboutGroupOpen && selectedConv.type === "group" && (
                      <AboutGroupPanel conv={selectedConv} isMobile={isMobile} />
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-3">
                    <svg
                      width="52" height="52" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.2"
                      strokeLinecap="round" strokeLinejoin="round"
                      className="text-white/15"
                    >
                      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                    </svg>
                    <p className="text-gray-600 text-sm">Select a conversation to start chatting</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {modal === "chat" && <CreateChatModal />}
      {modal === "group" && <CreateGroupModal />}
    </div>
  );
}
