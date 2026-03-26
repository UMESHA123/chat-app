"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, SlidersHorizontal, Check } from "lucide-react";
import Avatar from "./Avatar";
import { useConversationStore } from "../store/conversationStore";
import { useAuthStore } from "../store/authStore";
import { getConvName, getConvColor, getLastMessagePreview, relativeTime } from "../lib/helpers";
import type { ApiConversation } from "../types/api";

type Filter = "all" | "direct" | "group" | "unread";

function ConvItem({
  conv,
  selected,
  currentUserId,
  onSelect,
}: {
  conv: ApiConversation;
  selected: boolean;
  currentUserId: string;
  onSelect: () => void;
}) {
  const name = getConvName(conv, currentUserId);
  const color = getConvColor(conv, currentUserId);
  const partner =
    conv.type === "direct"
      ? conv.participants.find((p) => p.user._id !== currentUserId)?.user
      : null;
  const isOnline = partner?.isOnline ?? false;
  const lastMsg = conv.lastMessage;
  const hasUnread =
    !!lastMsg &&
    !lastMsg.isDeleted &&
    lastMsg.sender._id !== currentUserId &&
    !lastMsg.readBy.some((r) => r.user === currentUserId);

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-colors border-b-2 border-[#1e1e1e] hover:bg-[#1a1a1a] ${
        selected ? "bg-[#1e1e1e] border-l-2 border-l-[#ae7aff]" : "border-l-2 border-l-transparent"
      }`}
    >
      <Avatar name={name} color={color} size={44} showOnline={conv.type === "direct"} isOnline={isOnline} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-bold text-white truncate">{name}</span>
          <span className="text-xs text-gray-500 shrink-0 ml-2">
            {conv.lastActivityAt ? relativeTime(conv.lastActivityAt) : ""}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500 truncate">{getLastMessagePreview(conv)}</p>
          {hasUnread && (
            <span className="bg-[#ae7aff] text-black text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
              •
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  direct: "Direct",
  group: "Groups",
  unread: "Unread",
};

export default function ChatSidebar() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const selectedId = useConversationStore((s) => s.selectedId);
  const selectConversation = useConversationStore((s) => s.selectConversation);
  const allIds = useConversationStore((s) => s.allIds);
  const byId = useConversationStore((s) => s.byId);
  const currentUserId = useAuthStore((s) => s.user?._id ?? "");

  // Only recompute when the list or entries actually change
  const conversations = useMemo(
    () => allIds.map((id) => byId[id]).filter(Boolean) as ApiConversation[],
    [allIds, byId]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setFilterOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = conversations.filter((c) => {
    // Search filter
    if (search && !getConvName(c, currentUserId).toLowerCase().includes(search.toLowerCase()))
      return false;

    // Type / unread filter
    if (filter === "direct") return c.type === "direct";
    if (filter === "group") return c.type === "group";
    if (filter === "unread") {
      const lastMsg = c.lastMessage;
      return (
        !!lastMsg &&
        !lastMsg.isDeleted &&
        lastMsg.sender._id !== currentUserId &&
        !lastMsg.readBy.some((r) => r.user === currentUserId)
      );
    }
    return true;
  });

  return (
    <aside className="flex-1 flex flex-col border-r-2 border-[#4f4e4e] bg-[#111111]">
      {/* Search + Filter */}
      <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-[#4f4e4e]">
        <div className="flex-1 flex items-center gap-2 bg-[#0f0f0f] border-2 border-[#4f4e4e] px-3 py-2">
          <Search size={14} className="text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Search chat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-white placeholder-gray-500 outline-none flex-1"
          />
        </div>

        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className={`p-2 border-2 transition-colors shrink-0 ${
              filter !== "all"
                ? "border-[#ae7aff] text-[#ae7aff] bg-[#ae7aff]/10"
                : "border-[#4f4e4e] text-gray-400 hover:bg-[#1e1e1e] hover:text-white"
            }`}
          >
            <SlidersHorizontal size={15} />
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-[#1a1a1a] border-2 border-[#4f4e4e] z-50 shadow-[3px_3px_0px_0px_#4f4e4e]">
              {(["all", "direct", "group", "unread"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setFilterOpen(false); }}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors border-b border-[#2a2a2a] last:border-0"
                >
                  {FILTER_LABELS[f]}
                  {filter === f && <Check size={13} className="text-[#ae7aff]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active filter label */}
      {filter !== "all" && (
        <div className="flex items-center justify-between px-4 py-1.5 border-b border-[#2a2a2a] bg-[#ae7aff]/5">
          <span className="text-xs text-[#ae7aff] font-bold">{FILTER_LABELS[filter]}</span>
          <button onClick={() => setFilter("all")} className="text-xs text-gray-500 hover:text-white transition-colors">
            Clear
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-600 text-sm mt-10">
            {conversations.length === 0 ? "No conversations yet" : "No results"}
          </p>
        ) : (
          filtered.map((conv) => (
            <ConvItem
              key={conv._id}
              conv={conv}
              selected={conv._id === selectedId}
              currentUserId={currentUserId}
              onSelect={() => selectConversation(conv._id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
