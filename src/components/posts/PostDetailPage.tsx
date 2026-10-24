"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchPost, PostRequestError, type PostItem } from "../../lib/api/posts";
import { useCurrentUser } from "../hooks/useCurrentUser";
import PostCard from "../home/PostCard";
import PostSkeleton from "../home/PostSkeleton";

function PostResult({ postId }: { postId: string }) {
  const [post, setPost] = useState<PostItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchPost(postId).then(value => { if (!cancelled) setPost(value); }).catch(err => {
      if (cancelled) return;
      if (err instanceof PostRequestError && [403, 404, 410].includes(err.status)) setUnavailable(true);
      else setError(true);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [postId, attempt]);

  if (loading) return <PostSkeleton />;
  if (unavailable) return <section className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center">
    <h1 className="text-xl font-semibold">This post isn’t available</h1>
    <p className="mt-3 text-sm leading-6 text-[#6B7280]">It may have been removed, or its audience may not include you.</p>
    <Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#00696F] px-5 text-sm font-semibold text-white">Go to your feed</Link>
  </section>;
  if (error) return <section className="rounded-2xl bg-white p-8 text-center">
    <p role="alert" className="text-sm text-[#6B7280]">We couldn’t load this post. Please try again.</p>
    <button onClick={() => { setError(false); setLoading(true); setAttempt(value => value + 1); }} className="mt-4 min-h-11 rounded-lg px-5 font-semibold text-[#00696F]">Try again</button>
  </section>;
  return post ? <PostCard post={post} showHiddenContent initiallyShowComments onDeleted={() => { setPost(null); setUnavailable(true); }} /> : null;
}

export default function PostDetailPage({ postId }: { postId: string }) {
  const user = useCurrentUser();
  return <div className="mx-auto flex w-full max-w-[604px] flex-col gap-4 py-2">
    <Link href="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-[#00696F]">← Back to feed</Link>
    {user ? <PostResult key={`${user.id}:${postId}`} postId={postId} /> : <PostSkeleton />}
  </div>;
}
