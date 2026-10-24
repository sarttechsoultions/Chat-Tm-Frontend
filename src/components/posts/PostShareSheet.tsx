"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Link2, MessageCircle, Search, Send, Share2, X } from "lucide-react";
import { listFriends, type FriendUser } from "../../lib/auth";
import { postShareUrl, sharePost, type PostItem } from "../../lib/api/posts";
import { createDirectConversation, sendMessage } from "../../lib/api/chat";
import { UserAvatar } from "../ui/UserAvatar";
import { useCurrentUser } from "../hooks/useCurrentUser";
import ReelOverlay from "./ReelOverlay";

type Props = { post: PostItem; onClose: () => void; onShared: (post: PostItem) => void };
const nameOf = (friend: FriendUser) => `${friend.firstName} ${friend.lastName}`.trim() || friend.username;

function ShareSheet({ post, onClose, onShared }: Props) {
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendsError, setFriendsError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [sent, setSent] = useState<string[]>([]);
  const [attemptedIds, setAttemptedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const deliveries = useRef(new Map<string, { key: string; body: string }>());
  const alive = useRef(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const url = postShareUrl(post.id);
  const reel = post.media[0]?.type.toLowerCase().includes("video");
  const label = reel ? "reel" : "post";
  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    listFriends().then(data => { if (!cancelled) setFriends(data.items || []); })
      .catch(() => { if (!cancelled) setFriendsError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; alive.current = false; };
  }, [attempt]);

  function lock() {
    if (busyRef.current) return false;
    busyRef.current = true; setBusy(true); setError(""); setNotice(""); return true;
  }
  function unlock() { busyRef.current = false; if (alive.current) setBusy(false); }
  function close() { if (!busyRef.current) onClose(); }
  async function record() {
    try { const updated = await sharePost(post.id); if (alive.current) onShared(updated); } catch { /* Delivery succeeded; a failed counter refresh must not trigger a resend. */ }
  }
  async function copy() {
    if (!lock()) return;
    try { await navigator.clipboard.writeText(url); if (alive.current) { setCopied(true); setNotice("Link copied."); } await record(); }
    catch { if (alive.current) setError("Couldn’t copy the link. Select and copy it below."); }
    finally { unlock(); }
  }
  async function nativeShare() {
    if (!navigator.share) { await copy(); return; }
    if (!lock()) return;
    try { await navigator.share({ title: "ChatTm", text: note.trim() || `Open this ${label} on ChatTm`, url }); if (alive.current) setNotice("Link shared."); await record(); }
    catch (err) { if (alive.current && !(err instanceof DOMException && err.name === "AbortError")) setError("Couldn’t share the link. Please try again."); }
    finally { unlock(); }
  }
  async function send() {
    if (!selected.length || !lock()) return;
    setAttemptedIds(previous => [...new Set([...previous, ...selected])]);
    const failed: string[] = [];
    let delivered = 0;
    for (const friendId of selected) {
      if (!alive.current) break;
      try {
        // Keep the exact payload/key after an uncertain network result so retry cannot duplicate it.
        let delivery = deliveries.current.get(friendId);
        if (!delivery) {
          delivery = { key: crypto.randomUUID(), body: [note.trim(), `Shared a ${label} on ChatTm`, url].filter(Boolean).join("\n\n") };
          deliveries.current.set(friendId, delivery);
        }
        const chat = await createDirectConversation(friendId);
        if (!alive.current) break;
        await sendMessage(chat.id, delivery.body, undefined, { clientMessageId: delivery.key });
        delivered++;
        if (alive.current) setSent(previous => [...previous, friendId]);
        await record();
      } catch { failed.push(friendId); }
    }
    if (alive.current) {
      setSelected(failed);
      if (delivered) setNotice(`Sent to ${delivered} ${delivered === 1 ? "person" : "people"}.`);
      if (failed.length) setError(`Couldn’t send to ${failed.length} ${failed.length === 1 ? "person" : "people"}. Retry the selected recipients with the original message.`);
    }
    unlock();
  }
  const matches = friends.filter(friend => `${nameOf(friend)} ${friend.username}`.toLowerCase().includes(query.trim().toLowerCase()));

  return <ReelOverlay label={`Share ${label}`} onClose={close} tallSheet>
    <header className="flex shrink-0 items-center justify-between px-5 pb-3 pt-2 sm:pt-5">
      <div><h2 className="text-lg font-semibold">Share {label}</h2><p className="mt-0.5 text-xs text-[#6B7280]">Send a moment to your people</p></div>
      <button type="button" aria-label="Close share" onClick={close} disabled={busy} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F1F5F5] disabled:opacity-50"><X size={19}/></button>
    </header>
    <div className="shrink-0 px-5 pb-3">
      <label className="flex min-h-11 items-center gap-2 rounded-xl bg-[#F1F5F5] px-3 text-[#728488]"><Search size={19}/><input autoFocus={false} aria-label="Search friends to share with" placeholder="Search friends" value={query} onChange={event => setQuery(event.target.value)} className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[#0B1C30] outline-none"/></label>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
      {loading ? <p role="status" className="py-8 text-center text-sm text-[#6B7280]">Loading friends…</p> : friendsError ? <div className="py-5 text-center"><p role="alert" className="text-sm text-[#6B7280]">Couldn’t load friends.</p><button type="button" onClick={() => { setFriendsError(false); setLoading(true); setAttempt(value => value + 1); }} className="min-h-11 px-4 text-sm font-semibold text-[#00696F]">Retry friends</button></div> : !matches.length ? <p className="py-8 text-center text-sm text-[#6B7280]">{query ? "No matching friends." : "No friends yet. You can still share a link below."}</p> : <div className="grid grid-cols-3 gap-x-3 gap-y-5 py-2 sm:grid-cols-4">
        {matches.map(friend => {
          const isSent = sent.includes(friend.id), checked = selected.includes(friend.id);
          return <button type="button" key={friend.id} aria-label={`Select ${nameOf(friend)}`} aria-pressed={checked} disabled={busy || isSent} onClick={() => setSelected(previous => checked ? previous.filter(id => id !== friend.id) : [...previous, friend.id])} className="flex min-w-0 flex-col items-center gap-2 rounded-xl px-1 py-1 outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#00696F] disabled:opacity-60">
            <span className={`relative rounded-full p-1 ${checked || isSent ? "ring-2 ring-[#00696F]" : "ring-1 ring-transparent"}`}><UserAvatar avatarUrl={friend.avatar} name={nameOf(friend)} size={64}/>{checked || isSent ? <span className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full border-2 border-white bg-[#00696F] text-white"><Check size={14}/></span> : null}</span>
            <span className="line-clamp-2 min-h-9 text-center text-xs font-medium leading-[18px]">{nameOf(friend)}</span>
            {isSent ? <span className="text-[10px] font-semibold text-[#00696F]">Sent</span> : null}
          </button>;
        })}
      </div>}
    </div>
    <footer className="max-h-[55%] shrink-0 overflow-y-auto border-t border-[#E8EEEF] bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
      {notice ? <p role="status" className="mb-2 text-center text-xs font-medium text-[#00696F]">{notice}</p> : null}
      {error ? <p role="alert" className="mb-2 text-center text-xs leading-5 text-red-600">{error}</p> : null}
      {selected.length ? <div className="mb-3 flex items-center gap-2"><input aria-label="Add a message to your share" placeholder="Add a message (optional)" value={note} disabled={busy || selected.some(id => attemptedIds.includes(id))} maxLength={2000} onChange={event => setNote(event.target.value)} className="h-11 min-w-0 flex-1 rounded-xl bg-[#F1F5F5] px-3 text-sm outline-[#00696F]"/><button type="button" disabled={busy} onClick={() => void send()} className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-[#00696F] px-4 text-sm font-semibold text-white disabled:opacity-50"><Send size={16}/>{busy ? "Sending…" : `Send (${selected.length})`}</button></div> : null}
      <div className="flex items-start justify-around gap-3">
        <button type="button" disabled={busy} onClick={() => void copy()} className="flex min-w-0 flex-col items-center gap-2 text-[11px] font-medium disabled:opacity-50"><span className="flex size-12 items-center justify-center rounded-full bg-[#EFF4F4]">{copied ? <Check size={23}/> : <Link2 size={23}/>}</span>{copied ? "Copied" : "Copy link"}</button>
        <a href={`https://wa.me/?text=${encodeURIComponent([note.trim(), url].filter(Boolean).join("\n"))}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp" className="flex min-w-0 flex-col items-center gap-2 text-[11px] font-medium"><span className="flex size-12 items-center justify-center rounded-full bg-[#25D366] text-white"><MessageCircle size={25}/></span>WhatsApp</a>
        <button type="button" disabled={busy} onClick={() => void nativeShare()} className="flex min-w-0 flex-col items-center gap-2 text-[11px] font-medium disabled:opacity-50"><span className="flex size-12 items-center justify-center rounded-full bg-[#EFF4F4]"><Share2 size={23}/></span>Share</button>
      </div>
      {error.includes("copy") ? <label className="mt-3 flex items-center gap-2 text-xs text-[#6B7280]"><Copy size={14}/><input readOnly aria-label="Post share link" value={url} onFocus={event => event.target.select()} className="h-9 min-w-0 flex-1 rounded-lg bg-[#F1F5F5] px-2"/></label> : null}
      <p className="mt-3 text-center text-[10px] leading-4 text-[#7B898C]">Only people in this {label}’s audience can view it.</p>
    </footer>
  </ReelOverlay>;
}

export default function PostShareSheet(props: Props) {
  const user = useCurrentUser();
  return user ? <ShareSheet key={`${user.id}:${props.post.id}`} {...props}/> : null;
}
