"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clapperboard, ThumbsUp, MessageCircle, Share2, Bookmark, History, Sparkles } from "lucide-react";
import VideoPlayer from "../../../components/posts/VideoPlayer";
import ReelComments from "../../../components/posts/ReelComments";
import { UserAvatar } from "../../../components/ui/UserAvatar";
import { fetchPosts, togglePostLike, postShareUrl, type PostItem } from "../../../lib/api/posts";

const tabs = [{ label: "For you", icon: Sparkles }, { label: "Saved", icon: Bookmark }, { label: "Liked Reels", icon: ThumbsUp }, { label: "History", icon: History }];
function readIds(key: string): string[] { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } }
export default function WatchPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [tab, setTab] = useState("For you");
  const [saved, setSaved] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState("");
  const [busy, setBusy] = useState("");
  useEffect(() => {
    setSaved(readIds("chattm_saved_reels")); setHistory(readIds("chattm_reel_history"));
    fetchPosts().then(items => setPosts(items.filter(post => post.media.some(m => m.type.toLowerCase().includes("video"))))).catch(e => setError(e instanceof Error ? e.message : "Unable to load reels.")).finally(() => setLoading(false));
  }, []);
  function markViewed(id: string) {
    setHistory(current => { const next = [id, ...current.filter(value => value !== id)].slice(0, 100); localStorage.setItem("chattm_reel_history", JSON.stringify(next)); return next; });
  }
  function save(id: string) { const next = saved.includes(id) ? saved.filter(value => value !== id) : [...saved, id]; setSaved(next); localStorage.setItem("chattm_saved_reels", JSON.stringify(next)); }
  async function like(post: PostItem) {
    if (busy) return; setBusy(post.id); setError("");
    try { const updated = await togglePostLike(post.id); setPosts(current => current.map(item => item.id === updated.id ? updated : item)); } catch { setError("Unable to update like. Try again."); } finally { setBusy(""); }
  }
  async function share(post: PostItem) {
    const url = postShareUrl(post.author.username, post.id);
    try { if (navigator.share) await navigator.share({ title: "ChatTm", url }); else { await navigator.clipboard.writeText(url); setError("Reel link copied."); } } catch { /* cancelled */ }
  }
  const visible = posts.filter(post => tab === "Saved" ? saved.includes(post.id) : tab === "Liked Reels" ? post.liked : tab === "History" ? history.includes(post.id) : true);
  return <div className="mx-auto flex w-full max-w-[1280px] items-start gap-8 px-3 py-4 sm:px-6">
    <aside className="sticky top-4 hidden w-[250px] shrink-0 rounded-2xl border border-[#e8eeee] bg-white p-4 shadow-sm lg:block">
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-[#0B1C30]"><Clapperboard className="text-[#00696F]" />Watch</h1>
      <p className="mb-6 text-sm text-[#6B7280]">A moment worth watching.</p>
      <nav aria-label="Watch filters" className="space-y-2">{tabs.map(({label, icon: Icon}) => <button key={label} onClick={() => setTab(label)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${tab === label ? "bg-[#dceeee] text-[#00696F]" : "text-[#4B5563] hover:bg-[#F3F7F7]"}`}><Icon size={18} />{label}</button>)}</nav>
      <Link href="/create-post" className="mt-8 block rounded-xl bg-[#00696F] px-4 py-3 text-center text-sm font-semibold text-white">Create a video post</Link>
    </aside>
    <section className="min-w-0 flex-1">
      <div className="mb-4 flex items-center justify-between lg:hidden"><h1 className="text-xl font-bold text-[#0B1C30]">Watch</h1><Link href="/create-post" className="text-sm font-semibold text-[#00696F]">Create video</Link></div>
      <nav aria-label="Watch filters" className="mb-4 flex gap-2 overflow-x-auto lg:hidden">{tabs.map(({label}) => <button key={label} onClick={() => setTab(label)} className={`shrink-0 rounded-full px-4 py-2 text-sm ${tab === label ? "bg-[#00696F] text-white" : "bg-white text-[#4B5563]"}`}>{label}</button>)}</nav>
      {error && <p role="status" className="mx-auto mb-4 max-w-[440px] rounded-xl bg-white p-3 text-sm text-[#00696F]">{error}</p>}
      {loading ? <p className="p-12 text-center text-sm text-[#6B7280]">Loading reels…</p> : !visible.length ? <div className="mx-auto max-w-[440px] rounded-2xl bg-white p-10 text-center"><Clapperboard className="mx-auto mb-4 text-[#00696F]" size={36} /><h2 className="font-semibold">{tab === "For you" ? "No videos yet" : `No ${tab.toLowerCase()} yet`}</h2><p className="mt-2 text-sm text-[#6B7280]">{tab === "For you" ? "Share a video post to start the reels feed." : "Your reels will appear here."}</p></div> : null}
      <div className="mx-auto flex max-w-[440px] flex-col gap-6">{visible.map(post => {
        const media = post.media.find(m => m.type.toLowerCase().includes("video"))!;
        return <article key={post.id} className="overflow-hidden rounded-2xl bg-white shadow-sm" onPlayCapture={() => markViewed(post.id)}>
          <div className="relative overflow-hidden rounded-2xl bg-[#101820]">
            <VideoPlayer src={media.url} reel />
            <div className="pointer-events-none absolute inset-x-0 bottom-16 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-14 pr-20 text-white">
              <Link href={`/profile/${post.author.username}`} className="pointer-events-auto mb-2 flex items-center gap-2 text-sm font-semibold"><UserAvatar avatarUrl={post.author.avatar} name={post.author.firstName} size={32} />{`${post.author.firstName} ${post.author.lastName}`.trim()}</Link>
              {post.heading && <h2 className="mb-1 break-words font-semibold">{post.heading}</h2>}
              <p className="line-clamp-3 whitespace-pre-line break-words text-sm">{post.body}</p>
            </div>
            <div className="absolute bottom-36 right-3 flex flex-col items-center gap-4 text-white">
              <button disabled={busy === post.id} aria-label="Like reel" onClick={() => void like(post)} className="flex flex-col items-center gap-1 text-xs"><span className={`flex size-10 items-center justify-center rounded-full ${post.liked ? "bg-[#00696F]" : "bg-black/45"}`}><ThumbsUp size={20} fill={post.liked ? "currentColor" : "none"} /></span>{post.likesCount}</button>
              <button aria-label="Show comments" onClick={() => setExpanded(expanded === post.id ? "" : post.id)} className="flex flex-col items-center gap-1 text-xs"><span className="flex size-10 items-center justify-center rounded-full bg-black/45"><MessageCircle size={20} /></span>{post.commentsCount}</button>
              <button aria-label="Share reel" onClick={() => void share(post)} className="flex size-10 items-center justify-center rounded-full bg-black/45"><Share2 size={20} /></button>
              <button aria-label={saved.includes(post.id) ? "Unsave reel" : "Save reel"} onClick={() => save(post.id)} className="flex size-10 items-center justify-center rounded-full bg-black/45"><Bookmark size={20} fill={saved.includes(post.id) ? "currentColor" : "none"} /></button>
            </div>
          </div>
          {expanded === post.id && <ReelComments postId={post.id} onClose={() => setExpanded("")} onAdded={() => setPosts(current => current.map(item => item.id === post.id ? { ...item, commentsCount: item.commentsCount + 1 } : item))} />}
        </article>;
      })}</div>
    </section>
  </div>;
}
