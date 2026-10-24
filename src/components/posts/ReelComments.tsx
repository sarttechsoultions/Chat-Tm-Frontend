"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { PostItem } from "../../lib/api/posts";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { UserAvatar } from "../ui/UserAvatar";
import PostComments from "./PostComments";

export default function ReelComments({ post, onClose, onCountChanged }: {
  post: PostItem; onClose: () => void; onCountChanged: (count: number) => void;
}) {
  const user = useCurrentUser();
  return <section aria-label="Reel comments" className="flex h-full min-h-0 flex-col bg-white">
    <header className="flex shrink-0 items-center justify-between border-b border-[#EDF1F2] px-5 py-4">
      <h2 className="text-base font-semibold">Comments <span className="ml-1 text-sm font-normal text-gray-500">{post.commentsCount}</span></h2>
      <button type="button" aria-label="Close comments" onClick={onClose} className="flex size-10 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"><X size={18} /></button>
    </header>
    <div style={{ display: "var(--reel-caption-display, block)" }} className="shrink-0 border-b border-[#EDF1F2] px-5 py-3">
      <Link href={"/profile/" + post.author.username} className="flex items-center gap-2 text-sm font-semibold"><UserAvatar avatarUrl={post.author.avatar} name={post.author.firstName} size={30} />{post.author.firstName} {post.author.lastName}</Link>
      {post.heading || post.body ? <p className="mt-2 line-clamp-2 break-words text-sm text-gray-600">{post.heading || post.body}</p> : null}
    </div>
    <div className="min-h-0 flex-1">
      <PostComments key={post.id + ":" + (user?.id || "loading")} postId={post.id} postAuthorId={post.author.id} fill onCountChanged={onCountChanged} />
    </div>
  </section>;
}
