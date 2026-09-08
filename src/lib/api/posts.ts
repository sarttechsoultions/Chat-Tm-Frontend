import { getSessionToken } from "../auth";
import { apiUrl } from "../apiUrl";

async function postRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
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
    throw new Error(json.message || "Post request failed");
  }

  return json.data as T;
}

export type PostAuthor = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
  isVerified: boolean;
};

export type PostItem = {
  id: string;
  body: string;
  heading?: string;
  privacy: "PUBLIC" | "FRIENDS" | "PRIVATE";
  location?: string;
  feeling?: string;
  createdAt: string;
  updatedAt?: string;
  edited?: boolean;
  author: PostAuthor;
  media: { id: string; url: string; type: string; sortOrder: number }[];
  mentions?: PostAuthor[];
  likedBy?: PostAuthor[];
  likesCount: number;
  commentsCount: number;
  sharesCount?: number;
  group?: { id: string; name: string } | null;
  liked: boolean;
};

export type PostComment = {
  id: string;
  body: string;
  createdAt: string;
  author: PostAuthor;
};

export async function fetchPosts(authorId?: string, groupId?: string): Promise<PostItem[]> {
  const params = new URLSearchParams();
  if (authorId) params.set("authorId", authorId);
  if (groupId) params.set("groupId", groupId);
  const query = params.toString();
  const path = query ? `/posts?${query}` : "/posts";
  const data = await postRequest<{ items: PostItem[] }>(path);
  return Array.isArray(data?.items) ? data.items : [];
}

export async function createPost(input: {
  body: string;
  heading?: string;
  privacy?: string;
  location?: string;
  feeling?: string;
  mentionIds?: string[];
  groupId?: string;
  files?: File[];
}): Promise<PostItem> {
  const formData = new FormData();
  formData.append("body", input.body);
  if (input.heading) formData.append("heading", input.heading);
  formData.append("privacy", input.privacy || "PUBLIC");
  if (input.location) formData.append("location", input.location);
  if (input.feeling) formData.append("feeling", input.feeling);
  if (input.groupId) formData.append("groupId", input.groupId);
  if (input.mentionIds?.length) formData.append("mentionIds", JSON.stringify(input.mentionIds));
  (input.files || []).forEach((file) => formData.append("media", file));
  return postRequest<PostItem>("/posts", { method: "POST", body: formData });
}

export async function fetchPost(postId: string): Promise<PostItem> {
  return postRequest<PostItem>(`/posts/${encodeURIComponent(postId)}`);
}

export async function updatePost(
  postId: string,
  input: {
    body: string;
    heading?: string;
    privacy?: string;
    location?: string;
    feeling?: string;
    mentionIds?: string[];
    keepMediaIds?: string[];
    files?: File[];
  },
): Promise<PostItem> {
  const formData = new FormData();
  formData.append("body", input.body);
  if (input.heading !== undefined) formData.append("heading", input.heading);
  formData.append("privacy", input.privacy || "PUBLIC");
  if (input.location !== undefined) formData.append("location", input.location);
  if (input.feeling !== undefined) formData.append("feeling", input.feeling);
  if (input.mentionIds) formData.append("mentionIds", JSON.stringify(input.mentionIds));
  formData.append("keepMediaIds", JSON.stringify(input.keepMediaIds || []));
  (input.files || []).forEach((file) => formData.append("media", file));
  return postRequest<PostItem>(`/posts/${encodeURIComponent(postId)}`, {
    method: "PATCH",
    body: formData,
  });
}

export async function togglePostLike(postId: string): Promise<PostItem> {
  return postRequest<PostItem>(`/posts/${postId}/like`, { method: "POST" });
}

export async function fetchPostComments(postId: string): Promise<PostComment[]> {
  const data = await postRequest<{ items: PostComment[] }>(`/posts/${postId}/comments`);
  return Array.isArray(data?.items) ? data.items : [];
}

export async function addPostComment(postId: string, body: string): Promise<PostComment> {
  return postRequest<PostComment>(`/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
}

export async function deletePost(postId: string): Promise<unknown> {
  return postRequest(`/posts/${postId}`, { method: "DELETE" });
}

export async function sharePost(postId: string): Promise<PostItem> {
  return postRequest<PostItem>(`/posts/${postId}/share`, { method: "POST" });
}

export async function searchLocations(query: string): Promise<{ id: string; label: string; detail: string; type: string }[]> {
  if (query.trim().length < 2) return [];
  const data = await postRequest<{ items: { id: string; label: string; detail: string; type: string }[] }>(
    `/locations?q=${encodeURIComponent(query.trim())}`
  );
  return Array.isArray(data?.items) ? data.items : [];
}

export function postShareUrl(username: string, postId: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/profile/${username}#post-${postId}`;
}
