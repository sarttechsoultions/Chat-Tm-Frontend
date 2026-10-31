"use client";

import {
  ArrowUpFromLine,
  Check,
  Copy,
  ExternalLink,
  Heart,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { adsRequest } from "../../lib/api/ads";
import { UserAvatar } from "../ui/UserAvatar";

type Ad = {
  id: string;
  advertiser: {
    firstName: string;
    username: string;
    avatar?: string | null;
    /** "friend" | "none" – returned by the backend */
    connection?: "friend" | "none";
  };
  headline: string;
  body: string;
  image: string;
  destination: string;
  cta: string;
  social: { likes: number; shares: number; comments: number; impressions: number; liked: boolean };
};

type AdComment = {
  id: string;
  body: string;
  createdAt: string;
  user: { firstName: string; lastName: string; username: string; avatar: string };
};

function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

/* ─── Share Sheet ──────────────────────────────────────────────────── */
function ShareSheet({
  ad,
  onClose,
  onShared,
}: {
  ad: Ad;
  onClose: () => void;
  onShared: (social: Ad["social"]) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const recordShare = async () => {
    try {
      const social = await adsRequest(`/${ad.id}/share`, {});
      onShared(social);
    } catch {}
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(ad.destination);
      setCopied(true);
      await recordShare();
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const nativeShare = async () => {
    if (!navigator.share) return;
    try {
      setSharing(true);
      await navigator.share({ title: ad.headline, text: ad.body, url: ad.destination });
      await recordShare();
      onClose();
    } catch {
      /* user cancelled */
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-[#18181b] pb-safe-area-inset-bottom shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideUp 0.28s cubic-bezier(.22,1,.36,1) both" }}
      >
        {/* handle */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20" />

        <div className="px-5 pt-4 pb-6">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Share</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close share"
              className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Ad preview */}
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
            <img src={ad.image} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{ad.headline}</p>
              <p className="mt-0.5 truncate text-xs text-white/50">{ad.destination}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            {/* Copy link */}
            <button
              type="button"
              onClick={() => void copyLink()}
              className="flex items-center gap-2.5 rounded-2xl bg-white/8 px-4 py-3.5 text-left text-sm font-medium text-white transition hover:bg-white/15 active:scale-95"
            >
              {copied ? (
                <Check className="size-5 shrink-0 text-green-400" />
              ) : (
                <Copy className="size-5 shrink-0 text-white/70" />
              )}
              {copied ? "Copied!" : "Copy link"}
            </button>

            {/* Native share / fallback */}
            {typeof navigator !== "undefined" && "share" in navigator ? (
              <button
                type="button"
                disabled={sharing}
                onClick={() => void nativeShare()}
                className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] px-4 py-3.5 text-sm font-medium text-white transition hover:opacity-90 active:scale-95 disabled:opacity-60"
              >
                <Share2 className="size-5 shrink-0" />
                Share via…
              </button>
            ) : (
              <a
                href={ad.destination}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={() => void recordShare()}
                className="flex items-center gap-2.5 rounded-2xl bg-white/8 px-4 py-3.5 text-sm font-medium text-white transition hover:bg-white/15 active:scale-95"
              >
                <Link2 className="size-5 shrink-0 text-white/70" />
                Open link
              </a>
            )}
          </div>

          <p className="mt-4 text-center text-[11px] text-white/30">
            Sponsored content · sharing counts as engagement
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────── */
export default function ReelSponsoredAd() {
  const [ad, setAd] = useState<Ad | null>(null);
  const ref = useRef<HTMLElement>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [comments, setComments] = useState<AdComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [working, setWorking] = useState("");

  useEffect(() => {
    let cancelled = false;
    void adsRequest("/delivery/feed")
      .then((data) => { if (!cancelled) setAd(data.ad); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ad || !ref.current) return;
    let recorded = false;
    let timer: number | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        clearTimeout(timer);
        if (entries[0].isIntersecting && entries[0].intersectionRatio >= 0.6 && !recorded) {
          timer = window.setTimeout(() => {
            if (document.hidden) return;
            recorded = true;
            void adsRequest(`/${ad.id}/event`, { type: "impression" }).catch(() => { recorded = false; });
          }, 1000);
        }
      },
      { threshold: [0, 0.6] },
    );
    observer.observe(ref.current);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [ad]);

  if (!ad) return null;

  const name = ad.advertiser.firstName || ad.advertiser.username;
  const isFriend = ad.advertiser.connection === "friend";
  const visit = () => { void adsRequest(`/${ad.id}/event`, { type: "click" }).catch(() => {}); };
  const updateSocial = (social: Ad["social"]) =>
    setAd((cur) => (cur ? { ...cur, social } : cur));

  const toggleLike = async () => {
    if (working) return;
    setWorking("like");
    try { updateSocial(await adsRequest(`/${ad.id}/like`, {})); }
    finally { setWorking(""); }
  };

  const openComments = async () => {
    setCommentsOpen(true);
    setWorking("comments");
    try {
      const data = await adsRequest(`/${ad.id}/comments`);
      setComments(data.items);
      updateSocial(data.stats);
    } finally { setWorking(""); }
  };

  const submitComment = async () => {
    if (!commentText.trim() || working) return;
    setWorking("comment");
    try {
      const data = await adsRequest(`/${ad.id}/comments`, { body: commentText });
      setComments((cur) => [data.comment, ...cur]);
      setCommentText("");
      updateSocial(data.stats);
    } finally { setWorking(""); }
  };

  return (
    <>
      <article
        ref={ref}
        aria-label={`Sponsored reel by ${name}`}
        className="relative h-full min-h-full shrink-0 snap-start snap-always overflow-hidden bg-black shadow-sm md:rounded-2xl"
      >
        {/* Blurred ambient background */}
        <img
          src={ad.image}
          alt=""
          className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-3xl"
        />

        {/* Instagram-style gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-transparent to-black/85" />

        {/* ── Top bar ── */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3.5">
          <div className="flex items-center gap-2.5">
            {/* Avatar with verified badge */}
            <div className="relative">
              <UserAvatar avatarUrl={ad.advertiser.avatar || ""} name={name} size={38} />
              <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#0095f6] ring-2 ring-black">
                <ShieldCheck className="size-2.5 text-white" strokeWidth={3} />
              </span>
            </div>

            {/* Name + sponsored */}
            <div>
              <p className="text-[13px] font-bold leading-none text-white drop-shadow">{name}</p>
              <p className="mt-0.5 text-[11px] font-medium text-white/65">Sponsored</p>
            </div>

            {/* Connection-aware button */}
            {isFriend ? (
              <span className="ml-1 flex items-center gap-1 rounded-lg border border-white/40 bg-white/10 px-3 py-1 text-[12px] font-semibold text-white/80">
                <UserCheck className="size-3.5" />
                Friend
              </span>
            ) : (
              <button
                type="button"
                className="ml-1 rounded-lg border border-white/80 px-3 py-1 text-[12px] font-semibold text-white transition hover:bg-white/20 active:scale-95"
              >
                Follow
              </button>
            )}
          </div>

          <button
            type="button"
            aria-label="Ad options"
            className="rounded-full p-1.5 text-white transition hover:bg-white/10"
          >
            <MoreHorizontal className="size-5" />
          </button>
        </div>

        {/* ── Centre image — pushed down slightly more ── */}
        <div className="absolute inset-x-0 top-16 bottom-60 flex items-center justify-center px-4">
          <img
            src={ad.image}
            alt={ad.headline}
            className="max-h-full w-full rounded-2xl object-contain drop-shadow-2xl"
          />
        </div>

        {/* ── Right-side action buttons — lower position ── */}
        <div className="absolute right-3 bottom-[228px] flex flex-col items-center gap-5 text-white">
          {/* Like */}
          <button
            type="button"
            disabled={working === "like"}
            onClick={() => void toggleLike()}
            aria-label={ad.social.liked ? "Unlike" : "Like"}
            className="flex flex-col items-center gap-1 transition active:scale-90 disabled:opacity-60"
          >
            <Heart
              size={27}
              fill={ad.social.liked ? "#ff3040" : "none"}
              stroke={ad.social.liked ? "#ff3040" : "white"}
              className="drop-shadow"
            />
            <span className="text-[11px] font-semibold drop-shadow">{fmtNum(ad.social.likes)}</span>
          </button>

          {/* Comment */}
          <button
            type="button"
            disabled={working === "comments"}
            onClick={() => void openComments()}
            aria-label="Comments"
            className="flex flex-col items-center gap-1 transition active:scale-90 disabled:opacity-60"
          >
            <MessageCircle size={27} className="drop-shadow" strokeWidth={2} />
            <span className="text-[11px] font-semibold drop-shadow">{fmtNum(ad.social.comments)}</span>
          </button>

          {/* Share — better icon: arrow-up-from-line (like iOS share) */}
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label="Share"
            className="flex flex-col items-center gap-1 transition active:scale-90"
          >
            <ArrowUpFromLine size={25} className="drop-shadow" strokeWidth={2} />
            <span className="text-[11px] font-semibold drop-shadow">{fmtNum(ad.social.shares)}</span>
          </button>
        </div>

        {/* ── AD badge — sits just below share button ── */}
        <span
          aria-label="Advertisement"
          className="absolute right-3 bottom-[208px] rounded-sm bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm ring-1 ring-white/30"
        >
          Ad
        </span>

        {/* ── Bottom info panel ── */}
        <div className="absolute inset-x-0 bottom-0 px-3 pb-4">
          {/* Caption */}
          <p className="mb-2 line-clamp-2 text-[13px] leading-5 text-white/90 drop-shadow">
            <span className="font-bold">{name} </span>
            {ad.body}
          </p>

          {/* CTA card */}
          <div className="rounded-2xl bg-black/55 p-3 backdrop-blur-md ring-1 ring-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Sponsored</p>
            <h2 className="mt-0.5 text-[15px] font-bold leading-5 text-white">{ad.headline}</h2>
            <a
              href={ad.destination}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={visit}
              className="mt-3 flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-[13px] font-bold text-black transition hover:bg-white/90 active:scale-[.98]"
            >
              {ad.cta}
              <ExternalLink aria-hidden className="size-3.5" />
            </a>
          </div>
        </div>

        {/* ── Comments sheet ── */}
        {commentsOpen && (
          <div className="absolute inset-x-0 bottom-0 z-20 max-h-[62%] rounded-t-3xl bg-[#111827] p-4 shadow-2xl ring-1 ring-white/10">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">Comments</h3>
                <p className="text-xs text-slate-400">Sponsored reel</p>
              </div>
              <button
                type="button"
                onClick={() => setCommentsOpen(false)}
                aria-label="Close comments"
                className="rounded-full p-2 text-white hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="max-h-44 space-y-3 overflow-y-auto pr-1">
              {comments.length ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <UserAvatar avatarUrl={comment.user.avatar} name={comment.user.firstName} size={28} />
                    <div className="min-w-0 rounded-xl bg-white/5 px-3 py-2 text-sm text-white">
                      <b className="font-semibold">{comment.user.firstName || comment.user.username}</b>
                      <br />
                      {comment.body}
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-slate-400">Be the first to comment.</p>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
              <input
                value={commentText}
                maxLength={500}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void submitComment(); }}
                placeholder="Write a comment…"
                className="min-h-10 min-w-0 flex-1 rounded-xl bg-white/10 px-3 text-sm text-white placeholder:text-white/40 outline-none ring-[#0095f6] focus:ring-2"
              />
              <button
                type="button"
                disabled={!commentText.trim() || working === "comment"}
                onClick={() => void submitComment()}
                aria-label="Post comment"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0095f6] text-white disabled:opacity-50"
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        )}
      </article>

      {/* ── Share sheet ── */}
      {shareOpen && (
        <ShareSheet
          ad={ad}
          onClose={() => setShareOpen(false)}
          onShared={(social) => { updateSocial(social); setShareOpen(false); }}
        />
      )}
    </>
  );
}
