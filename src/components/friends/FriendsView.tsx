"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  blockFriend, listBlockedFriends, unblockFriend,
  acceptFriendRequest,
  ApiError,
  deleteFriendRequest,
  dismissFriendSuggestion,
  type FriendRequest,
  type FriendUser,
  getStoredUser,
  listFriends,
  listSentFriendRequests,
  listFriendSuggestions,
  listMutualFriends,
  listReceivedFriendRequests,
  sendFriendRequest,
  unfriend,
} from "../../lib/auth";
import {useSocket} from "../hooks/useSocket";
import { useRouter } from "next/navigation";
import { UserAvatar } from "../ui/UserAvatar";
import { createDirectConversation } from "../../lib/api/chat";

type FriendTab = "blocked" | "sent" | "all" | "online" | "requests" | "suggestions";
const tabs: { id: FriendTab; label: string; href: string }[] = [
  { id: "requests", label: "Friend Requests", href: "/friends/requests" },
  { id: "suggestions", label: "Suggestions", href: "/friends/suggestions" },
  { id: "sent", label: "Sent Requests", href: "/friends/sent" },
  { id: "blocked", label: "Blocked", href: "/friends/blocked" },
];

const nameOf = (user: FriendUser) =>
  `${user.firstName} ${user.lastName}`.trim() || user.username;

function State({ loading, message }: { loading: boolean; message: string }) {
  return (
    <p className="py-10 text-center text-[14px] text-[#6B7280]">
      {loading ? "Loading…" : message}
    </p>
  );
}

function FriendListSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div
      aria-label="Loading friends"
      aria-busy="true"
      className="rounded-[12px] bg-white px-3 shadow-[0_0_4px_rgba(0,0,0,0.14)] sm:px-4"
    >
      {Array.from({ length: cards }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 border-b border-[#F3F4F6] py-4 last:border-b-0 sm:flex-row sm:items-center"
        >
          <div className="flex min-w-0 items-center gap-3 sm:flex-1">
            <div className="size-14 shrink-0 animate-pulse rounded-full bg-[#EEF2F7] sm:size-16" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-[#EEF2F7]" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-[#F3F6FA]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <div className="h-9 animate-pulse rounded-[8px] bg-[#E8F4F3] sm:w-24" />
            <div className="h-9 animate-pulse rounded-[8px] bg-[#F3F4F6] sm:w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FriendGridSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div aria-label="Loading friends" aria-busy="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-[12px] bg-white p-4 shadow-[0_0_4px_rgba(0,0,0,0.14)]">
          <div className="mx-auto size-16 rounded-full bg-[#EEF2F7]" />
          <div className="mx-auto mt-4 h-4 w-2/3 rounded bg-[#EEF2F7]" />
          <div className="mx-auto mt-2 h-3 w-1/2 rounded bg-[#F3F6FA]" />
          <div className="mt-5 h-10 rounded-[8px] bg-[#E8F4F3]" />
        </div>
      ))}
    </div>
  );
}

  const hiddenSuggestionKey=()=> "chattm:hidden-suggestions:"+(getStoredUser()?.id||"anonymous");
  const hiddenSuggestions=():string[]=>{
    try{const ids=JSON.parse(localStorage.getItem(hiddenSuggestionKey())||"[]");return Array.isArray(ids)?ids.filter((id):id is string=>typeof id==="string"):[];}catch{return [];}
  };
  const filterSuggestions=(items:FriendUser[])=>{
    const hidden=new Set(hiddenSuggestions());
    return items.filter(user=>!hidden.has(user.id));
  };

export default function FriendsView({ tab }: { tab: FriendTab }) {
  const [page, setPage] = useState(1);
  const [requestTotal,setRequestTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [showAllRequests,setShowAllRequests]=useState(false);
  const [outgoing,setOutgoing]=useState<FriendRequest[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<FriendUser[]>([]);
  const [sentRequests, setSentRequests] = useState<Record<string, string>>({});
  const [unfriendTarget, setUnfriendTarget] = useState<FriendUser | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState("");
  const [mutualTarget, setMutualTarget] = useState<FriendUser | null>(null);
  const [mutualPeople, setMutualPeople] = useState<FriendUser[]>([]);
  const [mutualLoading, setMutualLoading] = useState(false);

  const router = useRouter();
  const socket=useSocket();

  const removeSuggestion=async(id:string)=>{
    setWorking(id);
    setError("");
    try {
      await dismissFriendSuggestion(id);
      setSuggestions(prev=>prev.filter(user=>user.id!==id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to remove this suggestion.");
    } finally {
      setWorking("");
    }
  };

  const showMutualFriends=async(user:FriendUser)=>{
    setMutualTarget(user);
    setMutualPeople([]);
    setMutualLoading(true);
    try {
      const data=await listMutualFriends(user.id);
      setMutualPeople(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load mutual friends.");
      setMutualTarget(null);
    } finally {
      setMutualLoading(false);
    }
  };

  const refresh = useCallback(async (silent=false) => {
    if(!silent)setLoading(true);
    setError("");
    try {
      const sent = tab === "sent" ? await listSentFriendRequests(page) : { items: [] };
      if (tab === "sent") setHasNext(sent.items.length === 24);
      setOutgoing(sent.items);
      setSentRequests(Object.fromEntries(sent.items.map(row=>[row.user.id,row.id])));
      if (tab === "requests") {
        const [received,suggested]=await Promise.all([listReceivedFriendRequests(page),listFriendSuggestions()]);
        setHasNext(received.hasNext);
        setRequestTotal(received.total);
        if (!received.items.length && page > 1) setPage(value=>value-1);
        setRequests([...received.items].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()));
        setSuggestions(filterSuggestions(suggested.items));
      }
      else if (tab === "suggestions")
        setSuggestions(filterSuggestions((await listFriendSuggestions()).items));
      else if(tab === "blocked") { setFriends((await listBlockedFriends()).items); setHasNext(false); }
      else if(tab!=="sent") { const result = await listFriends(page); setFriends(result.items); setHasNext(result.items.length === 24); }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to load friends. Please try again."
      );
    } finally {
      if(!silent)setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSentRequests({});
      setUnfriendTarget(null);
      void refresh();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [refresh]);

  useEffect(()=>{
    const update=()=>{void refresh(true);};
    socket?.on("friend_requests_changed",update);socket?.on("connect",update);
    window.addEventListener("focus",update);
    return()=>{socket?.off("friend_requests_changed",update);socket?.off("connect",update);window.removeEventListener("focus",update);};
  },[socket,refresh]);
  useEffect(() => {
    if (!socket) return;
    const updatePresence = ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      const update = (users: FriendUser[]) => users.map(user => user.id === userId ? { ...user, isOnline } : user);
      setFriends(update);
      setSuggestions(update);
      setMutualPeople(update);
      setRequests(rows => rows.map(row => ({ ...row, user: row.user.id === userId ? { ...row.user, isOnline } : row.user })));
      setOutgoing(rows => rows.map(row => ({ ...row, user: row.user.id === userId ? { ...row.user, isOnline } : row.user })));
    };
    socket.on("user_presence_changed", updatePresence);
    return () => { socket.off("user_presence_changed", updatePresence); };
  }, [socket]);
  const visibleFriends = useMemo(
    () =>
      (tab === "online" ? friends.filter((item) => item.isOnline) : friends).filter(
        (item) => nameOf(item).toLowerCase().includes(query.toLowerCase())
      ),
    [friends, query, tab]
  );

  const title =
    tab === "blocked" ? "Blocked Users" : tab === "sent" ? "Sent Requests" : tab === "requests"
      ? "Friend Requests"
      : tab === "suggestions"
      ? "Suggestions"
      : "Friends";

  const subtitle =
    tab === "blocked" ? "Unblock someone to allow a new friend request. Unblocking does not restore friendship." : tab === "sent" ? "Manage requests you have sent." : tab === "online"
      ? "See who's active and ready to chat."
      : tab === "requests"
      ? "Manage your pending connections."
      : tab === "suggestions"
      ? "Discover people you may know."
      : "Connect with your friends and build your network.";

  async function act(id: string, job: () => Promise<unknown>, success: string) {
    setWorking(id);
    setError("");
    try {
      await job();
      setRequests(prev=>prev.filter(request=>request.id!==id));
      setNotice(success);
      window.dispatchEvent(new Event("chattm:friends-changed"));
      await refresh(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to complete this action."
      );
    } finally {
      setWorking("");
    }
  }

  async function handleSendRequest(user: FriendUser) {
    setWorking(user.id);
    setError("");
    try {
      const data = await sendFriendRequest(user.id);
      const requestId = data?.request?.id;
      if (requestId) {
        setSentRequests((prev) => ({ ...prev, [user.id]: requestId }));
        setOutgoing(prev=>[{id:requestId,createdAt:new Date().toISOString(),user},...prev.filter(row=>row.user.id!==user.id)]);
      }
      setNotice(`Friend request sent to ${nameOf(user)}.`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to send friend request."
      );
    } finally {
      setWorking("");
    }
  }

  async function handleCancelRequest(user: FriendUser) {
    const requestId = sentRequests[user.id];
    if (!requestId) return;
    setWorking(user.id);
    setError("");
    try {
      await deleteFriendRequest(requestId);
      setSentRequests((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
      setOutgoing(prev=>prev.filter(row=>row.id!==requestId));
      setNotice("Friend request cancelled.");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to cancel friend request."
      );
    } finally {
      setWorking("");
    }
  }

  async function confirmUnfriend() {
    if (!unfriendTarget) return;
    const user = unfriendTarget;
    setUnfriendTarget(null);
    await act(
      user.id,
      () => unfriend(user.id),
      `${nameOf(user)} was removed from your friends.`
    );
  }

  async function handleMessageClick(userId: string) {
    setWorking(userId);
    setError("");
    try {
      const chat = await createDirectConversation(userId);
      router.push(`/messenger?chatId=${chat.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start conversation."
      );
    } finally {
      setWorking("");
    }
  }

  return (
    <section className="mx-auto w-full max-w-[906px] rounded-2xl border border-[#E5EBEC] bg-white px-4 pb-6 pt-6 shadow-[0_4px_24px_rgba(18,57,60,0.04)] sm:px-7 sm:pt-7">
      <header className="border-b border-[#EDF1F2] pb-5">
        <h1 className="text-[22px] font-bold leading-8 text-[#111827] sm:text-[24px]">
          {title}
        </h1>
        <p className="mt-1 text-[14px] leading-5 text-[#6B7280]">{subtitle}</p>
        <nav
          aria-label="Friends sections"
          className="mt-5 flex flex-wrap gap-1.5 rounded-xl bg-[#F4F7F7] p-1.5"
        >
          {tabs.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors sm:flex-1 ${
                item.id === tab
                  ? "bg-white text-[#00696F] shadow-sm"
                  : "text-[#647478] hover:bg-white/70 hover:text-[#00696F]"
              }`}
            >
              {item.label}
              {item.id === "online" ? (
                <span className="size-2 rounded-full bg-[#16A34A]" />
              ) : null}
              {item.id === "requests" && requestTotal ? (
                <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[12px] text-[#4B5563]">
                  {requestTotal}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </header>

      {notice ? (
        <p
          role="status"
          className="mt-5 rounded-[8px] bg-[#E8F4F3] px-4 py-3 text-[14px] text-[#00696F]"
        >
          {notice}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-[8px] bg-red-50 px-4 py-3 text-[14px] text-red-700"
        >
          {error}
        </p>
      ) : null}

      {tab === "requests" ? (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[18px] font-bold">Friend Requests</h2>
            <span className="rounded-full bg-[#E8F4F3] px-3 py-1 text-[12px] font-semibold text-[#00696F]">
              {requestTotal} Pending
            </span>
          </div>
          {loading ? (
            <FriendGridSkeleton />
          ) : requests.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(showAllRequests?requests:requests.slice(0,3)).map(({ id, user, createdAt }) => (
                <article
                  key={id}
                  className="rounded-[12px] bg-white p-4 shadow-[0_0_4px_rgba(0,0,0,0.14)]"
                >
                  <div className="flex items-center gap-3">
                    <Link href={`/profile/${encodeURIComponent(user.username)}`} aria-label={`View ${nameOf(user)} profile`} className="shrink-0 rounded-lg hover:opacity-80">
                    <UserAvatar
                      avatarUrl={user.avatar}
                      name={nameOf(user)}
                      size="size-16"
                      isOnline={user.isOnline}
                    />
                    </Link>
                    <div>
                      <Link href={`/profile/${encodeURIComponent(user.username)}`} className="block truncate text-sm font-semibold hover:underline sm:text-base">{nameOf(user)}</Link>
                      <button type="button" disabled={!user.mutualFriends} onClick={()=>void showMutualFriends(user)} className="text-left text-[12px] text-[#3C494A] enabled:hover:underline disabled:cursor-default">
                        {user.mutualFriends} mutual friends
                      </button>
                      <p className="mt-1 text-[11px] text-gray-500">{new Date(createdAt).toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={working === id}
                      onClick={() =>
                        void act(
                          id,
                          () => acceptFriendRequest(id),
                          `${nameOf(user)} is now your friend.`
                        )
                      }
                      className="rounded-[8px] bg-[#00696F] py-2 text-[14px] font-bold text-white disabled:opacity-60"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      disabled={working === id}
                      onClick={() =>
                        void act(
                          id,
                          () => deleteFriendRequest(id),
                          "Friend request deleted."
                        )
                      }
                      className="rounded-[8px] bg-[#F3F4F6] py-2 text-[14px] font-bold text-[#4B5563] disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-4 rounded-xl border border-dashed border-[#D7E5E5] bg-[#F7FAFA] px-5 py-6">
              <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#E6F1F0] text-[#00696F]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>
              </span>
              <div><p className="text-sm font-semibold text-[#243D40]">You’re all caught up</p><p className="mt-1 text-sm text-[#748487]">New friend requests will appear here.</p></div>
            </div>
          )}
          {requests.length>3&&<button type="button" onClick={()=>setShowAllRequests(value=>!value)} className="mt-5 w-full rounded-lg bg-[#E8F4F3] px-4 py-3 text-sm font-semibold text-[#00696F]">{showAllRequests?"Show less":"View all ("+requests.length+")"}</button>}
        </div>
      ) : null}

      {tab==="sent"&&<div className="mt-6"><h2 className="mb-4 text-lg font-bold">Sent Requests ({outgoing.length})</h2>{outgoing.map(row=><div key={row.id} className="mb-2 flex items-center gap-3 rounded-xl bg-white p-4"><Link href={"/profile/"+row.user.username} className="flex flex-1 items-center gap-3"><UserAvatar avatarUrl={row.user.avatar} name={nameOf(row.user)} size={44}/><span>{nameOf(row.user)}</span></Link><button disabled={working===row.user.id} onClick={()=>void handleCancelRequest(row.user)} className="rounded-lg bg-gray-100 px-3 py-2 text-sm">Cancel request</button></div>)}</div>}
      {tab==="sent"&&(loading?<FriendListSkeleton/>:outgoing.length===0?<State loading={false} message="No pending sent requests."/>:null)}
      {tab === "suggestions" || tab === "requests" ? (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-[18px] font-semibold text-[#182F32]">People you may know</h2><p className="mt-1 text-[13px] text-[#748487]">Make a new connection in your community.</p></div>{tab === "requests" && <Link href="/friends/suggestions" className="shrink-0 text-sm font-medium text-[#00696F] hover:underline">View all</Link>}</div>
          {loading ? (
            <FriendGridSkeleton />
          ) : suggestions.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((user) => {
                const requestId = sentRequests[user.id];
                const sent = Boolean(requestId);
                return (
                  <article
                    key={user.id}
                    className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-x-4 rounded-xl border border-[#E5EBEC] bg-white p-4 text-left transition-shadow hover:shadow-md sm:block sm:p-5 sm:text-center"
                  >
                    <div className="row-span-3 w-fit self-center sm:mx-auto sm:mb-3">
                      <UserAvatar
                        avatarUrl={user.avatar}
                        name={nameOf(user)}
                        size="size-16 sm:size-20"
                        isOnline={user.isOnline}
                      />
                    </div>
                    <h3 className="truncate text-[15px] font-semibold text-[#182F32]">{nameOf(user)}</h3>
                    <button type="button" disabled={!user.mutualFriends} onClick={()=>void showMutualFriends(user)} className="text-left text-[12px] text-[#3C494A] enabled:hover:underline disabled:cursor-default sm:text-center">
                      {user.mutualFriends} mutual friends
                    </button>
                    <div className="mt-2 flex gap-2 sm:mt-4"><button
                      type="button"
                      disabled={working === user.id}
                      onClick={() =>
                        sent
                          ? void handleCancelRequest(user)
                          : void handleSendRequest(user)
                      }
                      className={`w-full rounded-[8px] py-2 text-[14px] font-bold disabled:opacity-60 ${
                        sent
                          ? "bg-[#F3F4F6] text-[#4B5563]"
                          : "bg-[#00696F] text-white hover:bg-[#00565B]"
                      }`}
                    >
                      {working === user.id
                        ? sent
                          ? "Cancelling…"
                          : "Sending…"
                        : sent
                          ? "Request Sent"
                          : "Add Friend"}
                    </button><button type="button" disabled={working===user.id} onClick={()=>void removeSuggestion(user.id)} className="w-full rounded-lg border border-[#E1E8E9] bg-white px-3 py-2 text-xs font-medium text-[#637478] hover:bg-[#F4F7F7]">Remove</button></div>
                  </article>
                );
              })}
            </div>
          ) : (
            <State loading={false} message="No friend suggestions right now." />
          )}
        </div>
      ) : null}

      {tab === "all" || tab === "online" || tab === "blocked" ? (
        <div className="mt-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-[18px] font-bold">
              {tab === "online"
                ? `${visibleFriends.length} Online`
                : tab === "blocked" ? `Blocked Users (${friends.length})` : `All Friends (${friends.length} on this page)`}
            </h2>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search this page..."
              className="h-10 w-full rounded-[8px] border border-[#D8D2D2] bg-white px-3 text-[14px] outline-none focus:border-[#00696F] sm:w-[240px]"
            />
          </div>
          {loading ? (
            <FriendListSkeleton />
          ) : visibleFriends.length ? (
            <div className="rounded-[12px] bg-white px-3 shadow-[0_0_4px_rgba(0,0,0,0.14)] sm:px-4">
              {visibleFriends.map((user) => (
                <article
                  key={user.id}
                  className="flex flex-col gap-3 border-b border-[#F3F4F6] py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:flex-1">
                    <UserAvatar
                      avatarUrl={user.avatar}
                      name={nameOf(user)}
                      size="size-14 sm:size-16"
                      isOnline={user.isOnline}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-bold leading-5 text-[#111827]">{nameOf(user)}</h3>
                      <p className="mt-0.5 text-[12px] text-[#3C494A]">
                        {user.mutualFriends} mutual friends
                      </p>
                    </div>
                  </div>
                  <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0">
                    {tab !== "blocked" && <button disabled={working === user.id} onClick={() => { if (window.confirm(`Block ${nameOf(user)}? This removes your connection and stops direct messages and new calls.`)) void act(user.id, () => blockFriend(user.id), "User blocked."); }} className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Block</button>}
                    <button
                      type="button"
                      disabled={working === user.id}
                      onClick={() => tab === "blocked" ? void act(user.id, () => unblockFriend(user.id), "User unblocked. Send a new request to reconnect.") : void handleMessageClick(user.id)}
                      className="rounded-[8px] bg-[rgba(0,105,111,0.1)] px-3 py-2 text-[14px] font-bold text-[#00696F] transition hover:bg-[rgba(0,105,111,0.2)] disabled:opacity-60 sm:px-4"
                    >
                      {working === user.id ? "Opening..." : tab === "blocked" ? "Unblock" : "Message"}
                    </button>
                    <button
                      type="button"
                      hidden={tab === "blocked"}
                      disabled={working === user.id || tab === "blocked"}
                      onClick={() => tab === "blocked" ? undefined : setUnfriendTarget(user)}
                      className="rounded-[8px] bg-[#F3F4F6] px-3 py-2 text-[14px] font-bold text-[#4B5563] transition hover:bg-gray-200 disabled:opacity-60"
                    >
                      Unfriend
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <State
              loading={false}
              message={
                tab === "online"
                  ? "No friends are online right now."
                  : "You have no friends yet."
              }
            />
          )}
        </div>
      ) : null}

      {tab !== "suggestions" && tab !== "blocked" && (page > 1 || hasNext) && <nav aria-label="Friends pages" className="mt-6 flex items-center justify-center gap-4">
        <button disabled={loading || page === 1} onClick={() => setPage(value => value - 1)} className="rounded-lg bg-white px-4 py-2 disabled:opacity-40">Previous</button>
        <span>Page {page}</span>
        <button disabled={loading || !hasNext} onClick={() => setPage(value => value + 1)} className="rounded-lg bg-white px-4 py-2 disabled:opacity-40">Next</button>
      </nav>}
      {unfriendTarget ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unfriend-title"
            className="w-full max-w-[380px] rounded-[16px] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
          >
            <h3 id="unfriend-title" className="text-[18px] font-bold text-[#111827]">
              Unfriend {nameOf(unfriendTarget)}?
            </h3>
            <p className="mt-2 text-[14px] leading-5 text-[#6B7280]">
              You will no longer be friends. You can send a new request later if you change your mind.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUnfriendTarget(null)}
                className="rounded-[8px] bg-[#F3F4F6] py-2.5 text-[14px] font-bold text-[#4B5563]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmUnfriend()}
                className="rounded-[8px] bg-[#DC2626] py-2.5 text-[14px] font-bold text-white"
              >
                Unfriend
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {mutualTarget ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4" onMouseDown={(event)=>{if(event.target===event.currentTarget)setMutualTarget(null);}}>
          <div role="dialog" aria-modal="true" aria-labelledby="mutual-title" className="w-full max-w-[420px] rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h3 id="mutual-title" className="text-lg font-bold">Mutual friends with {nameOf(mutualTarget)}</h3>
              <button type="button" aria-label="Close mutual friends" onClick={()=>setMutualTarget(null)} className="rounded-lg px-3 py-1.5 text-xl text-gray-600 hover:bg-gray-100">×</button>
            </div>
            <div className="mt-4 max-h-[60dvh] overflow-y-auto">
              {mutualLoading ? <State loading message="" /> : mutualPeople.length ? mutualPeople.map(person=>(
                <Link key={person.id} href={`/profile/${encodeURIComponent(person.username)}`} onClick={()=>setMutualTarget(null)} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
                  <UserAvatar avatarUrl={person.avatar} name={nameOf(person)} size={44} />
                  <span className="min-w-0"><span className="block truncate font-semibold">{nameOf(person)}</span><span className="block text-xs text-gray-500">@{person.username}</span></span>
                </Link>
              )) : <State loading={false} message="No mutual friends to show." />}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
