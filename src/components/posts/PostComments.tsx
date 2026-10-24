"use client";

import { useEffect, useRef, useState } from "react";
import { addPostComment, fetchPostCommentPage, fetchPostReplyPage, toggleCommentLike, type CommentMutation, type PostComment } from "../../lib/api/posts";
import { playCommentSound, playLikeSound } from "../../lib/sounds";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { UserAvatar } from "../ui/UserAvatar";
import CommentRow from "./CommentRow";

function mergeComments(previous: PostComment[], next: PostComment[]) {
  const ids = new Set(previous.map(comment => comment.id));
  return [...previous, ...next.filter(comment => !ids.has(comment.id))];
}

function mergeReplies(previous: PostComment[], next: PostComment[]) {
  return mergeComments(previous, next).sort((left, right) =>
    new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime() || left.id.localeCompare(right.id));
}

export default function PostComments({ postId, postAuthorId, active = true, fill = false, onCountChanged }: {
  postId: string; postAuthorId: string; active?: boolean; fill?: boolean; onCountChanged: (count: number) => void;
}) {
  const user = useCurrentUser();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const [moreError, setMoreError] = useState("");
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});
  const [replyLoading, setReplyLoading] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<PostComment | null>(null);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [notice, setNotice] = useState("");
  const busy = useRef(new Set<string>());
  const mounted = useRef(false);
  const onCount = useRef(onCountChanged);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => { onCount.current = onCountChanged; }, [onCountChanged]);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    fetchPostCommentPage(postId).then(page => {
      if (cancelled) return;
      setComments(page.items);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
      if (typeof page.commentsCount === "number") onCount.current(page.commentsCount);
    }).catch(error => { if (!cancelled) setLoadError(error instanceof Error ? error.message : "Couldn't load comments."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; mounted.current = false; };
  }, [postId, loadAttempt]);

  useEffect(() => { if (active && !loading) inputRef.current?.focus(); }, [active, loading]);

  async function loadMore() {
    if (!nextCursor || busy.current.has("comments")) return;
    busy.current.add("comments");
    setMoreBusy(true);
    setMoreError("");
    try {
      const page = await fetchPostCommentPage(postId, nextCursor);
      if (!mounted.current) return;
      setComments(previous => mergeComments(previous, page.items));
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
      onCount.current(page.commentsCount);
    } catch (error) { if (mounted.current) setMoreError(error instanceof Error ? error.message : "Couldn't load more comments."); }
    finally { busy.current.delete("comments"); if (mounted.current) setMoreBusy(false); }
  }

  async function loadReplies(comment: PostComment) {
    if (busy.current.has(comment.id)) return;
    busy.current.add(comment.id);
    setReplyLoading(previous => ({ ...previous, [comment.id]: true }));
    setReplyErrors(previous => ({ ...previous, [comment.id]: "" }));
    try {
      const page = await fetchPostReplyPage(postId, comment.id, comment.repliesNextCursor || undefined);
      if (!mounted.current) return;
      setComments(previous => previous.map(parent => parent.id === comment.id ? {
        ...parent, replies: mergeReplies(parent.replies || [], page.items), repliesCount: page.repliesCount,
        repliesHasMore: page.hasMore, repliesNextCursor: page.nextCursor,
      } : parent));
    } catch (error) { if (mounted.current) setReplyErrors(previous => ({ ...previous, [comment.id]: error instanceof Error ? error.message : "Couldn't load replies." })); }
    finally {
      busy.current.delete(comment.id);
      if (mounted.current) setReplyLoading(previous => ({ ...previous, [comment.id]: false }));
    }
  }

  function applyMutation(result: CommentMutation) {
    setComments(previous => previous.flatMap(parent => {
      if (!result.parentId && parent.id === result.commentId) return result.comment ? [{ ...parent, ...result.comment, replies: parent.replies, repliesHasMore: parent.repliesHasMore, repliesNextCursor: parent.repliesNextCursor }] : [];
      if (parent.id !== result.parentId) return [parent];
      if (parent.deleted && result.repliesCount === 0) return [];
      return [{ ...parent, repliesCount: result.repliesCount, replies: (parent.replies || []).flatMap(reply => reply.id === result.commentId ? result.comment ? [result.comment] : [] : [reply]) }];
    }));
    if (replyingTo?.id === result.commentId && (!result.comment || result.comment.deleted)) setReplyingTo(null);
    onCount.current(result.commentsCount);
    setNotice(result.moderated ? "Your edited comment was submitted for moderation review." : result.comment?.deleted || !result.comment ? "Comment removed from this discussion." : "Comment updated.");
  }

  async function likeComment(comment: PostComment) {
    const result = await toggleCommentLike(postId, comment.id);
    if (!mounted.current) return;
    setComments(previous => previous.map(parent => parent.id === comment.id ? { ...parent, ...result } : {
      ...parent, replies: parent.replies?.map(reply => reply.id === comment.id ? { ...reply, ...result } : reply),
    }));
    if (result.liked) playLikeSound();
  }

  function startReply(comment: PostComment) {
    if (comment.deleted || !comment.author) return;
    setReplyingTo(comment);
    setDraft(previous => previous.trim() ? previous : `@${comment.author!.username} `);
    setOpenReplies(previous => ({ ...previous, [comment.id]: true }));
    inputRef.current?.focus();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.trim() || busy.current.has("posting")) return;
    busy.current.add("posting");
    setPosting(true);
    setPostError("");
    try {
      const created = await addPostComment(postId, draft.trim(), replyingTo?.id);
      if (!mounted.current) return;
      if (created.visible !== false) {
        if (created.parentId) setComments(previous => previous.map(parent => parent.id === created.parentId ? {
          ...parent, repliesCount: created.parentRepliesCount ?? ((parent.repliesCount || 0) + ((parent.replies || []).some(reply => reply.id === created.id) ? 0 : 1)),
          replies: mergeReplies(parent.replies || [], [created]),
        } : parent));
        else setComments(previous => [created, ...previous.filter(comment => comment.id !== created.id)]);
        playCommentSound();
      }
      if (typeof created.commentsCount === "number") onCount.current(created.commentsCount);
      setNotice(created.visible === false ? "Your comment was submitted for moderation review." : created.parentId ? "Reply posted." : "Comment posted.");
      setDraft("");
      setReplyingTo(null);
      if (!created.parentId) listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) { if (mounted.current) setPostError(error instanceof Error ? error.message : "Couldn't post your comment. Please try again."); }
    finally { busy.current.delete("posting"); if (mounted.current) setPosting(false); }
  }

  return <section aria-label="Post comments" className={`min-w-0 ${fill ? "flex h-full min-h-0 flex-col" : "border-t border-[#F3F4F6] pt-3"}`}>
    <div ref={listRef} className={`min-w-0 overflow-y-auto overscroll-contain ${fill ? "min-h-0 flex-1 px-4" : "max-h-[360px]"}`}>
      {loading ? <p role="status" className="py-3 text-sm text-[#6B7280]">Loading comments…</p> : loadError ? <div className="py-3">
        <p role="alert" className="text-sm text-red-600">{loadError}</p>
        <button type="button" onClick={() => { setLoadError(""); setLoading(true); setLoadAttempt(value => value + 1); }} className="mt-2 min-h-10 text-sm font-semibold text-[#00696F]">Try loading comments again</button>
      </div> : <>
        {!comments.length ? <p className="py-3 text-sm text-[#6B7280]">Be the first to comment.</p> : <ul className="flex flex-col gap-3 py-2">
          {comments.map(comment => <li key={comment.id} className="min-w-0">
            <CommentRow comment={comment} postId={postId} postAuthorId={postAuthorId} currentUserId={user?.id} canReply={!comment.deleted} onReply={() => startReply(comment)} onMutation={applyMutation} onLike={likeComment} />
            {(comment.repliesCount || 0) > 0 ? <div className="pl-8 sm:pl-10">
              <button type="button" aria-expanded={Boolean(openReplies[comment.id])} onClick={() => setOpenReplies(previous => ({ ...previous, [comment.id]: !previous[comment.id] }))} className="min-h-10 py-1 text-xs font-semibold text-[#00696F]">{openReplies[comment.id] ? "Hide replies" : `View ${comment.repliesCount} ${comment.repliesCount === 1 ? "reply" : "replies"}`}</button>
              {openReplies[comment.id] ? <>
                <ul className="flex flex-col gap-3 border-l-2 border-[#E5E7EB] pl-2 sm:pl-3">
                  {(comment.replies || []).map(reply => <li key={reply.id}><CommentRow comment={reply} postId={postId} postAuthorId={postAuthorId} currentUserId={user?.id} canReply={!comment.deleted} onReply={() => startReply(comment)} onMutation={applyMutation} onLike={likeComment} /></li>)}
                </ul>
                {replyErrors[comment.id] ? <p role="alert" className="mt-2 text-xs text-red-600">{replyErrors[comment.id]}</p> : null}
                {comment.repliesHasMore || comment.repliesCount! > (comment.replies || []).length ? <button type="button" disabled={replyLoading[comment.id]} onClick={() => void loadReplies(comment)} className="min-h-10 text-xs font-semibold text-[#00696F] disabled:opacity-50">{replyLoading[comment.id] ? "Loading replies…" : replyErrors[comment.id] ? "Try loading replies again" : "Load more replies"}</button> : null}
              </> : null}
            </div> : null}
          </li>)}
        </ul>}
        {moreError ? <p role="alert" className="mt-2 text-xs text-red-600">{moreError}</p> : null}
        {hasMore ? <button type="button" disabled={moreBusy} onClick={() => void loadMore()} className="my-2 min-h-10 text-sm font-semibold text-[#00696F] disabled:opacity-50">{moreBusy ? "Loading more comments…" : moreError ? "Try loading more comments again" : "Load more comments"}</button> : null}
      </>}
    </div>
    <div className={`shrink-0 bg-white pt-2 ${fill ? "border-t border-[#E5E7EB] p-4" : ""}`}>
      {notice ? <p role="status" className="mb-2 text-xs text-[#00696F]">{notice}</p> : null}
      {replyingTo ? <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-[#EFF4FF] px-3 py-1 text-xs text-[#00696F]">
        <span>Replying to @{replyingTo.author?.username}</span>
        <button type="button" disabled={posting} onClick={() => setReplyingTo(null)} className="min-h-9 font-semibold">Cancel reply</button>
      </div> : null}
      <form onSubmit={event => void submit(event)} className="flex min-w-0 items-start gap-2">
        <UserAvatar avatarUrl={user?.avatar} name={user?.firstName || "You"} size={30} />
        <div className="min-w-0 flex-1">
          <textarea ref={inputRef} aria-label={replyingTo ? "Write a reply" : "Write a comment"} placeholder={replyingTo ? "Write a reply…" : "Write a comment…"} value={draft} onChange={event => setDraft(event.target.value)} disabled={posting || loading || Boolean(loadError)} maxLength={5000} rows={2} className="w-full resize-y rounded-xl border border-[#D1D5DB] bg-[#F9FAFB] px-3 py-2 text-base outline-[#00696F] disabled:opacity-50 sm:text-sm" />
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-[#6B7280]">{draft.length}/5000</span>
            <button type="submit" disabled={posting || loading || Boolean(loadError) || !draft.trim()} className="min-h-10 rounded-lg bg-[#00696F] px-3 text-xs font-semibold text-white disabled:opacity-50">{posting ? "Posting…" : postError ? "Try posting again" : replyingTo ? "Post reply" : "Post comment"}</button>
          </div>
        </div>
      </form>
      {postError ? <p role="alert" className="mt-2 text-xs text-red-600">{postError} Your text is still here.</p> : null}
    </div>
  </section>;
}
