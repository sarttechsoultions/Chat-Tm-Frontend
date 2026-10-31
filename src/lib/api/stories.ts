import { getSessionToken } from "../auth";
import { apiUrl } from "../apiUrl";
import type { PostAuthor } from "./posts";
export type StoryTextLayer = { id: string; text: string; position: { x: number; y: number }; fontFamily: "inherit" | "serif" | "monospace" | "cursive"; bold: boolean; italic: boolean; align: "left" | "center" | "right"; size: number; color: string };
export type StoryPresentation = { allowReplies?: boolean; thumbnailUrl?: string; audience?: "FRIENDS" | "CLOSE_FRIENDS"; imageTransform?: { zoom: number; rotation: number; x: number; y: number; flipX: boolean; flipY: boolean }; texts?: StoryTextLayer[]; fontFamily?: "inherit" | "serif" | "monospace" | "cursive"; bold?: boolean; italic?: boolean; align?: "left" | "center" | "right"; textPosition?: { x: number; y: number }; timePosition?: { x: number; y: number }; time?: string; textColor?: string; textSize?: number; musicUrl?: string; musicName?: string };
export type Story = { muted?: boolean; presentation?: StoryPresentation; id: string; authorId: string; author: PostAuthor; mediaUrl: string; caption: string; createdAt: string; expiresAt: string; viewed: boolean; viewsCount: number };
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getSessionToken();
  const res = await fetch(apiUrl(`/stories${path}`), { ...options, credentials: "include", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const json = await res.json(); if (!res.ok) throw new Error(json.message || "Story request failed"); return json.data;
}
export const listStories = () => request<{ items: Story[] }>("");
export const viewStory = (id: string) => request(`/${id}/view`, { method: "POST" });
export const deleteStory = (id: string) => request(`/${id}`, { method: "DELETE" });
export function createStory(file: File, caption: string, presentation: StoryPresentation = {}, music?: File | null, audience = "FRIENDS", onProgress?: (percent: number) => void) { const body = new FormData(); body.append("media", file); body.append("audience", audience); body.append("caption", caption); body.append("presentation", JSON.stringify(presentation)); if (music) body.append("music", music); return new Promise<Story>((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", apiUrl("/stories")); xhr.withCredentials = true;
  const token = getSessionToken(); if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  xhr.upload.onprogress = event => { if (event.lengthComputable) onProgress?.(Math.round(event.loaded / event.total * 100)); };
  xhr.onload = () => { try { const result = JSON.parse(xhr.responseText); if (xhr.status < 200 || xhr.status >= 300) reject(new Error(result.message || "Unable to share story")); else resolve(result.data); } catch { reject(new Error("Invalid server response. Check your stories before retrying.")); } };
  xhr.onerror = () => reject(new Error("Connection lost. Check your stories before retrying."));
  xhr.onabort = () => reject(new Error("Upload cancelled."));
  xhr.send(body);
}); }

export const getCloseFriends = () => request<{ ids: string[] }>("/close-friends");
export const saveCloseFriends = (ids: string[]) => request<{ ids: string[] }>("/close-friends", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });

export const getStoryViewers = (id: string) => request<{ items: { viewedAt: string; user: PostAuthor; reaction?: string | null }[]; count: number }>(`/${id}/viewers`);

export const replyToStory = (id: string, body: string) => request<{ conversationId: string }>(`/${id}/reply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
export const getStoryReaction = (id: string) => request<{reaction: string | null}>(`/${id}/reaction`);
export const setStoryReaction = (id: string, reaction: string | null) => request<{reaction: string | null}>(`/${id}/reaction`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({reaction}) });
export const getHiddenStoryFriends = () => request<{ids:string[]}>("/hidden-friends");
export const saveHiddenStoryFriends = (ids: string[]) => request<{ids:string[]}>("/hidden-friends", {method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ids})});
export const muteStoryAuthor = (authorId:string, muted:boolean) => request(`/muted-authors/${authorId}`, {method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({muted})});
export const reportStory = (id:string, reason:string) => request(`/${id}/report`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({reason})});
