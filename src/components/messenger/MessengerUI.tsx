"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import FigmaIcon from "../home/FigmaIcon";
import { UserAvatar } from "../ui/UserAvatar";
import { useSocket } from "../hooks/useSocket";
import { listFriends, type FriendUser } from "../../lib/auth";
import { useCurrentUser } from "../hooks/useCurrentUser";
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  sendAttachment,
  markConversationRead,
  toggleMessageReaction,
  deleteMessageForEveryone,
  createDirectConversation,
  extractIncomingMessage,
  Conversation,
  Message,
  User,
  type GifItem
} from "../../lib/api/chat";
import {
  ComposerTray,
  MORE_REACTIONS,
  ReactionBar
} from "./ChatPickers";

function fullName(user?: Pick<User, "firstName" | "lastName"> | null) {
  if (!user) return "Chat";
  return `${user.firstName} ${user.lastName}`.trim() || "Chat";
}

function formatClock(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function messagePreview(msg?: Message) {
  if (!msg) return "Say hello 👋";
  if (msg.isDeleted) return "Message deleted";
  if (msg.body?.trim()) return msg.body;
  if (msg.type === "IMAGE") return msg.fileName === "GIF" || msg.mediaUrl?.includes(".gif") ? "GIF" : "Photo";
  if (msg.type === "AUDIO") return "Audio";
  if (msg.type === "VIDEO") return "Video";
  return "Attachment";
}

function renderMessageBody(body: string, isMine: boolean) {
  const parts = body.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, index) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={index}
          href={part}
          className={`break-all underline ${isMine ? "text-white" : "text-[#00696F]"}`}
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function upsertConversation(list: Conversation[], next: Conversation) {
  const without = list.filter((item) => item.id !== next.id);
  return [next, ...without];
}

export default function MessengerUI() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const currentUser = useCurrentUser();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [openingFriend, setOpeningFriend] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [friendQuery, setFriendQuery] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [composerTray, setComposerTray] = useState<"emoji" | "gif" | null>(null);
  const [actionMsgId, setActionMsgId] = useState<string | null>(null);
  const [moreReactionsFor, setMoreReactionsFor] = useState<string | null>(null);

  const socket = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id ?? null;
  }, [currentUser?.id]);

  const syncUrl = useCallback((chatId: string | null) => {
    if (typeof window === "undefined") return;
    const url = chatId ? `/messenger?chatId=${chatId}` : "/messenger";
    window.history.replaceState(null, "", url);
  }, []);

  const selectChat = useCallback(
    (chatId: string) => {
      setActiveChatId(chatId);
      setMessages([]);
      syncUrl(chatId);
      setShowNewChat(false);
    },
    [syncUrl]
  );

  const openFriendChat = useCallback(
    async (userId: string) => {
      setOpeningFriend(true);
      setError("");
      try {
        const chat = await createDirectConversation(userId);
        setConversations((prev) =>
          upsertConversation(prev, { ...chat, unreadCount: chat.unreadCount ?? 0 })
        );
        selectChat(chat.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to start this chat.");
      } finally {
        setOpeningFriend(false);
      }
    },
    [selectChat]
  );

  // Initial conversations + deep links from friends (?userId=) or chats (?chatId=)
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      setLoadingChats(true);
      try {
        const chats = await fetchConversations();
        if (cancelled) return;
        setConversations(chats);

        const params = new URLSearchParams(window.location.search);
        const chatId = params.get("chatId");
        const userId = params.get("userId");

        if (chatId) {
          setActiveChatId(chatId);
        } else if (userId) {
          await openFriendChat(userId);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load chats.");
        }
      } finally {
        if (!cancelled) setLoadingChats(false);
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
    // openFriendChat is stable enough for first mount; we only want this once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Load messages and join the live room
  useEffect(() => {
    if (!activeChatId) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoadingMessages(true);
      setReplyingTo(null);
      setIsPartnerTyping(false);
      setComposerTray(null);
      setActionMsgId(null);
      setMoreReactionsFor(null);
    });

    fetchMessages(activeChatId)
      .then((items) => {
        if (!cancelled) setMessages(items);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load messages.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });

    markConversationRead(activeChatId).catch(() => undefined);
    queueMicrotask(() => {
      if (cancelled) return;
      setConversations((prev) =>
        prev.map((chat) => (chat.id === activeChatId ? { ...chat, unreadCount: 0 } : chat))
      );
    });

    if (socket?.connected) {
      socket.emit("join_conversation", activeChatId);
    }

    return () => {
      cancelled = true;
      if (socket && activeChatId) {
        socket.emit("leave_conversation", activeChatId);
      }
    };
  }, [activeChatId, socket]);

  // Real-time events
  useEffect(() => {
    if (!socket) return;

    const applyIncoming = (payload: unknown) => {
      const msg = extractIncomingMessage(payload);
      if (!msg?.id || !msg.conversationId) return;

      const openId = activeChatIdRef.current;
      const me = currentUserIdRef.current;
      const isMine = msg.senderId === me;
      const isOpen = msg.conversationId === openId;

      if (isOpen) {
        setIsPartnerTyping(false);
        setMessages((prev) => {
          if (prev.some((item) => item.id === msg.id)) return prev;
          if (isMine) {
            const pendingIndex = prev.findIndex(
              (item) => item.pending && item.body === msg.body
            );
            if (pendingIndex !== -1) {
              const next = [...prev];
              next[pendingIndex] = { ...msg, pending: false, failed: false };
              return next;
            }
          }
          return [...prev, msg];
        });
        markConversationRead(msg.conversationId).catch(() => undefined);
      }

      setConversations((prev) => {
        const existing = prev.find((chat) => chat.id === msg.conversationId);
        if (!existing) {
          fetchConversations().then(setConversations).catch(() => undefined);
          return prev;
        }

        return upsertConversation(prev, {
          ...existing,
          updatedAt: msg.createdAt,
          unreadCount: isOpen || isMine ? 0 : (existing.unreadCount || 0) + 1,
          messages: [msg]
        });
      });
    };

    socket.emit("get_online_users");

    const onOnlineList = (users: string[]) => setOnlineUsers(new Set(users));
    const onPresence = ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        if (isOnline) updated.add(userId);
        else updated.delete(userId);
        return updated;
      });
    };

    const onTyping = ({
      conversationId,
      userId,
      isTyping
    }: {
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      if (conversationId === activeChatIdRef.current && userId !== currentUserIdRef.current) {
        setIsPartnerTyping(isTyping);
      }
    };

    const onReaction = ({
      messageId,
      reactions
    }: {
      messageId: string;
      reactions: Message["reactions"];
    }) => {
      setMessages((prev) =>
        prev.map((item) => (item.id === messageId ? { ...item, reactions } : item))
      );
    };

    const onDeleted = ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((item) =>
          item.id === messageId
            ? {
                ...item,
                isDeleted: true,
                body: "This message was deleted",
                mediaUrl: null,
                reactions: []
              }
            : item
        )
      );
    };

    const onConversationUpserted = (chat: Conversation) => {
      setConversations((prev) => upsertConversation(prev, { ...chat, unreadCount: chat.unreadCount ?? 0 }));
    };

    const onConnect = () => {
      socket.emit("get_online_users");
      if (activeChatIdRef.current) {
        socket.emit("join_conversation", activeChatIdRef.current);
      }
    };

    socket.on("connect", onConnect);
    socket.on("online_users_list", onOnlineList);
    socket.on("user_presence_changed", onPresence);
    socket.on("new_message", applyIncoming);
    socket.on("new_message_notification", applyIncoming);
    socket.on("user_typing", onTyping);
    socket.on("message_reaction_updated", onReaction);
    socket.on("message_deleted", onDeleted);
    socket.on("conversation_upserted", onConversationUpserted);

    return () => {
      socket.off("connect", onConnect);
      socket.off("online_users_list", onOnlineList);
      socket.off("user_presence_changed", onPresence);
      socket.off("new_message", applyIncoming);
      socket.off("new_message_notification", applyIncoming);
      socket.off("user_typing", onTyping);
      socket.off("message_reaction_updated", onReaction);
      socket.off("message_deleted", onDeleted);
      socket.off("conversation_upserted", onConversationUpserted);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPartnerTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
    if (!socket || !activeChatId) return;

    socket.emit("typing_start", { conversationId: activeChatId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", { conversationId: activeChatId });
    }, 1400);
  };

  const appendConfirmed = (tempId: string, saved: Message) => {
    setMessages((prev) => {
      if (prev.some((item) => item.id === saved.id)) {
        return prev.filter((item) => item.id !== tempId);
      }
      return prev.map((item) => (item.id === tempId ? { ...saved, pending: false } : item));
    });
    setConversations((prev) => {
      const existing = prev.find((chat) => chat.id === saved.conversationId);
      if (!existing) return prev;
      return upsertConversation(prev, {
        ...existing,
        updatedAt: saved.createdAt,
        messages: [saved]
      });
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activeChatId || !currentUser) return;

    const body = draft.trim();
    const replyTargetId = replyingTo?.id;
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversationId: activeChatId,
      senderId: currentUser.id,
      body,
      type: "TEXT",
      replyToId: replyTargetId,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            body: replyingTo.body,
            type: replyingTo.type,
            mediaUrl: replyingTo.mediaUrl,
            isDeleted: Boolean(replyingTo.isDeleted),
            sender: {
              id: currentUser.id,
              firstName: currentUser.firstName,
              username: currentUser.username || ""
            }
          }
        : null,
      reactions: [],
      createdAt: new Date().toISOString(),
      pending: true
    };

    setDraft("");
    setReplyingTo(null);
    setMessages((prev) => [...prev, optimistic]);
    if (socket) socket.emit("typing_stop", { conversationId: activeChatId });

    try {
      const saved = await sendMessage(activeChatId, body, replyTargetId);
      appendConfirmed(tempId, saved);
    } catch (err) {
      setMessages((prev) =>
        prev.map((item) => (item.id === tempId ? { ...item, pending: false, failed: true } : item))
      );
      setDraft(body);
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  const insertEmoji = (emoji: string) => {
    const el = draftInputRef.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    const next = `${draft.slice(0, start)}${emoji}${draft.slice(end)}`;
    setDraft(next);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = start + emoji.length;
      el?.setSelectionRange(pos, pos);
    });
  };

  const handleSendGif = async (gif: GifItem) => {
    if (!activeChatId || !currentUser) return;
    const tempId = `temp-gif-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversationId: activeChatId,
      senderId: currentUser.id,
      body: "",
      type: "IMAGE",
      mediaUrl: gif.url,
      fileName: "GIF",
      replyToId: replyingTo?.id,
      reactions: [],
      createdAt: new Date().toISOString(),
      pending: true
    };

    setMessages((prev) => [...prev, optimistic]);
    setComposerTray(null);
    const replyTargetId = replyingTo?.id;
    setReplyingTo(null);

    try {
      const saved = await sendMessage(activeChatId, "", replyTargetId, {
        type: "IMAGE",
        mediaUrl: gif.url,
        fileName: "GIF"
      });
      appendConfirmed(tempId, saved);
    } catch (err) {
      setMessages((prev) =>
        prev.map((item) => (item.id === tempId ? { ...item, pending: false, failed: true } : item))
      );
      setError(err instanceof Error ? err.message : "Failed to send GIF");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId || !currentUser) return;

    const formData = new FormData();
    formData.append("file", file);
    if (draft.trim()) formData.append("body", draft.trim());
    if (replyingTo?.id) formData.append("replyToId", replyingTo.id);

    const tempId = `temp-file-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        conversationId: activeChatId,
        senderId: currentUser.id,
        body: draft.trim() || file.name,
        type: file.type.startsWith("image/") ? "IMAGE" : "DOCUMENT",
        createdAt: new Date().toISOString(),
        pending: true
      }
    ]);
    setIsUploading(true);

    try {
      const saved = await sendAttachment(activeChatId, formData);
      appendConfirmed(tempId, saved);
      setDraft("");
      setReplyingTo(null);
    } catch (err) {
      setMessages((prev) =>
        prev.map((item) => (item.id === tempId ? { ...item, pending: false, failed: true } : item))
      );
      setError(err instanceof Error ? err.message : "File upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const reactions = await toggleMessageReaction(messageId, emoji);
      setMessages((prev) =>
        prev.map((item) => (item.id === messageId ? { ...item, reactions } : item))
      );
    } catch (err) {
      console.error("Failed to react", err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Delete this message for everyone?")) return;
    try {
      await deleteMessageForEveryone(messageId);
      setMessages((prev) =>
        prev.map((item) =>
          item.id === messageId
            ? { ...item, isDeleted: true, body: "This message was deleted", mediaUrl: null, reactions: [] }
            : item
        )
      );
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const openNewChatPicker = async () => {
    setShowNewChat(true);
    setLoadingFriends(true);
    try {
      const result = await listFriends();
      setFriends(result.items || []);
    } catch {
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  };

  const getChatPartner = (chat: Conversation) => {
    if (chat.type === "DIRECT") {
      return (
        chat.members.find((member) => member.user.id !== currentUser?.id)?.user ||
        chat.members[0]?.user
      );
    }
    return null;
  };

  const visibleConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((chat) => {
      const partner = getChatPartner(chat);
      const name = chat.type === "GROUP" ? "group chat" : fullName(partner).toLowerCase();
      return name.includes(q) || messagePreview(chat.messages?.[0]).toLowerCase().includes(q);
    });
  }, [conversations, search, currentUser?.id]);

  const visibleFriends = useMemo(() => {
    const q = friendQuery.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((friend) =>
      `${friend.firstName} ${friend.lastName} ${friend.username}`.toLowerCase().includes(q)
    );
  }, [friends, friendQuery]);

  const activeChat = conversations.find((chat) => chat.id === activeChatId);
  const activePartner = activeChat ? getChatPartner(activeChat) : null;
  const activeName =
    activeChat?.type === "GROUP" ? "Group Chat" : fullName(activePartner);
  const activeAvatar = activeChat?.type === "GROUP" ? "" : activePartner?.avatar || "";
  const isActiveOnline = activePartner ? onlineUsers.has(activePartner.id) : false;

  const groupedMessages = useMemo(() => {
    const groups: { label: string; items: Message[] }[] = [];
    messages.forEach((msg) => {
      const label = formatDayLabel(msg.createdAt);
      const last = groups[groups.length - 1];
      if (!last || last.label !== label) groups.push({ label, items: [msg] });
      else last.items.push(msg);
    });
    return groups;
  }, [messages]);

  return (
    <div className="h-full w-full flex bg-white border border-[#D3E4FE] overflow-hidden relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
      />

      <aside
        className={`w-full sm:w-[320px] shrink-0 h-full flex flex-col border-r border-[#D3E4FE] bg-white ${
          activeChatId ? "hidden sm:flex" : "flex"
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-[17px] border-b border-[#D3E4FE]">
          <h2 className="text-[16px] leading-6 text-[#0B1C30] font-normal">Chats</h2>
          <button
            type="button"
            aria-label="New message"
            onClick={() => void openNewChatPicker()}
            className="flex items-center justify-center rounded-full bg-[#EFF4FF] p-2 hover:bg-[#DCE9FF] transition chat-pop"
          >
            <FigmaIcon src="/figma/icons/new-message.svg" alt="" width={20} height={20} />
          </button>
        </div>

        <div className="p-4">
          <label className="relative block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <FigmaIcon src="/figma/icons/search-messenger.svg" alt="" width={11} height={11} />
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Messenger"
              className="w-full rounded-full bg-[#EFF4FF] pl-10 pr-4 py-[9px] text-[16px] text-[#0B1C30] placeholder:text-[#6B7280] outline-none"
            />
          </label>
        </div>

        {error ? (
          <p className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</p>
        ) : null}

        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col items-center gap-1 px-[8.5px] pb-3">
          {loadingChats ? (
            <p className="py-10 text-[13px] text-[#6B7280]">Loading chats…</p>
          ) : visibleConversations.length === 0 ? (
            <div className="px-4 py-10 text-center chat-fade-in">
              <p className="text-[14px] text-[#0B1C30] font-medium">No conversations yet</p>
              <p className="mt-1 text-[13px] text-[#6B7280]">Message a friend to start chatting.</p>
              <button
                type="button"
                onClick={() => void openNewChatPicker()}
                className="mt-4 rounded-full bg-[#00696F] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#005a5f] transition"
              >
                Message a friend
              </button>
            </div>
          ) : (
            visibleConversations.map((chat) => {
              const partner = getChatPartner(chat);
              const name = chat.type === "GROUP" ? "Group Chat" : fullName(partner);
              const avatar = chat.type === "GROUP" ? "" : partner?.avatar || "";
              const isUserOnline = partner ? onlineUsers.has(partner.id) : false;
              const latest = chat.messages?.[0];
              const unread = chat.unreadCount || 0;
              const selected = activeChatId === chat.id;

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => selectChat(chat.id)}
                  className={`flex w-full max-w-[303px] items-center gap-3 p-3 rounded-[8px] text-left transition ${
                    selected ? "bg-[#DCE9FF]" : "bg-transparent hover:bg-gray-50"
                  }`}
                >
                  <div className="relative">
                    <UserAvatar avatarUrl={avatar} name={name} size={48} />
                    {isUserOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full chat-pop" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] leading-5 text-[#0B1C30] font-semibold truncate">{name}</p>
                      <span className="text-[11px] text-[#6B7280]">{formatClock(latest?.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5 gap-2">
                      <p
                        className={`text-[13px] truncate max-w-[170px] ${
                          unread > 0 ? "text-[#0B1C30] font-semibold" : "text-[#3C494A]"
                        }`}
                      >
                        {messagePreview(latest)}
                      </p>
                      {unread > 0 && (
                        <span className="unread-pulse bg-[#00696F] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section
        className={`flex-1 min-w-0 h-full flex flex-col bg-white relative ${
          activeChatId ? "flex" : "hidden sm:flex"
        }`}
      >
        {activeChatId ? (
          <>
            <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[#D3E4FE] bg-white/90 backdrop-blur-[2px] chat-fade-in">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="sm:hidden text-[#00696F] text-[13px] font-semibold"
                  onClick={() => {
                    setActiveChatId(null);
                    syncUrl(null);
                  }}
                >
                  ←
                </button>
                <div className="relative">
                  <UserAvatar avatarUrl={activeAvatar} name={activeName} size={40} />
                  {isActiveOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#0B1C30]">{activeName}</p>
                  <p className="text-[12px] font-medium text-[#3C494A]">
                    {isPartnerTyping ? "Typing…" : isActiveOnline ? "Active now" : "Offline"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link href="/call/audio" className="p-2 rounded-full hover:bg-[#EFF4FF] text-[#00696F] transition">
                  <FigmaIcon src="/figma/icons/call-phone.svg" alt="Audio Call" width={18} height={18} />
                </Link>
                <Link href="/call/video" className="p-2 rounded-full hover:bg-[#EFF4FF] text-[#00696F] transition">
                  <FigmaIcon src="/figma/icons/call-video.svg" alt="Video Call" width={20} height={16} />
                </Link>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar bg-[#F8F9FF] px-4 py-6 flex flex-col gap-4">
              {openingFriend || loadingMessages ? (
                <p className="m-auto text-[13px] text-[#6B7280]">Loading messages…</p>
              ) : messages.length === 0 ? (
                <div className="m-auto text-center chat-slide-up">
                  <UserAvatar avatarUrl={activeAvatar} name={activeName} size={72} className="mx-auto" />
                  <p className="mt-3 text-[16px] font-semibold text-[#0B1C30]">{activeName}</p>
                  <p className="mt-1 text-[13px] text-[#6B7280]">You are friends. Send the first message.</p>
                </div>
              ) : (
                groupedMessages.map((group) => (
                  <div key={group.label} className="flex flex-col gap-4">
                    <div className="flex justify-center">
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] text-[#6B7280] shadow-sm">
                        {group.label}
                      </span>
                    </div>
                    {group.items.map((msg) => {
                      const isMine = msg.senderId === currentUser?.id;
                      const sender =
                        activeChat?.members.find((member) => member.user.id === msg.senderId)?.user ||
                        msg.sender;

                      return (
                        <div
                          key={msg.id}
                          className={`group relative flex flex-col ${
                            isMine ? "items-end chat-bubble-own" : "items-start chat-bubble-friend"
                          } ${msg.pending ? "opacity-70" : ""} ${msg.failed ? "opacity-80" : ""}`}
                          onClick={() => setActionMsgId((current) => (current === msg.id ? null : msg.id))}
                        >
                          {msg.replyTo && (
                            <div
                              className={`text-[12px] mb-1 px-3 py-1 rounded-lg border-l-4 max-w-[280px] truncate ${
                                isMine
                                  ? "bg-[#005a5f] text-gray-200 border-white"
                                  : "bg-[#d8e4fc] text-[#0B1C30] border-[#00696F]"
                              }`}
                            >
                              <span className="font-bold block">
                                {msg.replyTo.sender?.firstName || "Replied message"}
                              </span>
                              {msg.replyTo.body || "Media attachment"}
                            </div>
                          )}

                          <div className={`flex items-end gap-2 max-w-[70%] ${isMine ? "flex-row-reverse" : ""}`}>
                            {!isMine && (
                              <UserAvatar
                                avatarUrl={sender?.avatar}
                                name={sender?.firstName}
                                size={28}
                              />
                            )}

                            <div
                              className={`relative rounded-2xl p-3 shadow-sm ${
                                isMine
                                  ? "bg-[#00696F] text-white rounded-br-none"
                                  : "bg-[#E5EEFF] text-[#0B1C30] rounded-bl-none"
                              } ${msg.isDeleted ? "italic opacity-70" : ""}`}
                            >
                              {msg.mediaUrl && !msg.isDeleted && (
                                <div className="mb-2">
                                  {msg.type === "IMAGE" && (
                                    <div className="relative">
                                      <img
                                        src={msg.mediaUrl}
                                        alt={msg.fileName === "GIF" ? "GIF" : "Attachment"}
                                        className="max-w-[240px] max-h-[240px] rounded-lg object-cover cursor-pointer"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          const sharedLink =
                                            msg.fileName === "Shared post"
                                              ? msg.body.match(/https?:\/\/[^\s]+/)?.[0]
                                              : undefined;
                                          window.open(sharedLink || msg.mediaUrl!, sharedLink ? "_self" : "_blank");
                                        }}
                                      />
                                      {(msg.fileName === "GIF" || msg.mediaUrl.includes(".gif")) && (
                                        <span className="gif-badge absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                                          GIF
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {msg.type === "AUDIO" && (
                                    <audio controls src={msg.mediaUrl} className="w-60" />
                                  )}
                                  {msg.type === "VIDEO" && (
                                    <video controls src={msg.mediaUrl} className="max-w-[240px] rounded-lg" />
                                  )}
                                  {msg.type === "DOCUMENT" && (
                                    <a
                                      href={msg.mediaUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-2 underline text-[13px]"
                                    >
                                      📄 {msg.fileName || "Download Document"}
                                    </a>
                                  )}
                                </div>
                              )}

                              <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                                {renderMessageBody(msg.body, isMine)}
                              </p>
                              <p
                                className={`mt-1 text-[10px] ${
                                  isMine ? "text-white/70 text-right" : "text-[#6B7280]"
                                }`}
                              >
                                {msg.failed ? "Failed" : msg.pending ? "Sending…" : formatClock(msg.createdAt)}
                              </p>

                              {msg.reactions && msg.reactions.length > 0 && (
                                <div className="absolute -bottom-3 right-2 flex gap-0.5 bg-white border border-gray-200 px-1.5 py-0.5 rounded-full shadow-sm chat-pop">
                                  {Array.from(new Set(msg.reactions.map((reaction) => reaction.emoji))).map(
                                    (emoji) => (
                                      <span key={emoji} className="text-xs">
                                        {emoji}
                                      </span>
                                    )
                                  )}
                                  {msg.reactions.length > 1 && (
                                    <span className="text-[10px] text-gray-500 font-bold ml-0.5">
                                      {msg.reactions.length}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {!msg.isDeleted && (
                              <div
                                className={`relative ${
                                  actionMsgId === msg.id || moreReactionsFor === msg.id
                                    ? "opacity-100"
                                    : "opacity-0 group-hover:opacity-100"
                                } transition`}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <ReactionBar
                                  isMine={isMine}
                                  onReact={(emoji) => {
                                    void handleReaction(msg.id, emoji);
                                    setMoreReactionsFor(null);
                                  }}
                                  onReply={() => {
                                    setReplyingTo(msg);
                                    setActionMsgId(null);
                                  }}
                                  onDelete={() => void handleDeleteMessage(msg.id)}
                                  onMore={() =>
                                    setMoreReactionsFor((current) => (current === msg.id ? null : msg.id))
                                  }
                                />
                                {moreReactionsFor === msg.id && (
                                  <div
                                    className={`absolute bottom-9 z-10 w-[220px] overflow-hidden rounded-2xl border border-[#D3E4FE] bg-white shadow-lg chat-pop ${
                                      isMine ? "right-0" : "left-0"
                                    }`}
                                  >
                                    <div className="grid grid-cols-8 gap-1 p-2">
                                      {MORE_REACTIONS.map((emoji) => (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={() => {
                                            void handleReaction(msg.id, emoji);
                                            setMoreReactionsFor(null);
                                          }}
                                          className="emoji-bounce flex h-7 items-center justify-center rounded-md text-[16px] hover:bg-[#EFF4FF]"
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}

              {isPartnerTyping && (
                <div className="flex items-center gap-2 text-gray-500 text-xs italic chat-slide-up">
                  <div className="flex gap-1 py-1.5 px-3 bg-[#E5EEFF] rounded-full">
                    <span className="w-1.5 h-1.5 bg-[#00696F] rounded-full typing-dot" />
                    <span className="w-1.5 h-1.5 bg-[#00696F] rounded-full typing-dot [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 bg-[#00696F] rounded-full typing-dot [animation-delay:0.3s]" />
                  </div>
                  <span>{activeName} is typing…</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {replyingTo && (
              <div className="flex items-center justify-between px-4 py-2 bg-[#EFF4FF] border-t border-[#D3E4FE] chat-slide-up">
                <div className="text-xs truncate">
                  <span className="font-semibold text-[#00696F]">
                    Replying to {replyingTo.senderId === currentUser?.id ? "yourself" : activeName}:
                  </span>{" "}
                  <span className="text-gray-600">{replyingTo.body || "Attachment"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {composerTray && (
              <ComposerTray
                mode={composerTray}
                onClose={() => setComposerTray(null)}
                onEmoji={insertEmoji}
                onGif={(gif) => void handleSendGif(gif)}
              />
            )}

            <form
              className="shrink-0 flex items-center gap-1.5 px-3 py-3 border-t border-[#D3E4FE] bg-white"
              onSubmit={handleSend}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                aria-label="Upload File"
                className="flex items-center justify-center rounded-full p-2 hover:bg-[#EFF4FF] transition"
              >
                <FigmaIcon src="/figma/icons/attach-plus.svg" alt="Upload" width={20} height={20} />
              </button>

              <button
                type="button"
                onClick={() => setComposerTray((current) => (current === "gif" ? null : "gif"))}
                disabled={isUploading}
                aria-label="Send GIF"
                className={`flex items-center justify-center rounded-full p-2 transition ${
                  composerTray === "gif" ? "bg-[#DCE9FF]" : "hover:bg-[#EFF4FF]"
                }`}
              >
                <FigmaIcon src="/figma/icons/attach-gif.svg" alt="GIF" width={18} height={18} />
              </button>

              <div className="relative flex-1 min-w-0">
                <input
                  ref={draftInputRef}
                  type="text"
                  value={draft}
                  onChange={handleInputChange}
                  placeholder={isUploading ? "Uploading file..." : `Message ${activeName}...`}
                  disabled={isUploading}
                  className="w-full rounded-full bg-[#EFF4FF] pl-4 pr-11 py-[10px] text-[15px] text-[#0B1C30] placeholder:text-[#6B7280] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setComposerTray((current) => (current === "emoji" ? null : "emoji"))}
                  aria-label="Emojis"
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition ${
                    composerTray === "emoji" ? "bg-white" : "hover:bg-white/80"
                  }`}
                >
                  <FigmaIcon src="/figma/icons/input-emoji.svg" alt="Emoji" width={18} height={18} />
                </button>
              </div>

              <button
                type="submit"
                disabled={isUploading || !draft.trim()}
                aria-label="Send"
                className="send-pulse flex items-center justify-center rounded-full bg-[#00696F] p-2.5 text-white hover:bg-[#005a5f] disabled:opacity-50 transition"
              >
                <FigmaIcon
                  src="/figma/icons/send-message.svg"
                  alt="Send"
                  width={18}
                  height={16}
                  className="brightness-0 invert"
                />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#F8F9FF] chat-fade-in">
            <p className="text-[#0B1C30] text-[16px] font-semibold">Your messages</p>
            <p className="mt-1 text-[#6B7280] text-[14px]">Select a conversation or message a friend.</p>
            <button
              type="button"
              onClick={() => void openNewChatPicker()}
              className="mt-4 rounded-full bg-[#00696F] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#005a5f] transition"
            >
              New chat
            </button>
          </div>
        )}
      </section>

      {showNewChat && (
        <div className="absolute inset-0 z-20 flex bg-black/20 chat-fade-in">
          <div className="m-auto w-[min(420px,92%)] max-h-[80%] overflow-hidden rounded-2xl bg-white shadow-xl chat-slide-up">
            <div className="flex items-center justify-between border-b border-[#D3E4FE] px-4 py-3">
              <h3 className="text-[15px] font-semibold text-[#0B1C30]">Message a friend</h3>
              <button
                type="button"
                onClick={() => setShowNewChat(false)}
                className="text-[#6B7280] hover:text-[#0B1C30]"
              >
                ✕
              </button>
            </div>
            <div className="p-3">
              <input
                value={friendQuery}
                onChange={(event) => setFriendQuery(event.target.value)}
                placeholder="Search friends"
                className="w-full rounded-full bg-[#EFF4FF] px-4 py-2 text-[14px] outline-none"
              />
            </div>
            <div className="max-h-[360px] overflow-y-auto no-scrollbar px-2 pb-3">
              {loadingFriends ? (
                <p className="py-8 text-center text-[13px] text-[#6B7280]">Loading friends…</p>
              ) : visibleFriends.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-[#6B7280]">
                  Add friends first, then you can message them.
                </p>
              ) : (
                visibleFriends.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => void openFriendChat(friend.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-[#EFF4FF] transition"
                  >
                    <UserAvatar
                      avatarUrl={friend.avatar}
                      name={`${friend.firstName} ${friend.lastName}`}
                      size={40}
                      isOnline={friend.isOnline || onlineUsers.has(friend.id)}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-[#0B1C30]">
                        {friend.firstName} {friend.lastName}
                      </p>
                      <p className="text-[12px] text-[#6B7280]">
                        {onlineUsers.has(friend.id) ? "Active now" : "Friend"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
