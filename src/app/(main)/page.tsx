"use client";

import React, { useCallback, useEffect, useState } from "react";
import CreatePostCard from "../../components/home/CreatePostCard";
import StoriesSection from "../../components/home/StoriesSection";
import PostCard from "../../components/home/PostCard";
import { fetchPosts, type PostItem } from "../../lib/api/posts";

export default function HomeFeed() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPosts(await fetchPosts());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  return (
    <div className="mx-auto flex w-full max-w-[604px] flex-col gap-4 sm:gap-6">
      <CreatePostCard />
      <StoriesSection />
      {error ? (
        <div className="rounded-[16px] bg-white p-4 text-center shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <p className="text-[14px] text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void loadPosts()}
            className="mt-3 text-[14px] font-semibold text-[#00696F]"
          >
            Try again
          </button>
        </div>
      ) : null}
      {loading ? (
        <p className="py-8 text-center text-[14px] text-[#6B7280]">Loading posts…</p>
      ) : posts.length ? (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDeleted={(id) => setPosts((prev) => prev.filter((item) => item.id !== id))}
          />
        ))
      ) : !error ? (
        <div className="rounded-[16px] bg-white p-8 text-center shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <p className="text-[16px] font-semibold text-[#111827]">No posts yet</p>
          <p className="mt-1 text-[14px] text-[#6B7280]">
            Share a photo or a thought to get your feed started.
          </p>
        </div>
      ) : null}
    </div>
  );
}
