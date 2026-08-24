import { getSessionToken, type AuthUser, type FriendUser } from "../auth";
import type { PostItem, PostAuthor } from "./posts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json.data as T;
}

export type FriendshipStatus =
  | "SELF"
  | "NONE"
  | "FRIENDS"
  | "PENDING_OUT"
  | "PENDING_IN"
  | "BLOCKED";

export type ProfileUser = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
  coverPhoto: string;
  bio: string;
  location: string;
  website: string;
  gender: string;
  dateOfBirth: string | null;
  isVerified: boolean;
  verificationStatus: string;
  createdAt: string;
};

export type ProfileData = {
  user: ProfileUser;
  isOwn: boolean;
  friendship: { status: FriendshipStatus; requestId: string | null };
  stats: { friends: number; posts: number; photos: number };
  friends: FriendUser[];
  photos: { id: string; url: string; postId: string }[];
  posts: PostItem[];
};

export async function fetchMyProfile() {
  return request<ProfileData>("/users/me/profile");
}

export async function fetchProfile(username: string) {
  return request<ProfileData>(`/users/profile/${encodeURIComponent(username)}`);
}

export async function searchPeople(query: string): Promise<PostAuthor[]> {
  const data = await request<{ items: PostAuthor[] }>(
    `/users/search?q=${encodeURIComponent(query)}`
  );
  return Array.isArray(data?.items) ? data.items : [];
}

export async function updateProfile(input: {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: File | null;
  coverPhoto?: File | null;
}): Promise<{ user: AuthUser }> {
  const formData = new FormData();
  if (input.firstName !== undefined) formData.append("firstName", input.firstName);
  if (input.lastName !== undefined) formData.append("lastName", input.lastName);
  if (input.bio !== undefined) formData.append("bio", input.bio);
  if (input.location !== undefined) formData.append("location", input.location);
  if (input.website !== undefined) formData.append("website", input.website);
  if (input.avatar) formData.append("avatar", input.avatar);
  if (input.coverPhoto) formData.append("coverPhoto", input.coverPhoto);
  return request<{ user: AuthUser }>("/users/me", { method: "PATCH", body: formData });
}
