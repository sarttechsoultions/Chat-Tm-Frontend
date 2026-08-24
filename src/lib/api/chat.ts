import { getSessionToken } from "../auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

async function chatRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getSessionToken();
  const res = await fetch(`${API_BASE}${path}`, {
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
};

export type Conversation = {
  id: string;
  type: "DIRECT" | "GROUP";
  unreadCount?: number;
  lastReadAt?: string | null;
  updatedAt?: string;
  members: { userId: string; user: User }[];
  messages: Message[];
};

export async function fetchConversations(): Promise<Conversation[]> {
  const data = await chatRequest<Conversation[]>("/conversations");
  return Array.isArray(data) ? data : [];
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const data = await chatRequest<Message[]>(`/messages/${conversationId}?limit=80`);
  return Array.isArray(data) ? data : [];
}

export async function createDirectConversation(targetUserId: string): Promise<Conversation> {
  return chatRequest<Conversation>("/conversations/direct", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId }),
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
  extra?: { type?: Message["type"]; mediaUrl?: string; fileName?: string }
): Promise<Message> {
  return chatRequest<Message>(`/messages/${conversationId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, replyToId, ...extra }),
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

export async function fetchUnreadCount(): Promise<number> {
  if (!getSessionToken()) return 0;
  const data = await chatRequest<{ count: number }>("/conversations/unread-count");
  return typeof data?.count === "number" ? data.count : 0;
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
