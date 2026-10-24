"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Clapperboard, Images, LockKeyhole, Play, RefreshCw } from "lucide-react";
import { fetchPost, PostRequestError, type PostItem } from "../../lib/api/posts";
import { getSessionToken } from "../../lib/auth";
import { sharedVideoPoster } from "../../lib/sharedPost";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { UserAvatar } from "../ui/UserAvatar";

// Reuse simultaneous reads only; never retain a preview across accounts or visits.
const pending = new Map<string, Promise<PostItem>>();
function readPreview(postId: string) {
  const key = `${getSessionToken()}:${postId}`;
  const existing = pending.get(key);
  if (existing) return existing;
  const request = fetchPost(postId).finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}

function Preview({ postId }: { postId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [post, setPost] = useState<PostItem | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [mediaError, setMediaError] = useState(false);
  useEffect(() => {
    let cancelled = false, started = false, visible = false;
    const load = () => {
      if (started || cancelled) return;
      started = true;
      readPreview(postId).then(value => { if (!cancelled) { setPost(value); setState("ready"); } }).catch(err => {
        if (!cancelled) { setPost(null); setState(err instanceof PostRequestError && [403,404,410].includes(err.status) ? "unavailable" : "error"); }
      });
    };
    const refresh = () => {
      if (!visible || document.hidden) return;
      started = false; setPost(null); setState("loading"); setMediaError(false); load();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) load(); }, { rootMargin: "160px" });
    if (ref.current) observer.observe(ref.current);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { cancelled = true; observer.disconnect(); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [postId, attempt]);
  const media = post?.media[0];
  const video = Boolean(media?.type.toLowerCase().includes("video"));
  const imageSource = media ? video ? sharedVideoPoster(media.url) : media.url : null;
  const href = video ? `/watch?reel=${encodeURIComponent(postId)}` : `/posts/${encodeURIComponent(postId)}`;
  return <div ref={ref} data-shared-post={postId} className="relative w-[min(260px,55vw)] overflow-hidden rounded-[20px] border border-[#DCE6E7] bg-white text-[#0B1C30] shadow-sm sm:w-[260px]">
    {state === "loading" ? <div role="status" className="flex min-h-44 animate-pulse flex-col justify-center gap-3 p-4"><div className="h-7 w-3/4 rounded-full bg-[#E7EFF0]"/><div className="h-20 rounded-xl bg-[#F0F5F5]"/><span className="text-xs text-[#6B7280]">Loading shared post…</span></div> : null}
    {state === "unavailable" || state === "error" ? <div className="px-5 py-7 text-center">
      <LockKeyhole size={26} className="mx-auto mb-3 text-[#7B9396]" aria-hidden="true"/>
      <p className="text-sm font-semibold">{state === "unavailable" ? "Post unavailable" : "Couldn’t load preview"}</p>
      <p className="mt-2 text-xs leading-5 text-[#6B7280]">{state === "unavailable" ? "It may have been removed or shared with a different audience." : "Check your connection and try again."}</p>
      {state === "error" ? <button type="button" onClick={event => { event.stopPropagation(); setState("loading"); setAttempt(value => value + 1); }} className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-[#00696F]"><RefreshCw size={14}/>Retry preview</button> : null}
    </div> : null}
    {state === "ready" && post ? <Link href={href} prefetch={false} aria-label={video ? `Open reel by ${post.author.username}` : `Open post by ${post.author.username}`} onClick={event => event.stopPropagation()} className="block outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-[#00696F]">
      <div className={`flex items-center gap-2.5 px-3 py-3 ${video ? "absolute z-10 w-[min(260px,55vw)] rounded-t-[20px] bg-gradient-to-b from-black/75 to-transparent text-white sm:w-[260px]" : ""}`}>
        <UserAvatar avatarUrl={post.author.avatar} name={post.author.firstName} size={30}/>
        <span className="min-w-0 truncate text-sm font-semibold">{post.author.username}</span>
        {post.author.isVerified ? <BadgeCheck size={16} fill="#0284C7" className="shrink-0 text-white" aria-label="Verified"/> : null}
      </div>
      {media ? <div className={`relative overflow-hidden bg-[#EAF0F1] ${video ? "aspect-[9/16]" : "aspect-square"}`}>
        {!mediaError && imageSource ? <img src={imageSource} alt={video ? "Reel thumbnail" : "Shared post"} loading="lazy" decoding="async" onError={() => setMediaError(true)} className="absolute inset-0 size-full object-cover"/> : <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#205F67] to-[#89AAA4] text-xs text-white">{video ? "Open to watch reel" : "Open to view photo"}</span>}
        {video ? <><span className="absolute inset-0 flex items-center justify-center bg-black/10"><Play size={44} fill="white" className="text-white drop-shadow-md"/></span><span className="absolute bottom-3 left-3 rounded-lg bg-black/50 p-1.5 text-white"><Clapperboard size={19}/></span></> : null}
        {post.media.length > 1 ? <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white"><Images size={12}/>{post.media.length}</span> : null}
      </div> : null}
      {!video || post.heading || post.body ? <div className="px-3 py-3"><p className="line-clamp-2 text-[13px] leading-5"><span className="font-semibold">{post.author.username}</span>{" "}{post.heading || post.body || "Shared a post"}</p></div> : null}
    </Link> : null}
  </div>;
}

export default function SharedPostCard({ postId }: { postId: string }) {
  const user = useCurrentUser();
  return user ? <Preview key={`${user.id}:${postId}`} postId={postId}/> : <div role="status" className="p-4 text-xs">Loading shared post…</div>;
}
