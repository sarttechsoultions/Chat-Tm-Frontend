"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAvatar } from "../ui/UserAvatar";
import { playLikeSound, playShareSound } from "../../lib/sounds";
import { useCurrentUser } from "../hooks/useCurrentUser";
import {
  deletePost,
  postShareUrl,
  sharePost,
  togglePostLike,
  setPostHidden,
  type PostPreferences,
  type PostAuthor,
  type PostItem,
} from "../../lib/api/posts";

import MediaCarousel from "../posts/MediaCarousel";
import PostOptionsMenu from "../posts/PostOptionsMenu";
import { announcePostSuccess } from "../posts/PostNotice";
import PostComments from "../posts/PostComments";
import PostShareSheet from "../posts/PostShareSheet";

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

function PostMediaGrid({ media, onVideoOpen, compact=false }: { media: PostItem["media"]; onVideoOpen: () => void; compact?:boolean }) {
  if (!media.length) return null;

  return <MediaCarousel items={media} aspect={compact ? 4/3 : media[0]?.type.toLowerCase().includes("video") ? 4/5 : 1} onVideoOpen={onVideoOpen} />;
}

export default function PostCard({
  post: initialPost,
  compactMedia = false,
  onDeleted,
  initiallyShowComments = false,
  showHiddenContent = false,
  onPreferenceChanged,
}: {
  post: PostItem;
  compactMedia?: boolean;
  initiallyShowComments?: boolean;
  onDeleted?: (id: string) => void;
  onUpdated?: (post: PostItem) => void;
  showHiddenContent?: boolean;
  onPreferenceChanged?: (id: string, preferences: PostPreferences) => void;
}) {
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(initiallyShowComments);
  const [commentsVisited, setCommentsVisited] = useState(initiallyShowComments);
  const [working, setWorking] = useState(false);
  const [undoBusy, setUndoBusy] = useState(false);
  const undoBusyRef = useRef(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareNotice, setShareNotice] = useState("");
  const [likeBurst, setLikeBurst] = useState(false);
  const [heartAnimKey, setHeartAnimKey] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const lastTapRef = useRef<number>(0);
  const [error, setError] = useState("");
  const router = useRouter();
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
  const updateCommentCount = useCallback((commentsCount: number) => {
    setPost(previous => ({ ...previous, commentsCount }));
  }, []);

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  function updatePreferences(preferences: PostPreferences) {
    setPost(current => ({ ...current, ...preferences }));
    onPreferenceChanged?.(post.id, preferences);
  }

  async function undoHide() {
    if (undoBusyRef.current) return;
    undoBusyRef.current = true;
    setUndoBusy(true);
    setError("");
    try {
      updatePreferences(await setPostHidden(post.id, false));
      announcePostSuccess("Post can appear in your feeds again.");
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't restore the post. Try Undo again."); }
    finally { undoBusyRef.current = false; setUndoBusy(false); }
  }
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

  function triggerDoubleTapHeart() {
    const key = Date.now();
    setHeartAnimKey(key);
    window.setTimeout(() => {
      setHeartAnimKey((curr) => (curr === key ? null : curr));
    }, 950);
  }

  function handleMediaDoubleTap(e?: React.MouseEvent | React.TouchEvent) {
    if (e) {
      const target = e.target as HTMLElement;
      if (target.closest("button") || target.closest("video")) return;
    }
    triggerDoubleTapHeart();
    if (!post.liked) {
      void handleLike();
    } else {
      playLikeSound();
      setLikeBurst(true);
      window.setTimeout(() => setLikeBurst(false), 500);
    }
  }

  function handleMediaTouchEnd(e: React.TouchEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("video")) return;

    const now = Date.now();
    const diff = now - lastTapRef.current;
    if (diff > 0 && diff < 350) {
      lastTapRef.current = 0;
      handleMediaDoubleTap(e);
    } else {
      lastTapRef.current = now;
    }
  }

  function toggleComments() {
    setCommentsVisited(true);
    setShowComments(value => !value);
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
    const url = postShareUrl(post.id);
    try {
      await navigator.clipboard.writeText(url);
      setShareNotice("Link copied");
      playShareSound();
      setPost(await sharePost(post.id).catch(() => post));
    } catch {
      setShareNotice("Unable to copy link.");
    }
  }

  if (post.hidden && !showHiddenContent) return (
    <div id={`post-${post.id}`} className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div role="status">
          <p className="text-sm font-semibold text-[#111827]">Post hidden from your feeds</p>
          <p className="mt-1 text-xs text-[#6B7280]">Manage hidden posts in <Link href="/saved?view=hidden" className="font-medium text-[#00696F] underline">Saved → Hidden</Link>.</p>
        </div>
        <button type="button" disabled={undoBusy} onClick={() => void undoHide()} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-[#00696F] hover:bg-[#EFF4FF] disabled:opacity-50">{undoBusy ? "Restoring…" : "Undo"}</button>
      </div>
      {error ? <p role="alert" className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );

  return (
    <div id={`post-${post.id}`} className="w-full min-w-0 bg-white rounded-[16px] p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col gap-2">
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
              {post.saved ? <span className="font-medium text-[#00696F]">• Saved</span> : null}
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
        <PostOptionsMenu post={post} isOwner={isOwner} deleting={working} onDelete={() => void handleDelete()} onCopyLink={() => void copyLink()} onShare={() => setShareOpen(true)} onPreferenceChanged={updatePreferences} />
      </div>

      {post.hidden ? <p className="rounded-lg bg-[#F3F4F6] px-3 py-2 text-xs text-[#6B7280]">Hidden from your feeds. Choose Unhide post in the options menu to restore it.</p> : null}

      {post.heading ? (
        <h3 className="break-words pt-1 text-[18px] font-bold leading-6 text-[#111827]">{post.heading}</h3>
      ) : null}
      {post.body ? (
        <div className="pt-1 text-[14px] leading-5 text-[#1F2937]">
          <p
            className={`break-words whitespace-pre-line ${!isExpanded ? "line-clamp-2" : ""}`}
            style={
              !isExpanded
                ? {
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }
                : undefined
            }
          >
            {renderCaption(post.body)}
          </p>
          {post.body.length > 100 || (post.body.match(/\n/g) || []).length >= 2 ? (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="mt-1 inline-flex items-center text-[13px] font-semibold text-[#6B7280] hover:text-[#00696F] transition-colors"
            >
              {isExpanded ? "Show less" : "… View more"}
            </button>
          ) : null}
        </div>
      ) : null}

      {post.media.length ? (
        <div
          className="relative overflow-hidden rounded-[12px] select-none touch-manipulation"
          onDoubleClick={handleMediaDoubleTap}
          onTouchEnd={handleMediaTouchEnd}
        >
          <PostMediaGrid
            compact={compactMedia}
            media={post.media}
            onVideoOpen={() => router.push(`/watch?reel=${post.id}`)}
          />
          {heartAnimKey ? (
            <div
              key={heartAnimKey}
              className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 insta-heart-pop"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-24 sm:size-28 fill-[#FF3040] drop-shadow-[0_8px_24px_rgba(255,48,64,0.55)] filter"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          ) : null}
        </div>
      ) : null}

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

            }}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-medium text-[#4B5563] hover:bg-gray-50 sm:gap-2 sm:px-4 sm:text-[14px]"
          >
            <span className="relative w-[14px] h-[12px] overflow-clip">
              <img src="/figma/icons/share.svg" alt="" width={14} height={12} className="size-full object-contain" />
            </span>
            Share
          </button>

        </div>
      </div>

      {commentsVisited ? <div hidden={!showComments}><PostComments key={`${post.id}:${me?.id || "loading"}`} postId={post.id} postAuthorId={post.author.id} active={showComments} onCountChanged={updateCommentCount} /></div> : null}

      {error ? <p className="text-[13px] text-red-600">{error}</p> : null}

      {shareNotice ? <p role="status" className="text-center text-xs text-[#00696F]">{shareNotice}</p> : null}
      {shareOpen ? <PostShareSheet post={post} onClose={() => setShareOpen(false)} onShared={setPost}/> : null}
    </div>
  );
}
