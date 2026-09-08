"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { UserAvatar } from "../ui/UserAvatar";
import { listFriends, type FriendUser } from "../../lib/auth";
import { playCommentSound, playLikeSound, playShareSound } from "../../lib/sounds";
import { createDirectConversation, sendMessage } from "../../lib/api/chat";
import { useCurrentUser } from "../hooks/useCurrentUser";
import {
  addPostComment,
  deletePost,
  fetchPostComments,
  postShareUrl,
  sharePost,
  togglePostLike,
  type PostAuthor,
  type PostComment,
  type PostItem,
} from "../../lib/api/posts";
import { clampFeedAspect } from "../../lib/media";
import MediaCarousel from "../posts/MediaCarousel";

function formatPostTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function authorName(user: Pick<PostAuthor, "firstName" | "lastName" | "username">) {
  return `${user.firstName} ${user.lastName}`.trim() || user.username;
}

function privacyIcon(privacy: PostItem["privacy"]) {
  if (privacy === "FRIENDS") return "/figma/icons/friends-lock.svg";
  if (privacy === "PRIVATE") return "/figma/icons/friends-lock.svg";
  return "/figma/icons/globe.svg";
}

function renderCaption(content: string) {
  const parts = content.split(/([#@][A-Za-z0-9_]+)/g);
  return parts.map((part, index) => {
    if (part.startsWith("#")) {
      return (
        <span key={index} className="text-[#00696F] font-medium">
          {part}
        </span>
      );
    }
    if (part.startsWith("@")) {
      return (
        <Link key={index} href={`/profile/${part.slice(1)}`} className="text-[#00696F] font-medium hover:underline">
          {part}
        </Link>
      );
    }
    return part;
  });
}

function formatCount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(value);
}

function friendName(user: FriendUser) {
  return `${user.firstName} ${user.lastName}`.trim() || user.username;
}

function asLiker(user: ReturnType<typeof useCurrentUser>): PostAuthor | null {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    avatar: user.avatar || "",
    isVerified: user.isVerified,
  };
}

function PostMediaGrid({ media }: { media: PostItem["media"] }) {
  const [aspect, setAspect] = useState(1);

  useEffect(() => {
    const first = media[0];
    if (!first || first.type === "video" || first.type.includes("video")) {
      setAspect(1);
      return;
    }
    const image = new window.Image();
    image.onload = () => setAspect(clampFeedAspect(image.naturalWidth, image.naturalHeight));
    image.src = first.url;
  }, [media]);

  if (!media.length) return null;

  return <MediaCarousel items={media} aspect={aspect} />;
}

export default function PostCard({
  post: initialPost,
  onDeleted,
}: {
  post: PostItem;
  onDeleted?: (id: string) => void;
  onUpdated?: (post: PostItem) => void;
}) {
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [working, setWorking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareNotice, setShareNotice] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [friendQuery, setFriendQuery] = useState("");
  const [sendNote, setSendNote] = useState("");
  const [sendingTo, setSendingTo] = useState("");
  const [sentChatId, setSentChatId] = useState("");
  const [sendError, setSendError] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);
  const [error, setError] = useState("");
  const commentInputRef = useRef<HTMLInputElement>(null);
  const me = useCurrentUser();
  const isOwner = me?.id === post.author.id;
  const author =
    me && post.author.id === me.id
      ? {
          ...post.author,
          avatar: me.avatar || post.author.avatar,
          firstName: me.firstName || post.author.firstName,
          lastName: me.lastName || post.author.lastName,
          username: me.username || post.author.username,
        }
      : post.author;
  const likers = post.likedBy || [];

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  useEffect(() => {
    if (!showComments) return;
    const timeout = window.setTimeout(() => commentInputRef.current?.focus(), 50);
    return () => window.clearTimeout(timeout);
  }, [showComments]);

  useEffect(() => {
    if (!sendOpen) return;
    let cancelled = false;
    setLoadingFriends(true);
    setSendError("");
    listFriends()
      .then((data) => {
        if (!cancelled) setFriends(data.items || []);
      })
      .catch((err: unknown) => {
        if (!cancelled) setSendError(err instanceof Error ? err.message : "Unable to load friends.");
      })
      .finally(() => {
        if (!cancelled) setLoadingFriends(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sendOpen]);

  async function handleLike() {
    const previous = post;
    const liking = !post.liked;
    const meLiker = asLiker(me);
    setPost({
      ...post,
      liked: liking,
      likesCount: liking ? post.likesCount + 1 : Math.max(0, post.likesCount - 1),
      likedBy: liking
        ? meLiker
          ? [meLiker, ...likers.filter((user) => user.id !== meLiker.id)].slice(0, 3)
          : likers
        : likers.filter((user) => user.id !== me?.id),
    });
    if (liking) {
      playLikeSound();
      setLikeBurst(true);
      window.setTimeout(() => setLikeBurst(false), 500);
    }
    try {
      setPost(await togglePostLike(post.id));
    } catch {
      setPost(previous);
    }
  }

  async function toggleComments() {
    if (showComments) {
      setShowComments(false);
      return;
    }
    setShowComments(true);
    setLoadingComments(true);
    try {
      setComments(await fetchPostComments(post.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load comments.");
    } finally {
      setLoadingComments(false);
    }
  }

  async function handleComment(event: React.FormEvent) {
    event.preventDefault();
    const body = commentDraft.trim();
    if (!body || working) return;
    setWorking(true);
    setError("");
    try {
      const created = await addPostComment(post.id, body);
      setComments((prev) => [...prev, created]);
      setPost((prev) => ({ ...prev, commentsCount: prev.commentsCount + 1 }));
      setCommentDraft("");
      playCommentSound();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add comment.");
    } finally {
      setWorking(false);
    }
  }

  async function handleDelete() {
    setWorking(true);
    setError("");
    try {
      await deletePost(post.id);
      onDeleted?.(post.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete post.");
      setWorking(false);
    }
  }

  async function copyLink() {
    const url = postShareUrl(author.username, post.id);
    try {
      await navigator.clipboard.writeText(url);
      setShareNotice("Link copied");
      playShareSound();
      setPost(await sharePost(post.id).catch(() => post));
    } catch {
      setShareNotice("Unable to copy link.");
    }
  }

  async function nativeShare() {
    const url = postShareUrl(author.username, post.id);
    const text = post.body || `Post by ${authorName(author)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "ChatTm", text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareNotice("Link copied");
      }
      playShareSound();
      setPost(await sharePost(post.id).catch(() => post));
      setShareOpen(false);
    } catch {
      // user cancelled share sheet
    }
  }

  async function sendToFriend(friend: FriendUser) {
    if (sendingTo) return;
    setSendingTo(friend.id);
    setSendError("");
    try {
      const chat = await createDirectConversation(friend.id);
      const url = postShareUrl(author.username, post.id);
      const lines = [
        sendNote.trim(),
        `Shared a post from ${authorName(author)}`,
        post.body?.trim() || "",
        url,
      ].filter(Boolean);
      const media = post.media[0];
      const mediaUrl = media?.url
        ? /^https?:\/\//.test(media.url)
          ? media.url
          : `${window.location.origin}${media.url.startsWith("/") ? media.url : `/${media.url}`}`
        : undefined;
      const extra = mediaUrl
        ? {
            type: (media?.type === "video" ? "VIDEO" : "IMAGE") as "IMAGE" | "VIDEO",
            mediaUrl,
            fileName: "Shared post",
          }
        : undefined;
      await sendMessage(chat.id, lines.join("\n\n"), undefined, extra);
      setPost(await sharePost(post.id).catch(() => post));
      playShareSound();
      setSendOpen(false);
      setShareOpen(false);
      setSendNote("");
      setFriendQuery("");
      setSentChatId(chat.id);
      setShareNotice(`Sent to ${friendName(friend)}`);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Unable to send this post.");
    } finally {
      setSendingTo("");
    }
  }

  const friendMatches = friends.filter((user) =>
    friendName(user).toLowerCase().includes(friendQuery.trim().toLowerCase())
  );

  return (
    <div id={`post-${post.id}`} className="w-full bg-white rounded-[16px] p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${author.username}`}>
            <UserAvatar avatarUrl={author.avatar} name={authorName(author)} size={40} />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-1">
              <Link href={`/profile/${author.username}`} className="font-bold text-[16px] leading-6 text-[#111827] hover:underline">
                {authorName(author)}
              </Link>
              {author.isVerified && (
                <span className="relative size-[14px] overflow-clip shrink-0">
                  <img src="/figma/icons/verified.svg" alt="" width={14} height={14} className="size-full object-contain" />
                </span>
              )}
              {post.group ? (
                <>
                  <span className="text-[14px] text-[#6B7280]">›</span>
                  <Link href={`/groups/${post.group.id}`} className="text-[14px] font-semibold text-[#00696F] hover:underline">
                    {post.group.name}
                  </Link>
                </>
              ) : null}
              {post.feeling ? (
                <span className="text-[14px] font-normal text-[#4B5563]">is feeling {post.feeling}</span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-1 text-[12px] text-[#6B7280] leading-4">
              <span>{formatPostTime(post.createdAt)}</span>
              {post.edited ? <span>• Edited</span> : null}
              <span>•</span>
              <span className="relative size-3 overflow-clip">
                <img
                  src={privacyIcon(post.privacy)}
                  alt=""
                  width={12}
                  height={12}
                  className="size-full object-contain"
                />
              </span>
              {post.location ? (
                <span className="flex items-center gap-1">
                  •
                  <img src="/figma/icons/map-pin.svg" alt="" width={10} height={12} />
                  {post.location}
                </span>
              ) : null}
            </div>
            {post.mentions?.length ? (
              <p className="text-[12px] text-[#6B7280]">
                with{" "}
                {post.mentions.map((person, index) => (
                  <span key={person.id}>
                    <Link href={`/profile/${person.username}`} className="font-medium text-[#00696F] hover:underline">
                      {authorName(person)}
                    </Link>
                    {index < (post.mentions?.length || 0) - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            className="size-8 rounded-full flex items-center justify-center"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Post options"
          >
            <span className="relative w-[4px] h-[14px] overflow-clip">
              <img src="/figma/icons/more-v.svg" alt="" width={4} height={14} className="size-full object-contain" />
            </span>
          </button>
          {menuOpen && isOwner ? (
            <div className="absolute right-0 top-9 z-10 min-w-[140px] rounded-[10px] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
              <Link
                href={`/create-post?edit=${post.id}`}
                onClick={() => setMenuOpen(false)}
                className="block w-full px-4 py-2 text-left text-[14px] font-medium text-[#111827] hover:bg-gray-50"
              >
                Edit post
              </Link>
              <button
                type="button"
                disabled={working}
                onClick={() => void handleDelete()}
                className="w-full px-4 py-2 text-left text-[14px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                Delete post
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {post.heading ? (
        <h3 className="pt-1 text-[18px] font-bold leading-6 text-[#111827]">{post.heading}</h3>
      ) : null}
      {post.body ? (
        <p className="text-[14px] leading-5 text-[#1F2937] whitespace-pre-line pt-1">
          {renderCaption(post.body)}
        </p>
      ) : null}

      {post.media.length ? <PostMediaGrid media={post.media} /> : null}

      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar border-b border-[#F3F4F6] py-2">
        <div className="flex min-h-5 items-center gap-1">
          {post.likesCount > 0 ? (
            <>
              <div className="flex items-center">
                {likers.slice(0, 3).map((user, index) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.username}`}
                    className={`relative overflow-hidden rounded-full border border-white ${index > 0 ? "-ml-1.5" : ""}`}
                    title={authorName(user)}
                  >
                    <UserAvatar avatarUrl={user.avatar} name={authorName(user)} size={20} />
                  </Link>
                ))}
              </div>
              <span className="text-[14px] font-medium text-[#6B7280] pl-1">{formatCount(post.likesCount)}</span>
            </>
          ) : (
            <span className="text-[14px] text-[#9CA3AF]">Be the first to like</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-[12px] text-[#6B7280] sm:gap-4 sm:text-[14px]">
          <button type="button" onClick={() => void toggleComments()} className="cursor-pointer hover:underline">
            {formatCount(post.commentsCount)} Comments
          </button>
          {(post.sharesCount || 0) > 0 ? <span>{formatCount(post.sharesCount || 0)} Shares</span> : null}
        </div>
      </div>

      <div className="flex items-center justify-around sm:justify-between sm:px-2">
        <button
          type="button"
          onClick={() => void handleLike()}
          className={`relative flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-2 text-[13px] transition-all sm:gap-2 sm:px-4 sm:text-[14px] ${
            post.liked
              ? "font-semibold text-[#00696F] bg-[rgba(0,105,111,0.12)]"
              : "font-medium text-[#4B5563] hover:bg-gray-50"
          }`}
        >
          <span
            className={`inline-block size-[14px] ${likeBurst ? "like-pop" : ""}`}
            style={{
              backgroundColor: "currentColor",
              WebkitMaskImage: "url(/figma/icons/like.svg)",
              maskImage: "url(/figma/icons/like.svg)",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              WebkitMaskSize: "contain",
              maskSize: "contain",
            }}
            aria-hidden
          />
          Like
          {likeBurst ? <span className="like-burst">👍</span> : null}
        </button>
        <button
          type="button"
          onClick={() => void toggleComments()}
          className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-medium sm:gap-2 sm:px-4 sm:text-[14px] ${
            showComments ? "text-[#00696F] bg-[rgba(0,105,111,0.12)]" : "text-[#4B5563] hover:bg-gray-50"
          }`}
        >
          <span className="relative w-[14px] h-[14px] overflow-clip">
            <img src="/figma/icons/comment.svg" alt="" width={14} height={14} className="size-full object-contain" />
          </span>
          Comment
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShareOpen((open) => !open);
              setShareNotice("");
              setSentChatId("");
            }}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-medium text-[#4B5563] hover:bg-gray-50 sm:gap-2 sm:px-4 sm:text-[14px]"
          >
            <span className="relative w-[14px] h-[12px] overflow-clip">
              <img src="/figma/icons/share.svg" alt="" width={14} height={12} className="size-full object-contain" />
            </span>
            Share
          </button>
          {shareOpen ? (
            <div className="absolute right-0 bottom-11 z-20 w-[200px] rounded-[12px] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
              <button
                type="button"
                onClick={() => {
                  setShareOpen(false);
                  setSendOpen(true);
                  setSendError("");
                }}
                className="w-full cursor-pointer px-4 py-2 text-left text-[13px] hover:bg-[#EFF4FF]"
              >
                Send in message
              </button>
              <button
                type="button"
                onClick={() => void nativeShare()}
                className="w-full cursor-pointer px-4 py-2 text-left text-[13px] hover:bg-[#EFF4FF]"
              >
                Share now
              </button>
              <button
                type="button"
                onClick={() => void copyLink()}
                className="w-full cursor-pointer px-4 py-2 text-left text-[13px] hover:bg-[#EFF4FF]"
              >
                Copy link
              </button>
              {shareNotice && !sentChatId ? (
                <p className="px-4 py-2 text-[12px] font-medium text-[#00696F]">{shareNotice}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {showComments ? (
        <div className="comment-panel border-t border-[#F3F4F6] pt-3">
          {loadingComments ? (
            <p className="py-2 text-[13px] text-[#6B7280]">Loading comments…</p>
          ) : comments.length ? (
            <ul className="flex max-h-[280px] flex-col gap-3 overflow-y-auto pb-3">
              {comments.map((comment) => {
                const name = authorName(comment.author);
                return (
                  <li key={comment.id} className="flex items-start gap-2">
                    <Link href={`/profile/${comment.author.username}`}>
                      <UserAvatar avatarUrl={comment.author.avatar} name={name} size={32} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="rounded-[12px] bg-[#F3F4F6] px-3 py-2">
                        <Link href={`/profile/${comment.author.username}`} className="text-[13px] font-semibold text-[#111827] hover:underline">
                          {name}
                        </Link>
                        <p className="text-[13px] text-[#1F2937]">{comment.body}</p>
                      </div>
                      <span className="pl-3 text-[11px] text-[#9CA3AF]">{formatPostTime(comment.createdAt)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-2 text-[13px] text-[#6B7280]">Be the first to comment.</p>
          )}
          <form onSubmit={(event) => void handleComment(event)} className="flex items-center gap-2">
            <UserAvatar avatarUrl={me?.avatar} name={me ? `${me.firstName} ${me.lastName}` : "You"} size={32} />
            <input
              ref={commentInputRef}
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="Write a comment…"
              className="h-10 flex-1 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-[14px] outline-none focus:border-[#00696F]"
            />
            <button
              type="submit"
              disabled={working || !commentDraft.trim()}
              className="rounded-full bg-[#00696F] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              Post
            </button>
          </form>
        </div>
      ) : null}

      {error ? <p className="text-[13px] text-red-600">{error}</p> : null}

      {shareNotice && sentChatId ? (
        <p className="text-center text-[13px] text-[#00696F]">
          {shareNotice}.{" "}
          <Link href={`/messenger?chatId=${sentChatId}`} className="cursor-pointer font-semibold underline">
            Open chat
          </Link>
        </p>
      ) : null}

      {sendOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
          onClick={() => {
            if (sendingTo) return;
            setSendOpen(false);
            setFriendQuery("");
            setSendNote("");
          }}
        >
          <div
            className="w-full max-w-[420px] rounded-[16px] bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#111827]">Send in message</h3>
              <button
                type="button"
                onClick={() => {
                  if (sendingTo) return;
                  setSendOpen(false);
                  setFriendQuery("");
                  setSendNote("");
                }}
                className="size-8 cursor-pointer rounded-full text-[18px] text-[#6B7280] hover:bg-[#F3F4F6]"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <input
              value={sendNote}
              onChange={(event) => setSendNote(event.target.value)}
              placeholder="Add a message (optional)"
              className="mb-3 h-10 w-full rounded-[8px] border border-[#D8D2D2] px-3 text-[14px] outline-none focus:border-[#00696F]"
            />
            <input
              value={friendQuery}
              onChange={(event) => setFriendQuery(event.target.value)}
              placeholder="Search friends"
              className="mb-3 h-10 w-full rounded-[8px] border border-[#D8D2D2] px-3 text-[14px] outline-none focus:border-[#00696F]"
            />
            <ul className="max-h-[260px] overflow-y-auto">
              {loadingFriends ? (
                <p className="py-6 text-center text-[13px] text-[#6B7280]">Loading friends…</p>
              ) : friendMatches.length ? (
                friendMatches.map((friend) => (
                  <li key={friend.id}>
                    <button
                      type="button"
                      disabled={Boolean(sendingTo)}
                      onClick={() => void sendToFriend(friend)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-[8px] px-2 py-2 text-left hover:bg-[#EFF4FF] disabled:opacity-60"
                    >
                      <UserAvatar avatarUrl={friend.avatar} name={friendName(friend)} size={36} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-[#111827]">
                          {friendName(friend)}
                        </span>
                        <span className="block text-[12px] text-[#6B7280]">@{friend.username}</span>
                      </span>
                      <span className="text-[13px] font-semibold text-[#00696F]">
                        {sendingTo === friend.id ? "Sending…" : "Send"}
                      </span>
                    </button>
                  </li>
                ))
              ) : (
                <p className="py-6 text-center text-[13px] text-[#6B7280]">
                  {friends.length ? "No matching friends." : "Add friends to send posts in a message."}
                </p>
              )}
            </ul>
            {sendError ? <p className="mt-3 text-[13px] text-red-600">{sendError}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
