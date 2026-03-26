"use client";

import { X, UserMinus } from "lucide-react";
import Avatar from "./Avatar";
import { useUIStore } from "../store/uiStore";
import { useAuthStore } from "../store/authStore";
import { useConversationStore } from "../store/conversationStore";
import { conversationApi } from "../lib/api";
import { getAvatarColor } from "../lib/helpers";
import type { ApiConversation } from "../types/api";

export default function AboutGroupPanel({ conv }: { conv: ApiConversation }) {
  const setAboutGroupOpen = useUIStore((s) => s.setAboutGroupOpen);
  const { user, token } = useAuthStore();
  const upsertConversation = useConversationStore((s) => s.upsertConversation);
  const currentUserId = user?._id ?? "";

  const currentParticipant = conv.participants.find((p) => p.user._id === currentUserId);
  const isAdmin = currentParticipant?.role === "admin";

  const handleRemove = async (userId: string) => {
    if (!token) return;
    try {
      const updated = await conversationApi.removeParticipant(token, conv._id, userId);
      if (updated) upsertConversation(updated as ApiConversation);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove participant";
      alert(msg);
    }
  };

  const shownAvatars = conv.participants.slice(0, 3);
  const extra = conv.participants.length - shownAvatars.length;

  return (
    <div className="fixed inset-0 z-40 md:relative md:inset-auto md:z-auto w-full md:w-[440px] md:shrink-0 flex flex-col bg-[#111111] border-l-2 border-[#4f4e4e]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#4f4e4e]">
        <h2 className="text-white font-bold text-base">About Group</h2>
        <button
          onClick={() => setAboutGroupOpen(false)}
          className="text-gray-400 hover:text-white border-2 border-transparent hover:border-[#4f4e4e] p-0.5 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Group info */}
      <div className="px-6 pt-6 pb-5 flex flex-col items-center text-center border-b-2 border-[#4f4e4e]">
        {/* Stacked avatars */}
        <div className="flex items-center justify-center mb-5">
          <div className="flex -space-x-4">
            {shownAvatars.map((p, i) => (
              <div
                key={p.user._id}
                className="ring-2 ring-[#111111]"
                style={{ zIndex: shownAvatars.length - i }}
              >
                <Avatar name={p.user.username} color={getAvatarColor(p.user.username)} size={60} />
              </div>
            ))}
            {extra > 0 && (
              <div
                className="w-[60px] h-[60px] bg-[#2a2a2a] border-2 border-[#4f4e4e] ring-2 ring-[#111111] flex items-center justify-center text-sm font-bold text-gray-300"
                style={{ zIndex: 0 }}
              >
                +{extra}
              </div>
            )}
          </div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-1">{conv.name}</h3>
        <p className="text-sm text-gray-400">{conv.participants.length} Participants</p>
      </div>

      {/* Participants label */}
      <div className="px-6 py-3 border-b-2 border-[#4f4e4e] flex items-center justify-center gap-2 text-gray-400 text-sm font-bold">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
        </svg>
        Group participants
      </div>

      {/* Participant list */}
      <div className="flex-1 overflow-y-auto">
        {conv.participants.map((p) => {
          const { user: member, role } = p;
          return (
            <div
              key={member._id}
              className="flex items-center gap-3 px-6 py-4 border-b-2 border-[#1e1e1e] hover:bg-[#1a1a1a] transition-colors"
            >
              <Avatar
                name={member.username}
                color={getAvatarColor(member.username)}
                size={44}
                showOnline
                isOnline={member.isOnline}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{member.username}</span>
                  {role === "admin" && (
                    <span className="text-[10px] font-bold text-black bg-[#ae7aff] border-2 border-[#4f4e4e] px-1.5 py-0.5">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{member.email}</p>
              </div>
              {isAdmin && member._id !== currentUserId && (
                <button
                  onClick={() => handleRemove(member._id)}
                  title="Remove from group"
                  className="w-8 h-8 bg-[#ff4d4d] border-2 border-[#4f4e4e] flex items-center justify-center hover:opacity-80 transition-opacity shrink-0"
                >
                  <UserMinus size={14} className="text-black" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
