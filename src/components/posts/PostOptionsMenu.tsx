"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Bookmark, EllipsisVertical, Eye, EyeOff, Flag } from "lucide-react";
import { setPostHidden, setPostSaved, type PostItem, type PostPreferences } from "../../lib/api/posts";
import ReportPostDialog from "./ReportPostDialog";
import { announcePostSuccess } from "./PostNotice";

export default function PostOptionsMenu({ post, isOwner, deleting, onDelete, onCopyLink, onShare, onPreferenceChanged }: {
  post: PostItem; isOwner: boolean; deleting: boolean;
  onDelete: () => void; onCopyLink: () => void; onShare: () => void;
  onPreferenceChanged: (preferences: PostPreferences) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const busyRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const button = buttonRef.current;
      const menu = menuRef.current;
      if (!button || !menu) return;
      const bounds = button.getBoundingClientRect();
      const viewport = window.visualViewport;
      const topEdge = (viewport?.offsetTop || 0) + 12;
      const bottomEdge = (viewport?.offsetTop || 0) + (viewport?.height || innerHeight) - 12;
      menu.style.maxHeight = `${bottomEdge - topEdge}px`;
      const height = menu.getBoundingClientRect().height;
      const below = bounds.bottom + 4;
      menu.style.top = `${Math.max(topEdge, Math.min(below + height <= bottomEdge ? below : bounds.top - height - 4, bottomEdge - height))}px`;
      menu.style.left = `${Math.max(12, Math.min(bounds.right - menu.offsetWidth, innerWidth - menu.offsetWidth - 12))}px`;
    };
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => { window.removeEventListener("resize", position); window.removeEventListener("scroll", position, true); };
  }, [open, error, busy]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); buttonRef.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);

  async function change(kind: "saved" | "hidden") {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const preferences = kind === "saved" ? await setPostSaved(post.id, !post.saved) : await setPostHidden(post.id, !post.hidden);
      onPreferenceChanged(preferences);
      setOpen(false);
      announcePostSuccess(kind === "saved"
        ? preferences.saved ? "Post saved. Find it in Saved." : "Post removed from Saved."
        : preferences.hidden ? "Post hidden from your feeds." : "Post can appear in your feeds again.");
      buttonRef.current?.focus();
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't update the post. Please try again."); }
    finally { busyRef.current = false; setBusy(false); }
  }

  const itemClass = "flex min-h-11 w-full items-center gap-2 px-4 py-2 text-left text-[14px] hover:bg-[#F3F4F6] disabled:opacity-50";
  return <div ref={rootRef} className="relative shrink-0">
    <button ref={buttonRef} type="button" onClick={() => { setOpen(value => !value); setError(""); }} aria-label="Post options" aria-expanded={open} className="flex size-11 items-center justify-center rounded-full hover:bg-gray-50">
      <EllipsisVertical size={18} aria-hidden="true" />
    </button>
    {open ? <div ref={menuRef} aria-label="Post actions" className="fixed z-[120] w-[min(240px,80vw)] overflow-y-auto overscroll-contain rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-lg">
      <button type="button" disabled={busy} onClick={() => void change("saved")} className={itemClass}><Bookmark size={17} aria-hidden="true" fill={post.saved ? "currentColor" : "none"} />{post.saved ? "Remove from Saved" : "Save post"}</button>
      {!isOwner ? <>
        <button type="button" disabled={busy} onClick={() => void change("hidden")} className={itemClass}>{post.hidden ? <Eye size={17} aria-hidden="true" /> : <EyeOff size={17} aria-hidden="true" />}{post.hidden ? "Unhide post" : "Hide post"}</button>
        <button type="button" disabled={busy} onClick={() => { setOpen(false); setReportOpen(true); }} className={itemClass}><Flag size={17} aria-hidden="true" />Report post</button>
      </> : <>
        <Link href={`/create-post?edit=${post.id}`} onClick={() => setOpen(false)} className={itemClass}>Edit post</Link>
        <button type="button" disabled={deleting || busy} onClick={onDelete} className={`${itemClass} text-red-600`}>Delete post</button>
      </>}
      <div className="my-1 border-t border-[#F3F4F6]" />
      <button type="button" onClick={() => { setOpen(false); onCopyLink(); }} className={itemClass}>Copy link</button>
      <button type="button" onClick={() => { setOpen(false); onShare(); }} className={itemClass}>Share post</button>
      {!isOwner ? <Link href={`/profile/${post.author.username}`} onClick={() => setOpen(false)} className={itemClass}>View profile</Link> : null}
      {busy ? <p role="status" className="px-4 py-2 text-xs text-[#6B7280]">Updating your preferences…</p> : null}
      {error ? <p role="alert" className="px-4 py-2 text-xs text-red-600">{error} Please try the action again.</p> : null}
    </div> : null}
    {reportOpen ? <ReportPostDialog postId={post.id} onClose={() => { setReportOpen(false); requestAnimationFrame(() => buttonRef.current?.focus()); }} /> : null}
  </div>;
}
