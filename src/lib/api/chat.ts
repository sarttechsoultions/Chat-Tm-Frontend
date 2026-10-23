import { getSessionToken } from "../auth";
import { apiUrl } from "../apiUrl";

async function chatRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getSessionToken();
  const res = await fetch(apiUrl(path), {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: "include",
  });

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
    data?: T;
  };

  if (!res.ok) {
    throw new Error(json.message || "Chat request failed");
  }

  return json.data as T;
}

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  username?: string;
  isActive?: boolean;
};

export type Reaction = {
  id: string;
  emoji: string;
  userId: string;
  user: { id: string; firstName: string; username: string };
};

export type ReplyMessage = {
  id: string;
  body: string;
  type: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
  mediaUrl?: string | null;
  isDeleted: boolean;
  sender: { id: string; firstName: string; username: string };
};

export type Message = {
  clientMessageId?: string | null;
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  type: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
  mediaUrl?: string | null;
  fileSize?: number | null;
  fileName?: string | null;
  replyTo?: ReplyMessage | null;
  replyToId?: string | null;
  reactions?: Reaction[];
  isDeleted?: boolean;
  createdAt: string;
  sender?: User;
  pending?: boolean;
  failed?: boolean;
  readBy?: { userId: string; firstName: string }[];
};

export type ConversationMember = {
  userId: string;
  lastReadAt?: string | null;
  user: User;
};

export type Conversation = {
  isBlocked?: boolean;
  id: string;
  type: "DIRECT" | "GROUP";
  name?: string;
  avatar?: string;
  unreadCount?: number;
  lastReadAt?: string | null;
  updatedAt?: string;
  members: ConversationMember[];
  messages: Message[];
};

export async function fetchConversations(): Promise<Conversation[]> {
  const data = await chatRequest<Conversation[]>("/conversations");
  return Array.isArray(data) ? data : [];
}

const pendingHistory = new Map<string, Promise<Message[]>>();
export function fetchMessages(conversationId: string, cursor?: string): Promise<Message[]> {
  // Share only in-flight reads. Include the session so accounts cannot share results.
  const key = `${getSessionToken()}:${conversationId}:${cursor || ""}`;
  const existing = pendingHistory.get(key);
  if (existing) return existing;
  const request = chatRequest<Message[] | { items: Message[]; senders: User[] }>(
    `/messages/${conversationId}?limit=80&compact=1${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`
  ).then(data => {
    if (Array.isArray(data)) return data;
    const senders = new Map(data.senders.map(sender => [sender.id, sender]));
    return data.items.map(message => ({ ...message, sender: senders.get(message.senderId) }));
  }).finally(() => { pendingHistory.delete(key); });
  pendingHistory.set(key, request);
  return request;
}

export async function createDirectConversation(targetUserId: string): Promise<Conversation> {
  return chatRequest<Conversation>("/conversations/direct", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId }),
  });
}

export async function createGroupConversation(
  name: string,
  memberIds: string[]
): Promise<Conversation> {
  return chatRequest<Conversation>("/conversations/group", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, memberIds }),
  });
}

export type GifItem = {
  id: string;
  title: string;
  url: string;
  preview: string;
};

export async function sendMessage(
  conversationId: string,
  body: string,
  replyToId?: string,
  extra?: { type?: Message["type"]; mediaUrl?: string; fileName?: string; clientMessageId?: string }
): Promise<Message> {
  return chatRequest<Message>(`/messages/${conversationId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, replyToId, clientMessageId: extra?.clientMessageId || crypto.randomUUID(), ...extra }),
  });
}

export async function searchGifs(query = ""): Promise<GifItem[]> {
  const path = query.trim()
    ? `/gifs?q=${encodeURIComponent(query.trim())}`
    : "/gifs";
  const data = await chatRequest<GifItem[]>(path);
  return Array.isArray(data) ? data : [];
}

export async function sendAttachment(
  conversationId: string,
  formData: FormData
): Promise<Message> {
  return chatRequest<Message>(`/messages/${conversationId}/attachment`, {
    method: "POST",
    body: formData,
  });
}

export async function toggleMessageReaction(
  messageId: string,
  emoji: string
): Promise<Reaction[]> {
  return chatRequest<Reaction[]>(`/messages/${messageId}/react`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emoji }),
  });
}

export async function deleteMessageForEveryone(messageId: string): Promise<unknown> {
  return chatRequest(`/messages/${messageId}`, { method: "DELETE" });
}

export const UNREAD_CHANGED_EVENT = "chattm:unread-changed";

export function notifyUnreadChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(UNREAD_CHANGED_EVENT));
}

let unreadInFlight: { token: string; promise: Promise<number> } | null = null;
export async function fetchUnreadCount(): Promise<number> {
  const token = getSessionToken();
  if (!token) return 0;
  if (unreadInFlight?.token === token) return unreadInFlight.promise;
  const promise = chatRequest<{ count: number }>("/conversations/unread-count")
    .then(data => typeof data?.count === "number" ? data.count : 0);
  unreadInFlight = { token, promise };
  try { return await promise; }
  finally { if (unreadInFlight?.promise === promise) unreadInFlight = null; }
}

export async function markConversationRead(conversationId: string) {
  const result = await chatRequest(`/conversations/${conversationId}/read`, { method: "POST" });
  notifyUnreadChanged();
  return result;
}

export function extractIncomingMessage(payload: unknown): Message | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;

  if (data.message && typeof data.message === "object") {
    const nested = data.message as Message;
    if (nested.id) {
      return {
        ...nested,
        conversationId: nested.conversationId || (data.conversationId as string),
      };
    }
  }

  if (typeof data.id === "string" && typeof data.conversationId === "string") {
    return data as unknown as Message;
  }

  return null;
}
