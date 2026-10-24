import { getSessionToken } from "../auth";

export type PostAuthor = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
  isVerified: boolean;
};

export type PostMedia = {
  id: string;
  url: string;
  type: string;
  sortOrder: number;
};

export type PostItem = {
  id: string;
  body: string;
  heading: string;
  privacy: "PUBLIC" | "FRIENDS" | "PRIVATE";
  location: string;
  feeling: string;
  createdAt: string;
  updatedAt: string;
  edited: boolean;
  author: PostAuthor;
  media: PostMedia[];
  mentions: PostAuthor[];
  likedBy: PostAuthor[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  liked: boolean;
  saved?: boolean;
  hidden?: boolean;
  group?: { id: string; name: string } | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export class PostRequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "PostRequestError";
  }
}

async function postRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getSessionToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new PostRequestError(data?.message || "Post request failed", response.status);
  }
  return data.data;
}

export type PostComment = {
  id: string;
  postId?: string;
  parentId?: string | null;
  body: string;
  createdAt: string;
  author: PostAuthor | null;
  edited?: boolean;
  deleted?: boolean;
  visible?: boolean;
  commentsCount?: number;
  parentRepliesCount?: number;
  likesCount?: number;
  liked?: boolean;
  repliesCount?: number;
  replies?: PostComment[];
  repliesHasMore?: boolean;
  repliesNextCursor?: string | null;
};

export type CommentPage = { items: PostComment[]; nextCursor: string | null; hasMore: boolean; commentsCount: number };
export type ReplyPage = { items: PostComment[]; nextCursor: string | null; hasMore: boolean; repliesCount: number };
export type CommentMutation = { commentId: string; parentId: string | null; comment: PostComment | null; commentsCount: number; repliesCount: number; moderated?: boolean };

export type PaginatedPosts = {
  items: PostItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

export async function fetchPosts(authorId?: string, groupId?: string): Promise<PostItem[]> {
  const result = await fetchPostsWithPagination({ authorId, groupId, limit: 40 });
  return result.items;
}

export async function fetchPostsWithPagination(options: {
  authorId?: string;
  groupId?: string;
  cursor?: string;
  limit?: number;
} = {}): Promise<PaginatedPosts> {
  const params = new URLSearchParams();
  if (options.authorId) params.set("authorId", options.authorId);
  if (options.groupId) params.set("groupId", options.groupId);
  if (options.cursor) params.set("cursor", options.cursor);
  if (options.limit) params.set("limit", String(options.limit));
  const query = params.toString();
  const path = query ? `/posts?${query}` : "/posts";
  const data = await postRequest<{
    items: PostItem[];
    nextCursor?: string | null;
    hasMore?: boolean;
  }>(path);
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    nextCursor: data?.nextCursor ?? null,
    hasMore: Boolean(data?.hasMore),
  };
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
  const data = await fetchPostCommentPage(postId);
  return Array.isArray(data?.items) ? data.items : [];
}

export async function fetchPostCommentPage(postId: string, cursor?: string): Promise<CommentPage> {
  const params = new URLSearchParams({ limit: "15" });
  if (cursor) params.set("cursor", cursor);
  return postRequest(`/posts/${encodeURIComponent(postId)}/comments?${params}`);
}

export async function fetchPostReplyPage(postId: string, commentId: string, cursor?: string): Promise<ReplyPage> {
  const params = new URLSearchParams({ limit: "10" });
  if (cursor) params.set("cursor", cursor);
  return postRequest(`/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/replies?${params}`);
}

export async function editPostComment(postId: string, commentId: string, body: string): Promise<CommentMutation> {
  return postRequest(`/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }),
  });
}

export async function deletePostComment(postId: string, commentId: string): Promise<CommentMutation> {
  return postRequest(`/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`, { method: "DELETE" });
}

export async function addPostComment(
  postId: string,
  body: string,
  parentId?: string
): Promise<PostComment> {
  return postRequest<PostComment>(`/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, parentId }),
  });
}

export async function toggleCommentLike(
  postId: string,
  commentId: string
): Promise<{ id: string; liked: boolean; likesCount: number }> {
  return postRequest<{ id: string; liked: boolean; likesCount: number }>(
    `/posts/${postId}/comments/${commentId}/like`,
    { method: "POST" }
  );
}

export async function deletePost(postId: string): Promise<unknown> {
  return postRequest(`/posts/${postId}`, { method: "DELETE" });
}

export async function sharePost(postId: string): Promise<PostItem> {
  return postRequest<PostItem>(`/posts/${postId}/share`, { method: "POST" });
}

export type PostPreferences = { saved: boolean; hidden: boolean };

export async function setPostSaved(postId: string, saved: boolean): Promise<PostPreferences> {
  return postRequest(`/posts/${encodeURIComponent(postId)}/save`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ saved }),
  });
}

export async function setPostHidden(postId: string, hidden: boolean): Promise<PostPreferences> {
  return postRequest(`/posts/${encodeURIComponent(postId)}/hide`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hidden }),
  });
}

export async function fetchPostLibrary(view: "saved" | "hidden", cursor?: string): Promise<PaginatedPosts> {
  const params = new URLSearchParams({ view, limit: "15" });
  if (cursor) params.set("cursor", cursor);
  return postRequest(`/posts/library?${params}`);
}

export const POST_REPORT_REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "SCAM", label: "Scam or fraud" },
  { value: "HARASSMENT", label: "Bullying or harassment" },
  { value: "HATE", label: "Hateful content" },
  { value: "VIOLENCE", label: "Violence or threats" },
  { value: "SEXUAL_CONTENT", label: "Sexual content" },
  { value: "OTHER", label: "Something else" },
] as const;

export type PostReportReason = (typeof POST_REPORT_REASONS)[number]["value"];

export async function reportPost(postId: string, reason: PostReportReason, details: string): Promise<{ id: string; alreadyReported: boolean }> {
  return postRequest(`/posts/${encodeURIComponent(postId)}/report`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, details }),
  });
}

export async function searchLocations(query: string): Promise<{ id: string; label: string; detail: string; type: string }[]> {
  if (query.trim().length < 2) return [];
  const data = await postRequest<{ items: { id: string; label: string; detail: string; type: string }[] }>(
    `/locations?q=${encodeURIComponent(query.trim())}`
  );
  return Array.isArray(data?.items) ? data.items : [];
}

export function postShareUrl(postId: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/posts/${encodeURIComponent(postId)}`;
}
