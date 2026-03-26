"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, Search } from "lucide-react";
import Avatar from "./Avatar";
import { useAuthStore } from "../store/authStore";
import { useUserStore } from "../store/userStore";
import { useConversationStore } from "../store/conversationStore";
import { useUIStore } from "../store/uiStore";
import { conversationApi } from "../lib/api";
import { getAvatarColor } from "../lib/helpers";
import type { ApiUser } from "../types/api";

export default function CreateGroupModal() {
  const { token } = useAuthStore();
  const { users, isLoading, fetchUsers, searchUsers, results, query } = useUserStore();
  const { addConversation, selectConversation } = useConversationStore();
  const { setModal, pushToast } = useUIStore();

  const [groupName, setGroupName] = useState("");
  const [participants, setParticipants] = useState<ApiUser[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (token) fetchUsers(token, true);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (q: string) => {
    setSearch(q);
    if (token) searchUsers(token, q);
  };

  const addParticipant = (user: ApiUser) => {
    if (!participants.find((p) => p._id === user._id)) {
      setParticipants((prev) => [...prev, user]);
    }
    setDropdownOpen(false);
    setSearch("");
  };

  const removeParticipant = (id: string) =>
    setParticipants((prev) => prev.filter((p) => p._id !== id));

  const displayList = (search ? results : users).filter(
    (u) => !participants.find((p) => p._id === u._id)
  );

  const handleCreate = async () => {
    if (!groupName.trim() || participants.length < 1 || !token) return;
    setCreating(true);
    try {
      const conv = await conversationApi.createGroup(token, groupName.trim(), participants.map((p) => p._id));
      addConversation(conv);
      selectConversation(conv._id);
      setModal(null);
    } catch {
      pushToast("error", "Could not create group. Try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="neo-card w-full max-w-[520px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#4f4e4e]">
          <h2 className="text-white font-bold text-base">Create a Group</h2>
          <button
            onClick={() => setModal(null)}
            className="text-gray-400 hover:text-white border-2 border-transparent hover:border-[#4f4e4e] p-0.5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Group name</label>
            <input
              type="text"
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="neo-input"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Select a user</label>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#0f0f0f] border-2 border-[#4f4e4e] text-sm text-gray-400 shadow-[3px_3px_0px_0px_#4f4e4e] hover:bg-[#1a1a1a] transition-all active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
              >
                <span>{displayList[0]?.username ?? "No more users"}</span>
                <ChevronDown size={15} className="shrink-0" />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border-2 border-[#4f4e4e] z-10">
                  <div className="flex items-center gap-2 px-3 py-2 border-b-2 border-[#4f4e4e]">
                    <Search size={13} className="text-gray-500 shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search users…"
                      value={search}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="bg-transparent text-sm text-white placeholder-gray-600 outline-none flex-1"
                    />
                  </div>
                  <div className="max-h-44 overflow-y-auto">
                    {isLoading ? (
                      <p className="text-center text-gray-500 text-xs py-4">Loading…</p>
                    ) : displayList.length === 0 ? (
                      <p className="text-center text-gray-500 text-xs py-4">No users found</p>
                    ) : (
                      displayList.map((u) => (
                        <button
                          key={u._id}
                          onClick={() => addParticipant(u)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors border-b border-[#2a2a2a] last:border-0"
                        >
                          <Avatar name={u.username} color={getAvatarColor(u.username)} size={28} />
                          <div className="text-left">
                            <p className="font-bold">{u.username}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Participant chips */}
          {participants.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Added participants</label>
              <div className="flex flex-wrap gap-2">
                {participants.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#0f0f0f] border-2 border-[#4f4e4e] text-sm text-white"
                  >
                    <Avatar name={u.username} color={getAvatarColor(u.username)} size={20} />
                    <span className="font-medium">{u.username}</span>
                    <button
                      onClick={() => removeParticipant(u._id)}
                      className="text-gray-500 hover:text-[#ff4d4d] transition-colors ml-0.5"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={() => setModal(null)} className="btn-danger flex-1 py-3 text-sm">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || participants.length === 0 || creating}
            className="btn-primary flex-1 py-3 text-sm"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
