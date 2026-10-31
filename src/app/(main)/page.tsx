"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import CreatePostCard from "../../components/home/CreatePostCard";
import PostSkeleton from "../../components/home/PostSkeleton";
import SponsoredAd from "../../components/ads/SponsoredAd";
import StoriesSection from "../../components/home/StoriesSection";
import PostCard from "../../components/home/PostCard";
import CreatePostPage from "../../components/posts/CreatePostPage";
import { fetchPostsWithPagination, type PostItem } from "../../lib/api/posts";
import { useCurrentUser } from "../../components/hooks/useCurrentUser";

function FeedResults() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [moreError, setMoreError] = useState("");
  const moreBusy = useRef(false);
  const mounted = useRef(false);
  const observerTargetRef = useRef<HTMLDivElement>(null);

  const loadInitialPosts = useCallback(() => {
    return fetchPostsWithPagination({ limit: 10 }).then(res => {
      if (!mounted.current) return;
      setPosts(res.items);
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    }).catch(err => {
      if (mounted.current) setError(err instanceof Error ? err.message : "Unable to load posts.");
    }).finally(() => {
      if (mounted.current) setLoading(false);
    });
  }, []);

  const loadMorePosts = useCallback(async () => {
    if (moreBusy.current || !hasMore || !nextCursor) return;
    moreBusy.current = true;
    setLoadingMore(true);
    setMoreError("");
    try {
      const res = await fetchPostsWithPagination({ cursor: nextCursor, limit: 10 });
      if (!mounted.current) return;
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const filteredNew = res.items.filter((p) => !existingIds.has(p.id));
        return [...prev, ...filteredNew];
      });
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch {
      if (mounted.current) setMoreError("Couldn’t load more posts. Your feed is still here.");
    } finally {
      moreBusy.current = false;
      if (mounted.current) setLoadingMore(false);
    }
  }, [hasMore, nextCursor]);

  useEffect(() => {
    mounted.current = true;
    void loadInitialPosts();
    return () => { mounted.current = false; };
  }, [loadInitialPosts]);

  // Infinite scroll intersection observer
  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && !moreError) {
          void loadMorePosts();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMorePosts, hasMore, loading, loadingMore, moreError]);

  return (
    <div className="mx-auto flex w-full max-w-[604px] flex-col gap-4 sm:gap-6">
      <CreatePostCard onOpenModal={() => setCreateModalOpen(true)} />
      <StoriesSection /><SponsoredAd/>

      {error ? (
        <div className="rounded-[16px] bg-white p-4 text-center shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <p className="text-[14px] text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => { setLoading(true); setError(""); void loadInitialPosts(); }}
            className="mt-3 text-[14px] font-semibold text-[#00696F]"
          >
            Try again
          </button>
        </div>
      ) : null}

      {loading ? (
        <PostSkeleton />
      ) : posts.length ? (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDeleted={(id) => setPosts((prev) => prev.filter((item) => item.id !== id))}
              onUpdated={(updated) =>
                setPosts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
              }
            />
          ))}

          {/* Infinite scroll trigger target */}
          <div ref={observerTargetRef} className="h-4 w-full" />

          {moreError ? <div className="rounded-xl bg-white p-4 text-center">
            <p role="alert" className="text-sm text-[#6B7280]">{moreError}</p>
            <button type="button" disabled={loadingMore} onClick={() => void loadMorePosts()} className="mt-2 min-h-11 px-4 text-sm font-semibold text-[#00696F]">Try loading more again</button>
          </div> : null}

          {loadingMore ? (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-gray-100">
                <span className="size-4 animate-spin rounded-full border-2 border-[#00696F] border-t-transparent" />
                <span className="text-[13px] text-[#4B5563]">Loading more moments…</span>
              </div>
            </div>
          ) : !hasMore && posts.length > 5 ? (
            <div className="py-8 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-gray-100/80 px-4 py-1.5 text-[13px] text-gray-500">
                <span>✨</span>
                <span>You&apos;re all caught up!</span>
              </div>
            </div>
          ) : null}
        </>
      ) : !error ? (
        <div className="rounded-[16px] bg-white p-8 text-center shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <p className="text-[16px] font-semibold text-[#111827]">No posts yet</p>
          <p className="mt-1 text-[14px] text-[#6B7280]">
            Share a photo or a thought to get your feed started.
          </p>
        </div>
      ) : null}

      {createModalOpen ? (
        <CreatePostPage
          isModal
          onClose={() => setCreateModalOpen(false)}
          onCreated={(newPost) => {
            setPosts((prev) => [newPost, ...prev]);
            setCreateModalOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

export default function HomeFeed() {
  const user = useCurrentUser();
  return user ? <FeedResults key={user.id} /> : <PostSkeleton />;
}
