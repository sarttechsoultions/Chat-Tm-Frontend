"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clapperboard, ThumbsUp, MessageCircle, Share2, Bookmark, History, Sparkles, Search, SlidersHorizontal } from "lucide-react";
import VideoPlayer from "../../../components/posts/VideoPlayer";
import ReelOverlay from "../../../components/posts/ReelOverlay";
import ReelShare from "../../../components/posts/ReelShare";
import ReelComments from "../../../components/posts/ReelComments";
import { UserAvatar } from "../../../components/ui/UserAvatar";
import { fetchPosts, togglePostLike, type PostItem } from "../../../lib/api/posts";

const tabs = [{ label: "For you", icon: Sparkles }, { label: "Saved", icon: Bookmark }, { label: "Liked Reels", icon: ThumbsUp }, { label: "History", icon: History }];
function readIds(key: string): string[] { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } }
function ReelsSkeleton() {
  return <div aria-label="Loading reels" aria-busy="true" className="mx-auto flex h-full min-h-0 w-full flex-1 animate-pulse flex-col overflow-hidden bg-[#101820] sm:max-w-[440px] sm:rounded-2xl"><div className="h-[58%] w-full bg-[#172831]" /><div className="relative flex flex-1 flex-col justify-end p-4"><div className="absolute right-4 top-5 flex flex-col gap-4"><div className="size-10 rounded-full bg-white/15" /><div className="size-10 rounded-full bg-white/15" /><div className="size-10 rounded-full bg-white/15" /></div><div className="flex items-center gap-3"><div className="size-9 rounded-full bg-white/20" /><div className="h-4 w-28 rounded bg-white/20" /></div><div className="mt-3 h-3 w-3/4 rounded bg-white/15" /><div className="mt-2 h-3 w-1/2 rounded bg-white/10" /><div className="mt-5 h-1.5 w-full rounded-full bg-white/20" /></div></div>;
}
function WatchPageContent() {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [tab, setTab] = useState("For you");
  const [saved, setSaved] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState("");
  const [shareTarget, setShareTarget] = useState<PostItem | null>(null);
  const [busy, setBusy] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSaved(readIds("chattm_saved_reels")); setHistory(readIds("chattm_reel_history"));
      fetchPosts().then(items => { if (!cancelled) setPosts(items.filter(post => post.media.some(m => m.type.toLowerCase().includes("video")))); }).catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load reels."); }).finally(() => { if (!cancelled) setLoading(false); });
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, []);
  function markViewed(id: string) {
    if (expanded && expanded !== id) setExpanded("");
    setHistory(current => { const next = [id, ...current.filter(value => value !== id)].slice(0, 100); localStorage.setItem("chattm_reel_history", JSON.stringify(next)); return next; });
  }
  function save(id: string) { const next = saved.includes(id) ? saved.filter(value => value !== id) : [...saved, id]; setSaved(next); localStorage.setItem("chattm_saved_reels", JSON.stringify(next)); }
  async function like(post: PostItem) {
    if (busy) return; setBusy(post.id); setError("");
    try { const updated = await togglePostLike(post.id); setPosts(current => current.map(item => item.id === updated.id ? updated : item)); } catch { setError("Unable to update like. Try again."); } finally { setBusy(""); }
  }
  const selectedReel = searchParams.get("reel");
  const visible = posts
    .filter(post => tab === "Saved" ? saved.includes(post.id) : tab === "Liked Reels" ? post.liked : tab === "History" ? history.includes(post.id) : true)
    .sort((left, right) => Number(right.id === selectedReel) - Number(left.id === selectedReel));
  return <div className="mx-auto flex h-full w-full min-h-0 items-stretch gap-8 px-0 pb-[calc(58px+env(safe-area-inset-bottom))] pt-0 sm:max-w-[1280px] sm:px-6 sm:pt-4 md:pb-4">
    <aside className="sticky top-4 hidden w-[250px] shrink-0 rounded-2xl border border-[#e8eeee] bg-white p-4 shadow-sm lg:block">
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-[#0B1C30]"><Clapperboard className="text-[#00696F]" />Watch</h1>
      <p className="mb-6 text-sm text-[#6B7280]">A moment worth watching.</p>
      <nav aria-label="Watch filters" className="space-y-2">{tabs.map(({label, icon: Icon}) => <button key={label} onClick={() => { setTab(label); setExpanded(""); }} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${tab === label ? "bg-[#dceeee] text-[#00696F]" : "text-[#4B5563] hover:bg-[#F3F7F7]"}`}><Icon size={18} />{label}</button>)}</nav>
      <Link href="/create-post" className="mt-8 block rounded-xl bg-[#00696F] px-4 py-3 text-center text-sm font-semibold text-white">Create a video post</Link>
    </aside>
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="relative z-30 mb-0 flex shrink-0 items-center justify-between bg-[#20262b] px-3 py-2.5 text-white lg:hidden"><h1 className="text-xl font-bold">ChatTm Clips</h1><div className="flex items-center gap-2"><button type="button" aria-label="Search reels" className="flex size-8 items-center justify-center rounded-full text-white/90 hover:bg-white/10"><Search size={20} /></button><button type="button" aria-label="Show reel filters" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(value => !value)} className={`flex size-8 items-center justify-center rounded-full ${filtersOpen ? "bg-[#00696F]" : "text-white/90 hover:bg-white/10"}`}><SlidersHorizontal size={19} /></button></div></div>
      {filtersOpen && <nav aria-label="Reel filters" className="absolute left-3 right-3 top-12 z-40 grid grid-cols-2 gap-1 rounded-xl bg-[#20262b]/95 p-2 shadow-xl backdrop-blur-sm lg:hidden">{tabs.map(({label}) => <button key={label} onClick={() => { setTab(label); setExpanded(""); setFiltersOpen(false); }} className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition ${tab === label ? "bg-[#00696F] text-white" : "text-white/85 hover:bg-white/10"}`}>{label}</button>)}</nav>}
      {error && <p role="status" className="mx-auto mb-4 max-w-[440px] rounded-xl bg-white p-3 text-sm text-[#00696F]">{error}</p>}
      {!loading && !visible.length ? <div className="mx-auto max-w-[440px] rounded-2xl bg-white p-10 text-center"><Clapperboard className="mx-auto mb-4 text-[#00696F]" size={36} /><h2 className="font-semibold">{tab === "For you" ? "No videos yet" : `No ${tab.toLowerCase()} yet`}</h2><p className="mt-2 text-sm text-[#6B7280]">{tab === "For you" ? "Share a video post to start the reels feed." : "Your reels will appear here."}</p></div> : null}
      <div className="flex min-h-0 flex-1 gap-4">
      {loading && <ReelsSkeleton />}
      {!loading && visible.length ? <div className="mx-auto flex min-h-0 min-w-0 w-full flex-1 snap-y snap-mandatory flex-col overflow-y-auto bg-[#101820] no-scrollbar sm:max-w-[440px] sm:rounded-2xl">{visible.map(post => {
        const media = post.media.find(m => m.type.toLowerCase().includes("video"))!;
        return <article key={post.id} className="h-full min-h-full shrink-0 snap-start snap-always overflow-hidden bg-[#101820] shadow-sm md:min-h-full md:rounded-2xl" onPlayCapture={() => markViewed(post.id)}>
          <div className="relative flex h-full min-h-0 overflow-hidden bg-[#101820] md:rounded-2xl">
            <VideoPlayer src={media.url} reel />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-4 pb-12 pt-24 pr-20 text-white">
              <Link href={`/profile/${post.author.username}`} className="pointer-events-auto mb-2 flex items-center gap-2 text-sm font-semibold"><UserAvatar avatarUrl={post.author.avatar} name={post.author.firstName} size={32} />{`${post.author.firstName} ${post.author.lastName}`.trim()}</Link>
              {post.heading && <h2 className="mb-1 break-words font-semibold">{post.heading}</h2>}
              <p className="line-clamp-3 whitespace-pre-line break-words text-sm">{post.body}</p>
            </div>
            <div className="absolute bottom-36 right-3 flex flex-col items-center gap-4 text-white">
              <button disabled={busy === post.id} aria-label="Like reel" onClick={() => void like(post)} className="flex flex-col items-center gap-1 text-xs"><span className={`flex size-10 items-center justify-center rounded-full ${post.liked ? "bg-[#00696F]" : "bg-black/45"}`}><ThumbsUp size={20} fill={post.liked ? "currentColor" : "none"} /></span>{post.likesCount}</button>
              <button aria-label="Show comments" aria-expanded={expanded === post.id} onClick={() => setExpanded(expanded === post.id ? "" : post.id)} className="flex flex-col items-center gap-1 text-xs"><span className="flex size-10 items-center justify-center rounded-full bg-black/45"><MessageCircle size={20} /></span>{post.commentsCount}</button>
              <button aria-label="Share reel" onClick={() => setShareTarget(post)} className="flex size-10 items-center justify-center rounded-full bg-black/45"><Share2 size={20} /></button>
              <button aria-label={saved.includes(post.id) ? "Unsave reel" : "Save reel"} onClick={() => save(post.id)} className="flex size-10 items-center justify-center rounded-full bg-black/45"><Bookmark size={20} fill={saved.includes(post.id) ? "currentColor" : "none"} /></button>
            </div>
          </div>

        </article>;
      })}</div> : null}
      {expanded && posts.find(post => post.id === expanded) && <ReelOverlay label="Comments" sidePanel onClose={() => setExpanded("")}><ReelComments key={expanded} post={posts.find(post => post.id === expanded)!} onClose={() => setExpanded("")} onAdded={() => setPosts(current => current.map(item => item.id === expanded ? { ...item, commentsCount: item.commentsCount + 1 } : item))}/></ReelOverlay>}
      </div>
      {shareTarget && <ReelShare post={shareTarget} onClose={() => setShareTarget(null)} onShared={updated => setPosts(current => current.map(item => item.id === updated.id ? updated : item))}/>}
    </section>
  </div>;
}

export default function WatchPage() {
  return <Suspense fallback={<div className="size-full bg-[#101820]" />}><WatchPageContent /></Suspense>;
}
