"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bookmark, EyeOff } from "lucide-react";
import { fetchPostLibrary, type PostItem, type PostPreferences } from "../../lib/api/posts";
import { useCurrentUser } from "../hooks/useCurrentUser";
import PostCard from "../home/PostCard";
import PostSkeleton from "../home/PostSkeleton";

function LibraryResults({ view }: { view: "saved" | "hidden" }) {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState("");
  const moreBusy = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    fetchPostLibrary(view).then(result => {
      if (cancelled) return;
      setPosts(result.items);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    }).catch(err => {
      if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load your posts.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; mounted.current = false; };
  }, [view, attempt]);

  async function loadMore() {
    if (!cursor || !hasMore || moreBusy.current) return;
    moreBusy.current = true;
    setLoadingMore(true);
    setMoreError("");
    try {
      const result = await fetchPostLibrary(view, cursor);
      if (!mounted.current) return;
      setPosts(previous => {
        const ids = new Set(previous.map(post => post.id));
        return [...previous, ...result.items.filter(post => !ids.has(post.id))];
      });
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err) {
      if (mounted.current) setMoreError(err instanceof Error ? err.message : "Couldn't load more posts.");
    } finally {
      moreBusy.current = false;
      if (mounted.current) setLoadingMore(false);
    }
  }

  function preferenceChanged(id: string, preferences: PostPreferences) {
    setPosts(previous => previous.flatMap(post => {
      if (post.id !== id) return [post];
      if (view === "saved" && !preferences.saved || view === "hidden" && !preferences.hidden) return [];
      return [{ ...post, ...preferences }];
    }));
  }

  if (loading) return <PostSkeleton />;
  if (error) return <div className="rounded-2xl bg-white p-6 text-center">
    <p role="alert" className="text-sm text-red-600">{error}</p>
    <button type="button" onClick={() => { setError(""); setLoading(true); setAttempt(value => value + 1); }} className="mt-3 min-h-11 rounded-lg px-4 text-sm font-semibold text-[#00696F]">Try again</button>
  </div>;

  return <>
    {posts.map(post => <PostCard key={post.id} post={post} showHiddenContent
      onDeleted={id => setPosts(previous => previous.filter(item => item.id !== id))}
      onPreferenceChanged={preferenceChanged} />)}
    {!posts.length ? <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-10 text-center">
      {view === "saved" ? <Bookmark className="mx-auto mb-3 size-7 text-[#00696F]" aria-hidden="true" /> : <EyeOff className="mx-auto mb-3 size-7 text-[#00696F]" aria-hidden="true" />}
      <h2 className="font-semibold text-[#111827]">{hasMore ? "More posts are available" : view === "saved" ? "No saved posts yet" : "No hidden posts"}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6B7280]">{hasMore ? "Load more to see the rest of your posts." : view === "saved" ? "Save a post from its options menu to find it here later." : "Posts you hide from your feeds appear here. You can unhide them whenever you want."}</p>
      {!hasMore ? <Link href="/" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#00696F] px-5 text-sm font-semibold text-white">Explore your feed</Link> : null}
    </div> : null}
    {moreError ? <p role="alert" className="rounded-lg bg-white p-3 text-sm text-red-600">{moreError}</p> : null}
    {hasMore ? <button type="button" disabled={loadingMore} onClick={() => void loadMore()} className="min-h-11 rounded-xl border border-[#BBC9CA] bg-white px-5 py-3 text-sm font-semibold text-[#00696F] disabled:opacity-50">{loadingMore ? "Loading…" : moreError ? "Try loading more again" : `Load more ${view} posts`}</button> : null}
  </>;
}

export default function PostLibraryPage() {
  const params = useSearchParams();
  const user = useCurrentUser();
  const view = params.get("view") === "hidden" ? "hidden" : "saved";
  return <div className="mx-auto flex w-full max-w-[604px] flex-col gap-4 py-2 sm:gap-5">
    <header>
      <h1 className="text-2xl font-bold text-[#111827]">Your post library</h1>
      <p className="mt-1 text-sm leading-6 text-[#6B7280]">{view === "saved" ? "Posts you've kept for later. Only you can see your saved list." : "Hidden from your feeds. You can still open these posts from a profile or link."}</p>
    </header>
    <nav aria-label="Post library" className="flex gap-2 border-b border-[#E5E7EB] pb-3">
      <Link href="/saved" aria-current={view === "saved" ? "page" : undefined} className={`flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold ${view === "saved" ? "bg-[#00696F] text-white" : "bg-white text-[#4B5563]"}`}><Bookmark size={17} aria-hidden="true" />Saved posts</Link>
      <Link href="/saved?view=hidden" aria-current={view === "hidden" ? "page" : undefined} className={`flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold ${view === "hidden" ? "bg-[#00696F] text-white" : "bg-white text-[#4B5563]"}`}><EyeOff size={17} aria-hidden="true" />Hidden posts</Link>
    </nav>
    {user ? <LibraryResults key={`${user.id}:${view}`} view={view} /> : <PostSkeleton />}
  </div>;
}
