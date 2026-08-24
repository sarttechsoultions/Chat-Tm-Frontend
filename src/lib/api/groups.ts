import { getSessionToken } from "../auth";
import { apiUrl } from "../apiUrl";

async function groupRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
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
    throw new Error(json.message || "Group request failed");
  }

  return json.data as T;
}

export type GroupUser = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
  isVerified?: boolean;
};

export type CommunityGroup = {
  id: string;
  name: string;
  description: string;
  coverPhoto: string;
  category?: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt?: string;
  latestPostAt?: string;
  owner: GroupUser;
  membersCount: number;
  postsCount: number;
  myRole: "MEMBER" | "MODERATOR" | "ADMIN" | null;
  isMember: boolean;
  isOwner: boolean;
  members: GroupUser[];
};

function itemsOf(data: { items?: CommunityGroup[] } | CommunityGroup[] | undefined) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.items) ? data.items : [];
}

export async function fetchMyGroups(): Promise<CommunityGroup[]> {
  return itemsOf(await groupRequest<{ items: CommunityGroup[] }>("/groups"));
}

export async function fetchDiscoverGroups(): Promise<CommunityGroup[]> {
  return itemsOf(await groupRequest<{ items: CommunityGroup[] }>("/groups/discover"));
}

export async function fetchGroupActivity(): Promise<import("./posts").PostItem[]> {
  const data = await groupRequest<{ items: import("./posts").PostItem[] }>("/groups/activity");
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

export async function fetchGroup(id: string): Promise<CommunityGroup> {
  return groupRequest<CommunityGroup>(`/groups/${id}`);
}

export async function createGroup(input: {
  name: string;
  description?: string;
  category?: string;
  isPrivate?: boolean;
  cover?: File | null;
}): Promise<CommunityGroup> {
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("description", input.description || "");
  formData.append("category", input.category || "");
  formData.append("isPrivate", String(Boolean(input.isPrivate)));
  if (input.cover) formData.append("cover", input.cover);
  return groupRequest<CommunityGroup>("/groups", { method: "POST", body: formData });
}

export async function joinGroup(id: string): Promise<CommunityGroup> {
  return groupRequest<CommunityGroup>(`/groups/${id}/join`, { method: "POST" });
}

export async function leaveGroup(id: string): Promise<unknown> {
  return groupRequest(`/groups/${id}/leave`, { method: "POST" });
}

export async function addGroupMembers(id: string, userIds: string[]): Promise<CommunityGroup> {
  return groupRequest<CommunityGroup>(`/groups/${id}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userIds }),
  });
}

export async function deleteGroup(id: string): Promise<unknown> {
  return groupRequest(`/groups/${id}`, { method: "DELETE" });
}
