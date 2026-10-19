"use client";
import { useEffect, useState } from "react";
import { X, Send } from "lucide-react";
import { addPostComment, fetchPostComments, type PostComment } from "../../lib/api/posts";
import { UserAvatar } from "../ui/UserAvatar";

export default function ReelComments({ postId, onClose, onAdded }: { postId: string; onClose: () => void; onAdded: () => void }) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    fetchPostComments(postId).then(items => { if (!cancelled) setComments(items); }).catch(() => { if (!cancelled) setError("Unable to load comments."); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [postId]);
  return <section aria-label="Reel comments" className="border-t border-[#e8eeee] p-4">
    <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-[#0B1C30]">Comments</h2><button aria-label="Close comments" onClick={onClose} className="rounded-full p-2 hover:bg-gray-100"><X size={18} /></button></div>
    <div className="max-h-64 space-y-3 overflow-y-auto">
      {loading ? <p className="text-sm text-gray-500">Loading comments…</p> : !comments.length ? <p className="text-sm text-gray-500">Be the first to comment.</p> : comments.map(comment => <div key={comment.id} className="flex gap-2"><UserAvatar avatarUrl={comment.author.avatar} name={comment.author.firstName} size={28} /><div className="min-w-0 rounded-xl bg-[#f3f7f7] px-3 py-2"><p className="text-xs font-semibold">{comment.author.firstName} {comment.author.lastName}</p><p className="whitespace-pre-wrap break-words text-sm">{comment.body}</p></div></div>)}
    </div>
    {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    <form className="mt-4 flex gap-2" onSubmit={async e => { e.preventDefault(); if (!draft.trim() || sending) return; setSending(true); setError(""); try { const comment = await addPostComment(postId, draft.trim()); setComments(current => [...current, comment]); setDraft(""); onAdded(); } catch { setError("Unable to send comment. Try again."); } finally { setSending(false); } }}>
      <input aria-label="Write a comment" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Write a comment…" className="min-w-0 flex-1 rounded-full bg-[#f3f7f7] px-4 py-2 text-sm outline-[#00696F]" />
      <button aria-label="Send comment" disabled={sending || !draft.trim()} className="rounded-full bg-[#00696F] p-3 text-white disabled:opacity-40"><Send size={16} /></button>
    </form>
  </section>;
}
