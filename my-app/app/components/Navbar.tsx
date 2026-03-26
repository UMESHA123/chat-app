"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, PlusCircle, Users, MessageSquare, LogOut, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import { useAuthStore } from "../store/authStore";
import { useUIStore } from "../store/uiStore";
import { useConversationStore } from "../store/conversationStore";
import { useNotificationStore } from "../store/notificationStore";
import { getAvatarColor, formatTime } from "../lib/helpers";

export default function Navbar() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const { setModal } = useUIStore();
  const reset = useConversationStore((s) => s.reset);
  const { selectConversation } = useConversationStore();
  const { notifications, unreadCount, markRead, markAllRead, reset: resetNotifications } = useNotificationStore();

  const [notifOpen, setNotifOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = () => {
    logout();
    reset();
    resetNotifications();
    router.push("/login");
  };

  const handleNotifClick = (notifId: string, conversationId?: string) => {
    if (token) markRead(token, notifId);
    if (conversationId) {
      selectConversation(conversationId);
      setNotifOpen(false);
    }
  };

  const handleMarkAllRead = () => {
    if (token) markAllRead(token);
  };

  const displayName = user?.username ?? "User";
  const avatarColor = getAvatarColor(displayName);

  return (
    <nav className="flex items-center justify-between px-4 md:px-6 h-[60px] bg-[#111111] border-b-2 border-[#4f4e4e] shrink-0">
      <h1 className="text-xl font-bold text-white tracking-tight">BlinkChat</h1>

      <div className="flex items-center gap-4">
        {/* Bell + notification dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-1.5 hover:bg-white/5 transition-colors"
          >
            <Bell size={20} className="text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#ae7aff] text-black text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-0.5 leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 neo-card z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[#4f4e4e]">
                <span className="text-sm font-bold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1.5 text-xs text-[#ae7aff] font-bold hover:opacity-80 transition-opacity"
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-gray-500 text-xs py-8">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => handleNotifClick(n._id, n.conversation?._id)}
                      className={`w-full text-left px-4 py-3 border-b border-[#2a2a2a] last:border-0 hover:bg-white/5 transition-colors flex gap-3 items-start ${
                        !n.isRead ? "bg-[#ae7aff]/5" : ""
                      }`}
                    >
                      {/* Unread dot */}
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                          !n.isRead ? "bg-[#ae7aff]" : "bg-transparent"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-bold truncate">
                          {n.conversation?.type === "group" && n.conversation.name
                            ? n.conversation.name
                            : "Direct message"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.preview}</p>
                        <p className="text-[10px] text-gray-600 mt-1">{formatTime(n.createdAt)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="border-2 border-transparent hover:border-[#ae7aff] transition-colors"
          >
            <Avatar name={displayName} color={avatarColor} size={34} showOnline isOnline />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 neo-card z-50 overflow-hidden">
              <div className="px-4 py-3 border-b-2 border-[#4f4e4e]">
                <p className="text-sm font-bold text-white truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm text-[#ff4d4d] font-bold hover:bg-white/5 transition-colors"
              >
                <LogOut size={14} />
                Log out
              </button>
            </div>
          )}
        </div>

        {/* Create a chat */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="btn-primary text-sm px-3 py-2 md:px-4"
          >
            <PlusCircle size={16} />
            <span className="hidden sm:inline">Create a chat</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 neo-card z-50 overflow-hidden">
              <button
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-white font-medium hover:bg-white/5 transition-colors border-b-2 border-[#4f4e4e]"
                onClick={() => { setModal("chat"); setDropdownOpen(false); }}
              >
                <MessageSquare size={15} className="text-[#ae7aff]" />
                New Chat
              </button>
              <button
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-white font-medium hover:bg-white/5 transition-colors"
                onClick={() => { setModal("group"); setDropdownOpen(false); }}
              >
                <Users size={15} className="text-[#ae7aff]" />
                Create a Group
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
