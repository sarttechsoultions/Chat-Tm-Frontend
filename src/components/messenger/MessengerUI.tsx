"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Info, Phone, Video, ArrowLeft } from "lucide-react";
import ChatProfilePanel from "./ChatProfilePanel";
import { ChatListSkeleton, ChatMessagesSkeleton, ChatProfileSkeleton } from "./ChatSkeletons";
import { callApi, type Call, startCall } from "../../lib/api/calls";
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
  createGroupConversation,
  extractIncomingMessage,
  Conversation,
  Message,
  User,
  type GifItem
} from "../../lib/api/chat";
import {
  ComposerTray,
  MORE_REACTIONS,
  ReactionBar,
  SeenTicks
} from "./ChatPickers";

function fullName(user?: Pick<User, "firstName" | "lastName"> | null) {
  if (!user) return "Chat";
  return `${user.firstName} ${user.lastName}`.trim() || "Chat";
}

function formatClock(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatChatTime(value?: string) {
 if(!value)return "";
 const date=new Date(value),now=new Date();
 if(now.getTime()-date.getTime()<86400000)return formatClock(value);
 const today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
 const day=Date.UTC(date.getFullYear(),date.getMonth(),date.getDate());
 const days=Math.round((today-day)/86400000);
 return days===1?"Yesterday":days<7?days+" days ago":date.toLocaleDateString();
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

function getChatPartner(chat: Conversation, currentUserId?: string | null) {
  if (chat.type === "DIRECT") {
    return (
      chat.members.find((member) => member.user.id !== currentUserId)?.user ||
      chat.members[0]?.user
    );
  }
  return null;
}

function conversationTitle(chat: Conversation, currentUserId?: string | null) {
  if (chat.type === "GROUP") {
    return chat.name?.trim() || "Group Chat";
  }
  return fullName(getChatPartner(chat, currentUserId));
}

function conversationAvatar(chat: Conversation, currentUserId?: string | null) {
  if (chat.type === "GROUP") return chat.avatar || "";
  return getChatPartner(chat, currentUserId)?.avatar || "";
}

function GroupAvatars({
  chat,
  currentUserId,
  size = 48
}: {
  chat: Conversation;
  currentUserId?: string | null;
  size?: number;
}) {
  const others = chat.members
    .filter((member) => member.user.id !== currentUserId)
    .slice(0, 3);
  const faces = others.length ? others : chat.members.slice(0, 3);
  if (faces.length <= 1) {
    return <UserAvatar avatarUrl={faces[0]?.user.avatar} name={conversationTitle(chat, currentUserId)} size={size} />;
  }
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {faces.slice(0, 2).map((member, index) => (
        <div
          key={member.userId}
          className="absolute rounded-full ring-2 ring-white"
          style={{
            width: size * 0.68,
            height: size * 0.68,
            top: index === 0 ? 0 : size * 0.32,
            left: index === 0 ? 0 : size * 0.32
          }}
        >
          <UserAvatar avatarUrl={member.user.avatar} name={member.user.firstName} size={size * 0.68} />
        </div>
      ))}
    </div>
  );
}

function isMessageSeen(msg: Message, currentUserId?: string | null) {
  return Boolean(msg.readBy?.some((reader) => reader.userId !== currentUserId));
}

function upsertConversation(list: Conversation[], next: Conversation) {
  const without = list.filter((item) => item.id !== next.id);
  return [next, ...without];
}

export default function MessengerUI() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [listCalls,setListCalls]=useState<Call[]>([]);
  const [callRecords, setCallRecords] = useState<Call[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
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
  const [newChatTab, setNewChatTab] = useState<"direct" | "group">("direct");
  const [groupName, setGroupName] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [friendQuery, setFriendQuery] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [composerTray, setComposerTray] = useState<"emoji" | "gif" | null>(null);
  const [actionMsgId, setActionMsgId] = useState<string | null>(null);
  const [moreReactionsFor, setMoreReactionsFor] = useState<string | null>(null);

  const socket = useSocket();
  const [preview, setPreview] = useState<Message | null>(null);
  const messageScrollRef = useRef<HTMLDivElement>(null);
  const followLatestRef = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftInputRef = useRef<HTMLTextAreaElement>(null);
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

  const processedIncoming = useRef(new Set<string>());
  // Real-time events
  useEffect(() => {
    if (!socket) return;

    const applyIncoming = (payload: unknown) => {
      const msg = extractIncomingMessage(payload);
      if (!msg?.id || !msg.conversationId) return;
      if(processedIncoming.current.has(msg.id))return;
      processedIncoming.current.add(msg.id);
      if(processedIncoming.current.size>1000)processedIncoming.current.delete(processedIncoming.current.values().next().value!);

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

    const onConversationRead = ({
      conversationId,
      userId,
      readAt
    }: {
      conversationId: string;
      userId: string;
      readAt: string;
    }) => {
      const me = currentUserIdRef.current;
      if (!readAt || userId === me) return;

      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === conversationId
            ? {
                ...chat,
                members: chat.members.map((member) =>
                  member.userId === userId ? { ...member, lastReadAt: readAt } : member
                )
              }
            : chat
        )
      );

      if (conversationId !== activeChatIdRef.current) return;

      setMessages((prev) =>
        prev.map((item) => {
          if (item.senderId === userId) return item;
          if (new Date(item.createdAt) > new Date(readAt)) return item;
          if (item.readBy?.some((reader) => reader.userId === userId)) return item;
          return {
            ...item,
            readBy: [...(item.readBy || []), { userId, firstName: "" }]
          };
        })
      );
    };

    const onConnect = () => {
      fetchConversations().then(setConversations).catch(()=>undefined);
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
    socket.on("conversation_read", onConversationRead);
    socket.on("conversation_read_notification", onConversationRead);
    // Register the listener first. On a fast connection the server can answer
    // immediately, so emitting before the listener caused the first presence
    // list to be missed on mobile.
    socket.emit("get_online_users");

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
      socket.off("conversation_read", onConversationRead);
      socket.off("conversation_read_notification", onConversationRead);
    };
  }, [socket]);

  useEffect(() => { followLatestRef.current = true; }, [activeChatId]);
  useEffect(() => {
    const viewport = messageScrollRef.current;
    const content = messagesEndRef.current?.parentElement;
    if (!viewport || !content || loadingMessages || openingFriend) return;
    const bottom = () => {
      if (followLatestRef.current) viewport.scrollTop = viewport.scrollHeight;
    };
    const frame = requestAnimationFrame(bottom);
    const observer = new ResizeObserver(bottom);
    observer.observe(content);
    viewport.addEventListener("load", bottom, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      viewport.removeEventListener("load", bottom, true);
    };
  }, [messages, callRecords, isPartnerTyping, activeChatId, loadingMessages, openingFriend]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

    followLatestRef.current = true;
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
      pending: true,
      readBy: []
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
      pending: true,
      readBy: []
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

  const attachmentPreviews = useRef(new Set<string>());
  useEffect(()=>()=>{attachmentPreviews.current.forEach(url=>URL.revokeObjectURL(url));attachmentPreviews.current.clear();},[]);
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId || !currentUser) return;

    const formData = new FormData();
    formData.append("file", file);
    if (draft.trim()) formData.append("body", draft.trim());
    if (replyingTo?.id) formData.append("replyToId", replyingTo.id);

    const tempId = `temp-file-${Date.now()}`;
    const previewUrl = URL.createObjectURL(file);
    attachmentPreviews.current.add(previewUrl);
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        conversationId: activeChatId,
        senderId: currentUser.id,
        body: draft.trim(),
        mediaUrl: previewUrl,
        fileName: file.name,
        type: file.type.startsWith("image/") ? "IMAGE" : file.type.startsWith("video/") ? "VIDEO" : file.type.startsWith("audio/") ? "AUDIO" : "DOCUMENT",
        createdAt: new Date().toISOString(),
        pending: true,
        readBy: []
      }
    ]);
    setIsUploading(true);

    try {
      const saved = await sendAttachment(activeChatId, formData);
      appendConfirmed(tempId, saved);
      URL.revokeObjectURL(previewUrl);
      attachmentPreviews.current.delete(previewUrl);
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

  const handleDeleteMessage = (message: Message) => {
    setDeleteTarget(message);
    setActionMsgId(null);
  };

  const confirmDeleteMessage = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteMessageForEveryone(deleteTarget.id);
      setMessages((prev) =>
        prev.map((item) =>
          item.id === deleteTarget.id
            ? { ...item, isDeleted: true, body: "This message was deleted", mediaUrl: null, reactions: [] }
            : item
        )
      );
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete", err);
    } finally {
      setDeleting(false);
    }
  };

  const openNewChatPicker = async () => {
    setShowNewChat(true);
    setNewChatTab("direct");
    setGroupName("");
    setSelectedFriendIds([]);
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

  const toggleFriendSelect = (userId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroupChat = async () => {
    if (!groupName.trim() || selectedFriendIds.length < 1 || creatingGroup) return;
    setCreatingGroup(true);
    setError("");
    try {
      const chat = await createGroupConversation(groupName.trim(), selectedFriendIds);
      setConversations((prev) => upsertConversation(prev, { ...chat, unreadCount: chat.unreadCount ?? 0 }));
      setShowNewChat(false);
      selectChat(chat.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create group chat.");
    } finally {
      setCreatingGroup(false);
    }
  };

  useEffect(()=>{
    if(!currentUser?.id)return;
    let cancelled=false;
    const refresh=()=>{void callApi<{items:Call[]}>("").then(data=>{if(!cancelled)setListCalls(data.items);}).catch(()=>{});};
    refresh();
    const updated=(item:Call)=>setListCalls(prev=>[item,...prev.filter(c=>c.id!==item.id)]);
    socket?.on("call_updated",updated);
    socket?.on("connect",refresh);
    return()=>{cancelled=true;socket?.off("call_updated",updated);socket?.off("connect",refresh);};
  },[currentUser?.id,socket]);
  const latestChatCall=(chat:Conversation)=>{
    if(chat.type==="GROUP")return undefined;
    const peer=getChatPartner(chat,currentUser?.id)?.id;
    return listCalls.filter(c=>((c.callerId===currentUser?.id&&c.calleeId===peer)||(c.calleeId===currentUser?.id&&c.callerId===peer))).sort((a,b)=>new Date(b.endedAt||b.startedAt).getTime()-new Date(a.endedAt||a.startedAt).getTime())[0];
  };
  const visibleConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((chat) => {
      const name = conversationTitle(chat, currentUser?.id).toLowerCase();
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
  const activePartner = activeChat ? getChatPartner(activeChat, currentUser?.id) : null;
  const activeName = activeChat ? conversationTitle(activeChat, currentUser?.id) : "Chat";
  const activeAvatar = activeChat ? conversationAvatar(activeChat, currentUser?.id) : "";
  const isGroupChat = activeChat?.type === "GROUP";
  const isActiveOnline = activePartner ? onlineUsers.has(activePartner.id) : false;
  const groupOnlineCount = activeChat
    ? activeChat.members.filter(
        (member) => member.user.id !== currentUser?.id && onlineUsers.has(member.user.id)
      ).length
    : 0;
  const presenceLabel = isPartnerTyping
    ? "Typing…"
    : isGroupChat
      ? `${activeChat?.members.length || 0} members${groupOnlineCount ? ` · ${groupOnlineCount} online` : ""}`
      : isActiveOnline
        ? "Active now"
        : socket?.connected
          ? "Offline"
          : "Connecting…";

  useEffect(()=>{
    if (!activePartner || isGroupChat) { setCallRecords([]); return; }
    let cancelled=false;
    void callApi<{items:Call[]}>('?peerId='+encodeURIComponent(activePartner.id)).then(data=>{if(!cancelled)setCallRecords(data.items);}).catch(()=>{});
    const updated=(call:Call)=>{if(cancelled)return;setCallRecords(items=>[call,...items.filter(item=>item.id!==call.id)]);};
    socket?.on('call_updated',updated);
    return()=>{cancelled=true;socket?.off('call_updated',updated);};
  },[activePartner?.id,isGroupChat,socket]);
  const groupedMessages = useMemo(() => {
    const groups: { label: string; items: (Message & { callRecord?: Call })[] }[] = [];
    const calls: (Message & {callRecord?:Call})[] = isGroupChat ? [] : callRecords.filter(call=>['ENDED','MISSED'].includes(call.status) && ((call.callerId===currentUser?.id&&call.calleeId===activePartner?.id)||(call.calleeId===currentUser?.id&&call.callerId===activePartner?.id))).map(call=>({id:'call-'+call.id,conversationId:activeChatId||'',senderId:call.callerId,body:'',type:'TEXT',createdAt:call.endedAt||call.startedAt,callRecord:call}));
    [...messages,...calls].sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()).forEach((msg) => {
      const label = formatDayLabel(msg.createdAt);
      const last = groups[groups.length - 1];
      if (!last || last.label !== label) groups.push({ label, items: [msg] });
      else last.items.push(msg);
    });
    return groups;
  }, [messages,callRecords,isGroupChat,currentUser?.id,activePartner?.id,activeChatId]);

  return (
    <div className="h-full w-full flex bg-white overflow-hidden relative sm:border sm:border-[#D3E4FE]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
      />

      <aside
        className={`h-full w-full shrink-0 flex-col border-r border-[#D3E4FE] bg-white ${
          activeChatId ? "hidden lg:flex" : "flex"
        } lg:w-[320px]`}
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
            <ChatListSkeleton/>
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
              const partner = getChatPartner(chat, currentUser?.id);
              const name = conversationTitle(chat, currentUser?.id);
              const isUserOnline = partner ? onlineUsers.has(partner.id) : false;
              const latest = chat.messages?.[0];
              const call = latestChatCall(chat);
              const callTime = call?.endedAt || call?.startedAt;
              const callIsLatest = !!callTime && new Date(callTime).getTime() > new Date(latest?.createdAt || 0).getTime();
              const unread = chat.unreadCount || 0;
              const sentByMe = latest?.senderId === currentUser?.id;
              const seenAt = latest ? chat.members.filter(member=>member.userId!==currentUser?.id && member.lastReadAt && new Date(member.lastReadAt).getTime()>=new Date(latest.createdAt).getTime()).map(member=>member.lastReadAt!).sort()[0] : undefined;

              const selected = activeChatId === chat.id;

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => selectChat(chat.id)}
                  className={`flex w-full lg:max-w-[303px] items-center gap-3 p-3 rounded-[8px] text-left transition ${
                    selected ? "bg-[#DCE9FF]" : "bg-transparent hover:bg-gray-50"
                  }`}
                >
                  <div className="relative">
                    {chat.type === "GROUP" ? (
                      <GroupAvatars chat={chat} currentUserId={currentUser?.id} size={48} />
                    ) : (
                      <UserAvatar avatarUrl={partner?.avatar} name={name} size={48} />
                    )}
                    {isUserOnline && chat.type === "DIRECT" && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full chat-pop" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] leading-5 text-[#0B1C30] font-semibold truncate">{name}</p>
                      <span className="shrink-0 ml-2 text-[11px] text-[#6B7280]">{formatChatTime(callIsLatest ? callTime : latest?.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5 gap-2">
                      <p
                        className={`text-[13px] truncate max-w-[170px] ${
                          unread > 0 ? "text-[#0B1C30] font-semibold" : "text-[#3C494A]"
                        }`}
                      >
                        {unread >= 4 ? "4+ new messages" : unread >= 2 ? unread+" new messages" : callIsLatest ? ((call?.status==="MISSED"?"Missed ":"")+(call?.type==="VIDEO"?"Video call":"Audio call")) : sentByMe ? (latest?.pending ? "Sending…" : latest?.failed ? "Failed to send" : seenAt ? "Seen · "+formatClock(seenAt) : "Sent") : messagePreview(latest)}
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
        className={`relative flex h-full min-w-0 flex-1 flex-col bg-white ${
          activeChatId ? "flex" : "hidden lg:flex"
        }`}
      >
        {activeChatId ? (
          <>
            <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[#D3E4FE] bg-white/90 backdrop-blur-[2px] chat-fade-in">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Back to chats" className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#00696F] hover:bg-[#EFF4FF] lg:hidden"
                  onClick={() => {
                    setActiveChatId(null);
                    syncUrl(null);
                  }}
                >
                  <ArrowLeft size={24}/>
                </button>
                <div className="relative">
                  {isGroupChat && activeChat ? (
                    <GroupAvatars chat={activeChat} currentUserId={currentUser?.id} size={40} />
                  ) : (
                    <UserAvatar avatarUrl={activeAvatar} name={activeName} size={40} />
                  )}
                  {isActiveOnline && !isGroupChat && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#0B1C30]">{activeName}</p>
                  <p className="text-[12px] font-medium text-[#3C494A]">
                    {presenceLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!isGroupChat && activePartner && <button aria-label="Chat profile details" aria-expanded={detailsOpen} onClick={()=>setDetailsOpen(!detailsOpen)} className="rounded-full p-2 text-[#00696F] hover:bg-[#EFF4FF]"><Info size={20}/></button>}
                {!isGroupChat ? (
                  <>
                    <button type="button" onClick={()=>activePartner && startCall(activePartner.id,"AUDIO")} className="p-2 rounded-full hover:bg-[#EFF4FF] text-[#00696F] transition">
                      <FigmaIcon src="/figma/icons/call-phone.svg" alt="Audio Call" width={18} height={18} />
                    </button>
                    <button type="button" onClick={()=>activePartner && startCall(activePartner.id,"VIDEO")} className="p-2 rounded-full hover:bg-[#EFF4FF] text-[#00696F] transition">
                      <FigmaIcon src="/figma/icons/call-video.svg" alt="Video Call" width={20} height={16} />
                    </button>
                  </>
                ) : null}
              </div>
            </header>

            <div ref={messageScrollRef} onScroll={event=>{const el=event.currentTarget;followLatestRef.current=el.scrollHeight-el.scrollTop-el.clientHeight<80;}} className="min-h-0 flex-1 overflow-y-auto no-scrollbar bg-[#F8F9FF] px-4 py-6 [overflow-anchor:none]"><div className="flex min-h-full flex-col gap-4 [&>*]:shrink-0">
              {openingFriend || loadingMessages ? (
                <ChatMessagesSkeleton/>
              ) : messages.length === 0 ? (
                <div className="m-auto text-center chat-slide-up">
                  {isGroupChat && activeChat ? (
                    <div className="mx-auto w-fit">
                      <GroupAvatars chat={activeChat} currentUserId={currentUser?.id} size={72} />
                    </div>
                  ) : (
                    <UserAvatar avatarUrl={activeAvatar} name={activeName} size={72} className="mx-auto" />
                  )}
                  <p className="mt-3 text-[16px] font-semibold text-[#0B1C30]">{activeName}</p>
                  <p className="mt-1 text-[13px] text-[#6B7280]">
                    {isGroupChat ? "This is the beginning of the group chat." : "You are friends. Send the first message."}
                  </p>
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
                      if (msg.callRecord) {
                        const record=msg.callRecord;const mine=record.callerId===currentUser?.id;
                        const duration=record.status==='ENDED'&&record.endedAt?Math.max(0,Math.floor((new Date(record.endedAt).getTime()-new Date(record.startedAt).getTime())/1000)):0;
                        return <div key={msg.id} id={'message-'+msg.id} className={'flex '+(mine?'justify-end':'justify-start')}><button onClick={()=>activePartner&&startCall(activePartner.id,record.type)} className="flex max-w-[85%] items-center gap-3 rounded-2xl border border-[#d9e8ea] bg-white px-4 py-3 text-left shadow-sm"><span className={'flex size-10 shrink-0 items-center justify-center rounded-full '+(record.status==='MISSED'?'bg-red-50 text-red-500':'bg-[#e4f2f2] text-[#00696F]')}>{record.type==='VIDEO'?<Video size={19}/>:<Phone size={19}/>}</span><span><span className="block text-sm font-semibold text-[#0B1C30]">{record.status==='MISSED'?'Missed ':''}{record.type==='VIDEO'?'Video call':'Audio call'}</span><span className="mt-1 block text-xs text-gray-500">{mine?'Outgoing':'Incoming'} · {record.status==='ENDED'?Math.floor(duration/60)+':'+String(duration%60).padStart(2,'0'):formatClock(msg.createdAt)}</span><span className="mt-1 block text-[11px] font-medium text-[#00696F]">Tap to call back</span></span></button></div>;
                      }
                      const isMine = msg.senderId === currentUser?.id;
                      const sender =
                        activeChat?.members.find((member) => member.user.id === msg.senderId)?.user ||
                        msg.sender;

                      return (
                        <div
                          key={msg.id} id={"message-"+msg.id}
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

                          <div className={`relative flex w-fit min-w-0 items-end gap-2 max-w-[85%] sm:max-w-[65%] sm:w-fit ${isMine ? "flex-row-reverse" : ""}`}>
                            {!isMine && (
                              <UserAvatar
                                avatarUrl={sender?.avatar}
                                name={sender?.firstName}
                                size={28}
                              />
                            )}

                            <div
                              className={`relative min-w-0 max-w-[360px] rounded-2xl px-3 py-2.5 shadow-sm ${
                                isMine
                                  ? "bg-[#00696F] text-white rounded-br-none"
                                  : "bg-[#E5EEFF] text-[#0B1C30] rounded-bl-none"
                              } ${msg.isDeleted ? "italic opacity-70" : ""}`}
                            >
                              {isGroupChat && !isMine && sender?.firstName ? (
                                <p className="mb-1 text-[11px] font-semibold text-[#00696F]">
                                  {sender.firstName} {"lastName" in sender ? sender.lastName : ""}
                                </p>
                              ) : null}
                              {msg.mediaUrl && !msg.isDeleted && (
                                <div className="mb-2">
                                  {msg.type === "IMAGE" && (
                                    <div className="relative">
                                      <img
                                        src={msg.mediaUrl}
                                        alt={msg.fileName === "GIF" ? "GIF" : "Attachment"}
                                        className="w-full max-w-[240px] max-h-[240px] rounded-lg object-cover cursor-pointer"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          const sharedLink =
                                            msg.fileName === "Shared post"
                                              ? msg.body.match(/https?:\/\/[^\s]+/)?.[0]
                                              : undefined;
                                          if (sharedLink) window.location.assign(sharedLink); else setPreview(msg);
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
                                    <audio controls src={msg.mediaUrl} className="w-full max-w-60" />
                                  )}
                                  {msg.type === "VIDEO" && (
                                    <button onClick={() => setPreview(msg)} aria-label="Open video"><video src={msg.mediaUrl} className="max-w-[240px] rounded-lg" />Play video</button>
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

                              <p className="whitespace-pre-wrap [overflow-wrap:anywhere] text-[14px] leading-[1.55]">
                                {renderMessageBody(msg.body, isMine)}
                              </p>
                              <p
                                className={`mt-1 flex items-center gap-0.5 text-[10px] ${
                                  isMine ? "justify-end text-white/70" : "text-[#6B7280]"
                                }`}
                              >
                                <span>
                                  {msg.failed ? "Failed" : msg.pending ? "Sending…" : formatClock(msg.createdAt)}
                                </span>
                                {isMine && !msg.isDeleted ? (
                                  <SeenTicks
                                    seen={isMessageSeen(msg, currentUser?.id)}
                                    pending={msg.pending}
                                    failed={msg.failed}
                                  />
                                ) : null}
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
                                className={`absolute bottom-full mb-2 z-10 ${isMine ? "right-0" : "left-0"} ${
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
                                  onDelete={() => handleDeleteMessage(msg)}
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
                  <span>{isGroupChat ? "Someone is typing…" : `${activeName} is typing…`}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
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
              autoComplete="off"
              className="shrink-0 flex items-center gap-1.5 px-3 pt-3 border-t border-[#D3E4FE] bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))]"
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
                <textarea
                  ref={draftInputRef}
                  rows={1}
                  aria-label="Chat message"
                  autoComplete="off"
                  autoCorrect="on"
                  spellCheck={true}
                  enterKeyHint="send"
                  data-form-type="other"
                  value={draft}
                  onChange={handleInputChange}
                  onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();event.currentTarget.form?.requestSubmit();}}}
                  placeholder={isUploading ? "Uploading file..." : `Message ${activeName}...`}
                  disabled={isUploading}
                  className="block resize-none w-full rounded-full bg-[#EFF4FF] pl-4 pr-11 py-[10px] text-[15px] text-[#0B1C30] placeholder:text-[#6B7280] outline-none"
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
                onPointerDown={event=>{
                  if(event.isPrimary && event.button===0){
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                onClick={event=>{
                  event.preventDefault();
                  if(event.detail===0)event.currentTarget.form?.requestSubmit();
                }}
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
        ) : loadingChats ? <ChatMessagesSkeleton/> : (
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

      {loadingChats && !activePartner && <ChatProfileSkeleton/>}
      {preview?.mediaUrl && <div role="dialog" aria-modal="true" aria-label="Media preview" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-8" onClick={() => setPreview(null)}><button autoFocus className="absolute right-6 top-6 text-white" onClick={() => setPreview(null)}>Close ✕</button><div onClick={e=>e.stopPropagation()}>{preview.type === "VIDEO" ? <video controls autoPlay src={preview.mediaUrl} className="max-h-[85vh] max-w-full"/> : <img src={preview.mediaUrl} alt="Attachment" className="max-h-[85vh] max-w-full object-contain"/>}</div></div>}
      {activeChatId && activePartner && !isGroupChat && <ChatProfilePanel onMediaClick={setPreview} chatId={activeChatId} messages={messages} user={activePartner} name={activeName} online={isActiveOnline} open={detailsOpen} onClose={()=>setDetailsOpen(false)}/>}
      {showNewChat && (
        <div className="absolute inset-0 z-20 flex bg-black/20 chat-fade-in">
          <div className="m-auto w-[min(420px,92%)] max-h-[80%] overflow-hidden rounded-2xl bg-white shadow-xl chat-slide-up">
            <div className="flex items-center justify-between border-b border-[#D3E4FE] px-4 py-3">
              <h3 className="text-[15px] font-semibold text-[#0B1C30]">
                {newChatTab === "group" ? "New group" : "New chat"}
              </h3>
              <button
                type="button"
                onClick={() => setShowNewChat(false)}
                className="text-[#6B7280] hover:text-[#0B1C30]"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 px-3 pt-3">
              <button
                type="button"
                onClick={() => setNewChatTab("direct")}
                className={`rounded-full py-2 text-[13px] font-semibold ${
                  newChatTab === "direct" ? "bg-[#00696F] text-white" : "bg-[#EFF4FF] text-[#3C494A]"
                }`}
              >
                Friend
              </button>
              <button
                type="button"
                onClick={() => setNewChatTab("group")}
                className={`rounded-full py-2 text-[13px] font-semibold ${
                  newChatTab === "group" ? "bg-[#00696F] text-white" : "bg-[#EFF4FF] text-[#3C494A]"
                }`}
              >
                Group
              </button>
            </div>
            {newChatTab === "group" ? (
              <div className="px-3 pt-3">
                <input
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="Group name"
                  className="w-full rounded-full bg-[#EFF4FF] px-4 py-2 text-[14px] outline-none"
                />
              </div>
            ) : null}
            <div className="p-3">
              <input
                value={friendQuery}
                onChange={(event) => setFriendQuery(event.target.value)}
                placeholder={newChatTab === "group" ? "Add friends" : "Search friends"}
                className="w-full rounded-full bg-[#EFF4FF] px-4 py-2 text-[14px] outline-none"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto no-scrollbar px-2 pb-3">
              {loadingFriends ? (
                <p className="py-8 text-center text-[13px] text-[#6B7280]">Loading friends…</p>
              ) : visibleFriends.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-[#6B7280]">
                  Add friends first, then you can message them.
                </p>
              ) : (
                visibleFriends.map((friend) => {
                  const selected = selectedFriendIds.includes(friend.id);
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() =>
                        newChatTab === "group"
                          ? toggleFriendSelect(friend.id)
                          : void openFriendChat(friend.id)
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-[#EFF4FF] transition"
                    >
                      <UserAvatar
                        avatarUrl={friend.avatar}
                        name={`${friend.firstName} ${friend.lastName}`}
                        size={40}
                        isOnline={friend.isOnline || onlineUsers.has(friend.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-[#0B1C30]">
                          {friend.firstName} {friend.lastName}
                        </p>
                        <p className="text-[12px] text-[#6B7280]">
                          {onlineUsers.has(friend.id) ? "Active now" : "Friend"}
                        </p>
                      </div>
                      {newChatTab === "group" ? (
                        <span
                          className={`size-5 rounded-full border ${
                            selected ? "border-[#00696F] bg-[#00696F]" : "border-[#D1D5DB]"
                          }`}
                        />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
            {newChatTab === "group" ? (
              <div className="border-t border-[#D3E4FE] p-3">
                <button
                  type="button"
                  disabled={!groupName.trim() || selectedFriendIds.length < 1 || creatingGroup}
                  onClick={() => void handleCreateGroupChat()}
                  className="w-full rounded-full bg-[#00696F] py-2.5 text-[14px] font-semibold text-white disabled:opacity-50"
                >
                  {creatingGroup
                    ? "Creating…"
                    : `Create group${selectedFriendIds.length ? ` (${selectedFriendIds.length})` : ""}`}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {deleteTarget ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 px-4 chat-fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-message-title"
            className="w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-xl chat-slide-up"
          >
            <h3 id="delete-message-title" className="text-[18px] font-bold text-[#111827]">
              Delete this message?
            </h3>
            <p className="mt-2 text-[14px] leading-5 text-[#6B7280]">
              This message will be deleted for everyone in the chat. This cannot be undone.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-[8px] bg-[#F3F4F6] py-2.5 text-[14px] font-bold text-[#4B5563]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void confirmDeleteMessage()}
                className="rounded-[8px] bg-[#DC2626] py-2.5 text-[14px] font-bold text-white disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


