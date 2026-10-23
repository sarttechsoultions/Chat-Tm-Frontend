"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Send, MessageCircle } from "lucide-react";
import { addPostComment, fetchPostComments, type PostComment, type PostItem } from "../../lib/api/posts";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { UserAvatar } from "../ui/UserAvatar";

export default function ReelComments({ post, onClose, onAdded }: { post: PostItem; onClose: () => void; onAdded: () => void }) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const currentUser = useCurrentUser();
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    fetchPostComments(post.id).then(items => { if (!cancelled) setComments(items); }).catch(() => { if (!cancelled) setError("Unable to load comments."); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [post.id]);
  return <section aria-label="Reel comments" className="flex h-full min-h-0 flex-col bg-white">
    <header className="flex shrink-0 items-center justify-between border-b border-[#EDF1F2] px-5 py-4"><h2 className="text-base font-semibold">Comments <span className="ml-1 text-sm font-normal text-gray-500">{post.commentsCount}</span></h2><button aria-label="Close comments" onClick={onClose} className="rounded-full bg-gray-100 p-2 hover:bg-gray-200"><X size={18} /></button></header>
    <div ref={listRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5">
      <div className="border-b border-[#EDF1F2] pb-4"><Link href={`/profile/${post.author.username}`} className="flex items-center gap-2 text-sm font-semibold"><UserAvatar avatarUrl={post.author.avatar} name={post.author.firstName} size={34}/>{post.author.firstName} {post.author.lastName}</Link>{(post.heading || post.body) && <p className="mt-3 whitespace-pre-wrap break-words text-sm text-gray-600">{post.heading || post.body}</p>}</div>
      {loading ? <p role="status" className="text-sm text-gray-500">Loading comments…</p> : !comments.length ? <div className="py-8 text-center"><MessageCircle className="mx-auto mb-3 text-[#8FA9AA]" size={32}/><p className="text-sm font-semibold">Start the conversation</p><p className="mt-1 text-xs text-gray-500">Be the first to leave a comment.</p></div> : comments.map(comment => <div key={comment.id} className="flex items-start gap-2.5"><UserAvatar avatarUrl={comment.author.avatar} name={comment.author.firstName} size={34} /><div className="min-w-0"><div className="rounded-2xl bg-[#F1F5F5] px-3.5 py-2.5"><Link href={`/profile/${comment.author.username}`} className="text-xs font-semibold hover:underline">{comment.author.firstName} {comment.author.lastName}</Link><p className="mt-1 whitespace-pre-wrap break-words text-sm">{comment.body}</p></div><time dateTime={comment.createdAt} className="mt-1.5 block px-2 text-[11px] text-gray-500">{new Date(comment.createdAt).toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</time></div></div>)}
    </div>
    {error && <p role="alert" className="px-5 py-2 text-xs text-red-600">{error}</p>}
    <form className="flex shrink-0 items-center gap-2 border-t border-[#EDF1F2] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]" onSubmit={async e => { e.preventDefault(); if (!draft.trim() || sending) return; setSending(true); setError(""); try { const comment = await addPostComment(post.id, draft.trim()); setComments(current => [comment, ...current]); listRef.current?.scrollTo({top:0,behavior:"smooth"}); setDraft(""); onAdded(); } catch { setError("Unable to send comment. Try again."); } finally { setSending(false); } }}>
      <UserAvatar avatarUrl={currentUser?.avatar} name={currentUser?.firstName} size={30}/><input aria-label="Write a comment" value={draft} maxLength={2000} onChange={e => setDraft(e.target.value)} placeholder="Write a comment…" className="min-w-0 flex-1 rounded-full bg-[#F1F5F5] px-4 py-3 text-sm outline-[#00696F]" />
      <button aria-label="Send comment" disabled={sending || !draft.trim()} className="rounded-full bg-[#00696F] p-3 text-white disabled:opacity-40"><Send size={16} /></button>
    </form>
  </section>;
}
