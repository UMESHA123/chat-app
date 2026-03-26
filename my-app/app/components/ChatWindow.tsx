"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Share2, MoreVertical, Smile, Paperclip, Send, X, FileText, Loader2, Trash2, LogOut } from "lucide-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });
import Avatar from "./Avatar";
import { useAuthStore } from "../store/authStore";
import { useConversationStore } from "../store/conversationStore";
import { useUIStore } from "../store/uiStore";
import { useNotificationStore } from "../store/notificationStore";
import { uploadApi, messageApi } from "../lib/api";
import { getSocket } from "../lib/socket";
import { getConvName, getConvColor, getConvPartner, getAvatarColor, formatTime } from "../lib/helpers";
import type { ApiConversation, ApiMessage, ApiAttachment } from "../types/api";

/* ── Typing indicator ──────────────────────────────────────────────────────── */
function TypingIndicator({ name, color }: { name: string; color: string }) {
  return (
    <div className="flex items-end gap-2.5 mb-4">
      <Avatar name={name} color={color} size={32} />
      <div>
        <p className="text-xs text-gray-500 mb-1 font-medium">{name}</p>
        <div className="bg-[#1e1e1e] border-2 border-[#2e2e2e] px-4 py-3 flex items-center gap-1.5">
          <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full block" />
          <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full block" />
          <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full block" />
        </div>
      </div>
    </div>
  );
}

/* ── Attachment grid ───────────────────────────────────────────────────────── */
function AttachmentGrid({ attachments }: { attachments: ApiAttachment[] }) {
  const images = attachments.filter((a) => a.type === "image");
  const videos = attachments.filter((a) => a.type === "video");
  const files  = attachments.filter((a) => a.type === "file");
  return (
    <div className="mt-2 space-y-2">
      {images.length > 0 && (
        <div className={`grid gap-1.5 max-w-[300px] ${images.length >= 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={img.url} alt={img.filename ?? "image"}
              className="object-cover w-full border-2 border-[#4f4e4e]" style={{ height: 130 }} />
          ))}
        </div>
      )}
      {videos.map((v, i) => (
        <video key={i} src={v.url} controls
          className="max-w-[300px] w-full border-2 border-[#4f4e4e] bg-black"
          style={{ maxHeight: 200 }} />
      ))}
      {files.map((f, i) => (
        <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 bg-black/30 border-2 border-[#4f4e4e] px-3 py-2 max-w-[260px] hover:bg-black/50 transition-colors">
          <FileText size={16} className="text-gray-400 shrink-0" />
          <span className="text-xs text-gray-300 truncate">{f.filename}</span>
        </a>
      ))}
    </div>
  );
}

/* ── Message bubble ────────────────────────────────────────────────────────── */
function MessageBubble({ msg, conv, currentUserId }: { msg: ApiMessage; conv: ApiConversation; currentUserId: string }) {
  const isMe = msg.sender._id === currentUserId;
  const senderName = msg.sender.username;
  const senderColor = getAvatarColor(senderName);
  const hasAttachments = msg.attachments?.length > 0;

  if (isMe) {
    return (
      <div className="flex flex-col items-end mb-4">
        <div className="flex items-end gap-2.5">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs text-gray-400 font-bold">{senderName}</span>
              <span className="text-xs text-gray-600">{formatTime(msg.createdAt)}</span>
            </div>
            {!msg.isDeleted && msg.content && (
              <div className="bg-[#ae7aff] text-black px-4 py-2.5 border-2 border-[#4f4e4e] text-sm max-w-[420px] leading-relaxed font-medium">
                {msg.content}
              </div>
            )}
            {msg.isDeleted && <div className="text-xs text-gray-600 italic px-4 py-2">Message deleted</div>}
            {hasAttachments && !msg.isDeleted && <AttachmentGrid attachments={msg.attachments} />}
          </div>
          <Avatar name={senderName} color={senderColor} size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2.5 mb-4">
      <Avatar name={senderName} color={senderColor} size={32} />
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs text-gray-400 font-bold">{senderName}</span>
          <span className="text-xs text-gray-600">{formatTime(msg.createdAt)}</span>
        </div>
        {!msg.isDeleted && msg.content && (
          <div className="bg-[#1e1e1e] text-white px-4 py-2.5 border-2 border-[#2e2e2e] text-sm max-w-[420px] leading-relaxed">
            {msg.content}
          </div>
        )}
        {msg.isDeleted && <div className="text-xs text-gray-600 italic px-4 py-2">Message deleted</div>}
        {hasAttachments && !msg.isDeleted && <AttachmentGrid attachments={msg.attachments} />}
      </div>
    </div>
  );
}

/* ── File chip preview ─────────────────────────────────────────────────────── */
function FileChip({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith("image/");
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  return (
    <div className="relative group shrink-0">
      {isImage && preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={file.name} className="w-16 h-16 object-cover border-2 border-[#4f4e4e]" />
      ) : (
        <div className="w-16 h-16 bg-[#1e1e1e] border-2 border-[#4f4e4e] flex flex-col items-center justify-center gap-1 px-1">
          <FileText size={18} className="text-gray-400" />
          <span className="text-[9px] text-gray-500 text-center truncate w-full px-1">{file.name}</span>
        </div>
      )}
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#ff4d4d] border border-[#4f4e4e] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={9} className="text-black" />
      </button>
    </div>
  );
}

/* ── ChatWindow ────────────────────────────────────────────────────────────── */
export default function ChatWindow({ conv }: { conv: ApiConversation }) {
  const { token, user } = useAuthStore();
  const { getMessages, fetchMessages, addMessage, leaveConversation, selectConversation } = useConversationStore();
  const toggleAboutGroup = useUIStore((s) => s.toggleAboutGroup);
  const pushToast = useUIStore((s) => s.pushToast);
  const { markReadByConversation } = useNotificationStore();

  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUserId = user?._id ?? "";
  const messages = getMessages(conv._id);
  const convName = getConvName(conv, currentUserId);
  const convColor = getConvColor(conv, currentUserId);
  const partner = getConvPartner(conv, currentUserId);

  // Emit messages:read via socket and clear related notifications
  const emitRead = useCallback(() => {
    const socket = getSocket();
    if (socket?.connected) socket.emit("messages:read", { conversationId: conv._id });
    if (token) markReadByConversation(token, conv._id);
  }, [conv._id, token, markReadByConversation]);

  useEffect(() => {
    if (token) fetchMessages(token, conv._id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv._id, token]);

  // Mark as read when conversation opens
  useEffect(() => {
    emitRead();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    // Mark new incoming messages as read if this conversation is open
    if (messages.length > 0) emitRead();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setEmojiOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDeleteConversation = async () => {
    if (!token) return;
    try {
      await leaveConversation(token, conv._id);
      selectConversation(null);
      setConfirmDelete(false);
      pushToast("success", conv.type === "direct" ? "Chat deleted." : "Left the group.");
    } catch {
      pushToast("error", "Failed. Please try again.");
    }
  };

  // Subscribe to typing events for this conversation
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onTypingStart = ({ userId }: { userId: string; conversationId: string }) => {
      const participant = conv.participants.find((p) => p.user._id === userId);
      if (!participant) return;
      setTypingUsers((prev) =>
        prev.includes(participant.user.username) ? prev : [...prev, participant.user.username]
      );
    };

    const onTypingStop = ({ userId }: { userId: string; conversationId: string }) => {
      const participant = conv.participants.find((p) => p.user._id === userId);
      if (!participant) return;
      setTypingUsers((prev) => prev.filter((u) => u !== participant.user.username));
    };

    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);

    return () => {
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
    };
  }, [conv._id, conv.participants]);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]);
    e.target.value = "";
  };

  const removePending = useCallback((i: number) => {
    setPendingFiles((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  const handleTyping = (value: string) => {
    setInput(value);
    const socket = getSocket();
    if (!socket?.connected) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing:start", { conversationId: conv._id });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("typing:stop", { conversationId: conv._id });
    }, 2000);
  };

  const handleSend = async () => {
    if (!input.trim() && pendingFiles.length === 0) return;
    if (!token || !user) { pushToast("error", "You must be logged in"); return; }

    // Stop typing indicator
    const socket = getSocket();
    if (socket?.connected && isTypingRef.current) {
      isTypingRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit("typing:stop", { conversationId: conv._id });
    }

    const content = input.trim();
    setInput("");
    setPendingFiles([]);
    setUploading(true);

    let attachments: ApiAttachment[] = [];
    if (pendingFiles.length > 0) {
      try {
        const result = await uploadApi.upload(token, pendingFiles);
        attachments = result.files;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        const isCloudinaryConfig = msg.toLowerCase().includes("cloud_name") || msg.toLowerCase().includes("cloudinary");
        pushToast(
          "error",
          isCloudinaryConfig
            ? "Upload misconfigured — set CLOUDINARY_CLOUD_NAME in backend .env"
            : "File upload failed. Sending text only."
        );
        if (!content) { setUploading(false); return; }
      }
    }

    // Primary: send via socket (real-time); fallback: REST API
    if (socket?.connected) {
      socket.emit(
        "message:send",
        { conversationId: conv._id, content, attachments },
        (res: { success?: boolean; error?: string }) => {
          if (res?.error) pushToast("error", "Failed to send message.");
        }
      );
    } else {
      try {
        const msg = await messageApi.send(token, conv._id, content, attachments);
        addMessage(conv._id, msg);
      } catch {
        pushToast("error", "Failed to send message. Please try again.");
      }
    }

    setUploading(false);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#111111]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-[60px] border-b-2 border-[#4f4e4e] shrink-0">
        <div className="flex items-center gap-3">
          <Avatar name={convName} color={convColor} size={38}
            showOnline={conv.type === "direct"} isOnline={partner?.isOnline} />
          <div>
            <p className="text-sm font-bold text-white leading-tight">{convName}</p>
            {conv.type === "group" && (
              <p className="text-xs text-gray-500">{conv.participants.length} participants</p>
            )}
            {conv.type === "direct" && partner?.isOnline && (
              <p className="text-[11px] text-[#ae7aff] font-bold">Online</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 border-2 border-transparent hover:border-[#4f4e4e] text-gray-400 hover:text-white transition-colors">
            <Share2 size={17} />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="p-2 border-2 border-transparent hover:border-[#4f4e4e] text-gray-400 hover:text-white transition-colors"
            >
              <MoreVertical size={17} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-[#1a1a1a] border-2 border-[#4f4e4e] z-50 overflow-hidden shadow-[3px_3px_0px_0px_#4f4e4e]">
                {conv.type === "group" && (
                  <button
                    onClick={() => { toggleAboutGroup(); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors border-b border-[#2a2a2a]"
                  >
                    Group Info
                  </button>
                )}
                <button
                  onClick={() => { setConfirmDelete(true); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-[#ff4d4d] font-bold hover:bg-white/5 transition-colors"
                >
                  {conv.type === "direct"
                    ? <><Trash2 size={14} /> Delete Chat</>
                    : <><LogOut size={14} /> Leave Group</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Confirm delete dialog */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border-2 border-[#4f4e4e] w-full max-w-sm p-6 shadow-[4px_4px_0px_0px_#4f4e4e]">
              <p className="text-white font-bold mb-2">
                {conv.type === "direct" ? "Delete this chat?" : "Leave this group?"}
              </p>
              <p className="text-gray-400 text-sm mb-6">
                {conv.type === "direct"
                  ? "All messages will be permanently deleted."
                  : "You will be removed from the group."}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(false)} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
                <button onClick={handleDeleteConversation} className="btn-danger flex-1 py-2 text-sm">
                  {conv.type === "direct" ? "Delete" : "Leave"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {messages?.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-600 text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg._id} msg={msg} conv={conv} currentUserId={currentUserId} />
            ))}
            {typingUsers.map((name) => (
              <TypingIndicator key={name} name={name} color={getAvatarColor(name)} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Pending file chips */}
      {pendingFiles.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-t-2 border-[#4f4e4e] overflow-x-auto">
          {pendingFiles.map((f, i) => (
            <FileChip key={i} file={f} onRemove={() => removePending(i)} />
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-t-2 border-[#4f4e4e] shrink-0">
        <Avatar name={user?.username ?? "Me"} color={getAvatarColor(user?.username ?? "Me")} size={36} className="shrink-0" />

        <div className="flex-1 flex items-center bg-[#0f0f0f] border-2 border-[#4f4e4e] px-4 py-2.5 gap-3 min-w-0">
          <input
            ref={inputRef}
            type="text"
            placeholder="Message..."
            value={input}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            disabled={uploading}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none min-w-0"
          />
          <div className="relative shrink-0" ref={emojiRef}>
            <button
              onClick={() => setEmojiOpen((o) => !o)}
              className={`transition-colors ${emojiOpen ? "text-[#ae7aff]" : "text-gray-500 hover:text-[#ae7aff]"}`}
            >
              <Smile size={18} />
            </button>
            {emojiOpen && (
              <div className="absolute bottom-10 right-0 z-50">
                <EmojiPicker
                  onEmojiClick={(emojiData) => {
                    const emoji = emojiData.emoji;
                    const el = inputRef.current;
                    if (el) {
                      const start = el.selectionStart ?? input.length;
                      const end = el.selectionEnd ?? input.length;
                      const next = input.slice(0, start) + emoji + input.slice(end);
                      handleTyping(next);
                      // Restore cursor after emoji
                      requestAnimationFrame(() => {
                        el.focus();
                        el.setSelectionRange(start + emoji.length, start + emoji.length);
                      });
                    } else {
                      handleTyping(input + emoji);
                    }
                    setEmojiOpen(false);
                  }}
                  theme={"dark" as never}
                  skinTonesDisabled
                  searchDisabled={false}
                  height={380}
                  width={320}
                />
              </div>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-gray-500 hover:text-[#ae7aff] transition-colors shrink-0 disabled:opacity-40"
          >
            <Paperclip size={18} />
          </button>
          <input ref={fileInputRef} type="file" multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            className="hidden" onChange={handleFilePick} />
        </div>

        <button
          onClick={handleSend}
          disabled={uploading || (!input.trim() && pendingFiles.length === 0)}
          className="btn-primary w-10 h-10 p-0 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {uploading
            ? <Loader2 size={15} className="animate-spin" />
            : <Send size={15} />}
        </button>
      </div>
    </div>
  );
}
