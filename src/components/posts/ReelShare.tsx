"use client";
import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle, Share2, X } from "lucide-react";
import { listFriends, type FriendUser } from "../../lib/auth";
import { postShareUrl, sharePost, type PostItem } from "../../lib/api/posts";
import { createDirectConversation, sendMessage } from "../../lib/api/chat";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { UserAvatar } from "../ui/UserAvatar";
import ReelOverlay from "./ReelOverlay";

export default function ReelShare({post,onClose,onShared}:{post:PostItem;onClose:()=>void;onShared:(post:PostItem)=>void}) {
  const user=useCurrentUser();
  const [friends,setFriends]=useState<FriendUser[]>([]);
  const [loading,setLoading]=useState(true);
  const [query,setQuery]=useState("");
  const [note,setNote]=useState("");
  const [busy,setBusy]=useState("");
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");
  const [sent,setSent]=useState<string[]>([]);
  const [copied,setCopied]=useState(false);
  const url=postShareUrl(post.author.username,post.id);
  useEffect(()=>{let cancelled=false;listFriends().then(data=>{if(!cancelled)setFriends(data.items);}).catch(()=>{if(!cancelled)setError("Unable to load friends. You can still copy the link.");}).finally(()=>{if(!cancelled)setLoading(false);});return()=>{cancelled=true;};},[]);
  const record=async()=>{try{onShared(await sharePost(post.id));}catch{/* Sharing succeeded even if the count could not refresh. */}};
  const copy=async()=>{if(busy)return;setBusy("copy");setError("");try{await navigator.clipboard.writeText(url);setCopied(true);setNotice("Link copied.");await record();}catch{setError("Unable to copy. Select and copy the link below.");}finally{setBusy("");}};
  const nativeShare=async()=>{if(!navigator.share){await copy();return;}if(busy)return;setBusy("native");setError("");try{await navigator.share({title:"ChatTm reel",text:note.trim()||post.heading||post.body,url});setNotice("Reel shared.");await record();}catch(err){if(!(err instanceof DOMException&&err.name==="AbortError"))setError("Unable to share this reel.");}finally{setBusy("");}};
  const send=async(friend:FriendUser)=>{if(busy||sent.includes(friend.id))return;setBusy(friend.id);setError("");try{const chat=await createDirectConversation(friend.id);await sendMessage(chat.id,[note.trim(),`Shared a reel from ${post.author.firstName} ${post.author.lastName}`,url].filter(Boolean).join("\n\n"));setSent(current=>[...current,friend.id]);setNotice(`Sent to ${friend.firstName}.`);await record();}catch(err){setError(err instanceof Error?err.message:"Unable to send reel.");}finally{setBusy("");}};
  const filtered=friends.filter(friend=>`${friend.firstName} ${friend.lastName} ${friend.username}`.toLowerCase().includes(query.toLowerCase()));
  return <ReelOverlay label="Share reel" onClose={onClose}>
    <header className="flex shrink-0 items-center justify-between border-b border-[#EDF1F2] px-5 py-4"><h2 className="text-lg font-semibold">Share reel</h2><button aria-label="Close share" onClick={onClose} className="rounded-full bg-gray-100 p-2 hover:bg-gray-200"><X size={18}/></button></header>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="p-5"><div className="flex items-center gap-3"><UserAvatar avatarUrl={user?.avatar} name={user?.firstName} size={40}/><div><p className="text-sm font-semibold">{user?`${user.firstName} ${user.lastName}`:"Share a moment"}</p><p className="mt-0.5 text-xs text-gray-500">Send a reel to someone you know</p></div></div><textarea aria-label="Add a message to your share" placeholder="Say something about this reel…" value={note} maxLength={2000} onChange={event=>setNote(event.target.value)} rows={2} className="mt-4 w-full resize-none rounded-xl border border-[#E5EBEC] p-3 text-sm outline-[#00696F]"/><div className="mt-2 flex items-center justify-between gap-4"><p className="line-clamp-2 text-xs text-gray-500">{post.heading||post.body||`Reel by ${post.author.firstName}`}</p><button onClick={()=>void nativeShare()} disabled={!!busy} className="shrink-0 rounded-lg bg-[#00696F] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Share link</button></div></div>
      <div className="border-t border-[#EDF1F2] px-5 py-4"><h3 className="text-sm font-semibold">Send in Messenger</h3><input aria-label="Search friends to share with" placeholder="Search friends" value={query} onChange={event=>setQuery(event.target.value)} className="mt-3 w-full rounded-full bg-[#F1F5F5] px-4 py-2 text-sm outline-[#00696F]"/><div className="mt-4 flex gap-4 overflow-x-auto pb-2">{loading?<p role="status" className="py-3 text-xs text-gray-500">Loading friends…</p>:!filtered.length?<p className="py-3 text-xs text-gray-500">{query?"No matching friends.":"No friends to send to yet. Copy a link below."}</p>:filtered.map(friend=><button key={friend.id} disabled={!!busy||sent.includes(friend.id)} onClick={()=>void send(friend)} aria-label={`Send reel to ${friend.firstName} ${friend.lastName}`} className="flex w-16 shrink-0 flex-col items-center gap-2 text-center disabled:opacity-50"><span className="relative"><UserAvatar avatarUrl={friend.avatar} name={friend.firstName} size={52}/>{sent.includes(friend.id)&&<Check aria-hidden="true" size={18} className="absolute bottom-0 right-0 rounded-full bg-[#00696F] p-0.5 text-white"/>}</span><span className="w-full truncate text-xs">{busy===friend.id?"Sending…":sent.includes(friend.id)?"Sent":friend.firstName}</span></button>)}</div></div>
      <div className="border-t border-[#EDF1F2] px-5 pt-4"><h3 className="text-sm font-semibold">Share to</h3><div className="mt-4 flex justify-around gap-4"><button disabled={!!busy} onClick={()=>void copy()} className="flex flex-col items-center gap-2 text-xs disabled:opacity-50"><span className="rounded-full bg-[#EFF4F4] p-4">{copied?<Check size={22}/>:<Copy size={22}/>}</span>{copied?"Copied":"Copy link"}</button><a href={`https://wa.me/?text=${encodeURIComponent([note.trim(),url].filter(Boolean).join("\n"))}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-xs"><span className="rounded-full bg-[#E7F7ED] p-4 text-[#16894B]"><MessageCircle size={22}/></span>WhatsApp</a><button disabled={!!busy} onClick={()=>void nativeShare()} className="flex flex-col items-center gap-2 text-xs disabled:opacity-50"><span className="rounded-full bg-[#EFF4F4] p-4"><Share2 size={22}/></span>More options</button></div><input readOnly aria-label="Reel share link" value={url} onFocus={event=>event.target.select()} className="mt-4 w-full rounded-lg bg-[#F5F7F7] p-2.5 text-xs text-gray-500"/></div>
      {notice&&<p role="status" className="px-5 pt-3 text-sm text-[#00696F]">{notice}</p>}{error&&<p role="alert" className="px-5 pt-3 text-sm text-red-600">{error}</p>}
    </div>
  </ReelOverlay>;
}
