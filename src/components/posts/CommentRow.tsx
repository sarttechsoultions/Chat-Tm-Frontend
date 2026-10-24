"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Heart } from "lucide-react";
import { deletePostComment, editPostComment, type CommentMutation, type PostComment } from "../../lib/api/posts";
import { UserAvatar } from "../ui/UserAvatar";

export default function CommentRow({ comment, postId, postAuthorId, currentUserId, canReply, onReply, onMutation, onLike }: {
  comment: PostComment; postId: string; postAuthorId: string; currentUserId?: string; canReply: boolean;
  onReply: () => void; onMutation: (result: CommentMutation) => void;
  onLike: (comment: PostComment) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const busyRef = useRef(false);
  const own = Boolean(currentUserId && comment.author?.id === currentUserId);
  const deletable = !comment.deleted && (own || currentUserId === postAuthorId);
  const name = comment.author ? `${comment.author.firstName} ${comment.author.lastName}`.trim() || comment.author.username : "Deleted comment";
  const isReply = Boolean(comment.parentId);

  async function action(kind: "edit" | "delete" | "like") {
    if (busyRef.current) return;
    if (kind === "edit" && !draft.trim()) { setError("Comment cannot be empty."); return; }
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      if (kind === "like") await onLike(comment);
      else {
        const result = kind === "edit" ? await editPostComment(postId, comment.id, draft.trim()) : await deletePostComment(postId, comment.id);
        onMutation(result);
        setEditing(false);
        setConfirmDelete(false);
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't update the comment. Please try again."); }
    finally { busyRef.current = false; setBusy(false); }
  }

  return <article data-comment-id={comment.id} className="flex min-w-0 items-start gap-2">
    {comment.author ? <Link href={`/profile/${comment.author.username}`} className="shrink-0"><UserAvatar avatarUrl={comment.author.avatar} name={name} size={isReply ? 26 : 32} /></Link> : <div className="size-8 shrink-0 rounded-full bg-[#E5E7EB]" aria-hidden="true" />}
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 items-start gap-1">
        <div className="min-w-0 flex-1 rounded-xl bg-[#F3F4F6] px-3 py-2">
          {comment.author ? <Link href={`/profile/${comment.author.username}`} className="text-[13px] font-semibold text-[#111827] hover:underline">{name}</Link> : null}
          {editing ? <form onSubmit={event => { event.preventDefault(); void action("edit"); }} className="mt-2">
            <textarea aria-label={isReply ? "Edit reply text" : "Edit comment text"} autoFocus value={draft} maxLength={5000} rows={3} disabled={busy} onChange={event => setDraft(event.target.value)} className="w-full rounded-lg border border-[#BBC9CA] bg-white p-2 text-base outline-[#00696F] sm:text-sm" />
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="submit" disabled={busy || !draft.trim()} className="min-h-10 rounded-lg bg-[#00696F] px-3 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save changes"}</button>
              <button type="button" disabled={busy} onClick={() => { setEditing(false); setError(""); }} className="min-h-10 rounded-lg px-3 text-xs font-semibold text-[#4B5563]">Cancel edit</button>
            </div>
          </form> : <p className={`whitespace-pre-wrap break-words text-[13px] leading-5 ${comment.deleted ? "italic text-[#6B7280]" : "text-[#1F2937]"}`}>{comment.deleted ? "This comment was deleted. Its replies are kept below." : comment.body}</p>}
        </div>
        {!comment.deleted && !editing ? <button type="button" disabled={busy} onClick={() => void action("like")} aria-label={`${comment.liked ? "Unlike" : "Like"} ${isReply ? "reply" : "comment"}`} className={`flex min-h-10 min-w-9 shrink-0 flex-col items-center justify-center rounded-lg disabled:opacity-50 ${comment.liked ? "text-[#E11D48]" : "text-[#6B7280]"}`}>
          <Heart size={16} fill={comment.liked ? "currentColor" : "none"} aria-hidden="true" />
          {(comment.likesCount || 0) > 0 ? <span className="text-[10px]">{comment.likesCount}</span> : null}
        </button> : null}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 px-2 text-[11px] text-[#6B7280]">
        <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time>
        {comment.edited ? <span>Edited</span> : null}
        {!comment.deleted && !editing && !confirmDelete ? <>
          {canReply ? <button type="button" disabled={busy} onClick={onReply} className="min-h-9 font-semibold text-[#4B5563]">Reply</button> : null}
          {own ? <button type="button" disabled={busy} onClick={() => { setDraft(comment.body); setEditing(true); setError(""); }} className="min-h-9 font-semibold text-[#00696F]">Edit</button> : null}
          {deletable ? <button type="button" disabled={busy} onClick={() => { setConfirmDelete(true); setError(""); }} className="min-h-9 font-semibold text-red-600">Delete</button> : null}
        </> : null}
      </div>
      {confirmDelete ? <div role="group" aria-label="Delete comment confirmation" className="mt-2 rounded-lg border border-[#E5E7EB] p-3">
        <p className="text-xs leading-5 text-[#4B5563]">{!isReply && (comment.repliesCount || 0) > 0 ? "Delete this comment? Other people's replies will stay." : `Delete this ${isReply ? "reply" : "comment"}?`}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => void action("delete")} className="min-h-10 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Deleting…" : "Confirm delete"}</button>
          <button type="button" disabled={busy} onClick={() => { setConfirmDelete(false); setError(""); }} className="min-h-10 rounded-lg px-3 text-xs font-semibold text-[#4B5563]">Keep comment</button>
        </div>
      </div> : null}
      {error ? <p role="alert" className="mt-2 text-xs leading-5 text-red-600">{error} Please try again.</p> : null}
    </div>
  </article>;
}
