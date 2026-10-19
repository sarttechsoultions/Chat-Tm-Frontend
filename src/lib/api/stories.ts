import { getSessionToken } from "../auth";
import { apiUrl } from "../apiUrl";
import type { PostAuthor } from "./posts";
export type StoryTextLayer = { id: string; text: string; position: { x: number; y: number }; fontFamily: "inherit" | "serif" | "monospace" | "cursive"; bold: boolean; italic: boolean; align: "left" | "center" | "right"; size: number; color: string };
export type StoryPresentation = { imageTransform?: { zoom: number; rotation: number; x: number; y: number; flipX: boolean; flipY: boolean }; texts?: StoryTextLayer[]; fontFamily?: "inherit" | "serif" | "monospace" | "cursive"; bold?: boolean; italic?: boolean; align?: "left" | "center" | "right"; textPosition?: { x: number; y: number }; timePosition?: { x: number; y: number }; time?: string; textColor?: string; textSize?: number; musicUrl?: string; musicName?: string };
export type Story = { presentation?: StoryPresentation; id: string; authorId: string; author: PostAuthor; mediaUrl: string; caption: string; createdAt: string; expiresAt: string; viewed: boolean; viewsCount: number };
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getSessionToken();
  const res = await fetch(apiUrl(`/stories${path}`), { ...options, credentials: "include", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const json = await res.json(); if (!res.ok) throw new Error(json.message || "Story request failed"); return json.data;
}
export const listStories = () => request<{ items: Story[] }>("");
export const viewStory = (id: string) => request(`/${id}/view`, { method: "POST" });
export const deleteStory = (id: string) => request(`/${id}`, { method: "DELETE" });
export function createStory(file: File, caption: string, presentation: StoryPresentation = {}, music?: File | null, audience = "FRIENDS") { const body = new FormData(); body.append("media", file); body.append("audience", audience); body.append("caption", caption); body.append("presentation", JSON.stringify(presentation)); if (music) body.append("music", music); return request<Story>("", { method: "POST", body }); }

export const getCloseFriends = () => request<{ ids: string[] }>("/close-friends");
export const saveCloseFriends = (ids: string[]) => request<{ ids: string[] }>("/close-friends", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });

export const getStoryViewers = (id: string) => request<{ items: { viewedAt: string; user: PostAuthor }[]; count: number }>(`/${id}/viewers`);

export const replyToStory = (id: string, body: string) => request<{ conversationId: string }>(`/${id}/reply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
