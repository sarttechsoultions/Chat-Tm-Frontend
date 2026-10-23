import { getSessionToken } from "../auth";
import { apiUrl } from "../apiUrl";

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  data: Record<string, string> | null;
  createdAt: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getSessionToken();
  const response = await fetch(apiUrl(`/notifications${path}`), {
    ...init,
    credentials: "include",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers },
  });
  const json = await response.json().catch(() => ({})) as { message?: string; data?: T };
  if (!response.ok) throw new Error(json.message || "Could not load notifications");
  return json.data as T;
}

export const fetchNotifications = () => request<{ items: AppNotification[]; unreadCount: number }>("?limit=30");
export const fetchNotificationUnreadCount = async () => (await request<{ count: number }>("/unread-count")).count;
export const markNotificationRead = (id: string) => request(`/${encodeURIComponent(id)}/read`, { method: "POST" });
export const markAllNotificationsRead = () => request<{ updated: number }>("/read-all", { method: "POST" });
