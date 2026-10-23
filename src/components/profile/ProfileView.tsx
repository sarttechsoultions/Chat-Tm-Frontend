"use client";
import {useSocket} from "../hooks/useSocket";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Globe, ImageIcon, Link2, Loader2, MapPin, Quote, User, UserRound, X } from "lucide-react";
import { UserAvatar } from "../ui/UserAvatar";
import PostCard from "../home/PostCard";
import { LocationPicker } from "../posts/PostExtras";
import {
  blockFriend,
  unblockFriend,
  acceptFriendRequest,
  deleteFriendRequest,
  getSessionToken,
  getStoredUser,
  sendFriendRequest,
  setSession,
  unfriend,
  type AuthUser,
  type FriendUser,
} from "../../lib/auth";
import { createDirectConversation } from "../../lib/api/chat";
import {
  fetchProfileFriends,
  fetchMyProfile,
  fetchProfile,
  updateProfile,
  type FriendshipStatus,
  type ProfileData,
  type ProfileUser,
} from "../../lib/api/profile";

type Tab = "posts" | "about" | "friends" | "photos";

function fullName(user: Pick<ProfileUser, "firstName" | "lastName" | "username">) {
  return `${user.firstName} ${user.lastName}`.trim() || user.username;
}

function friendName(user: FriendUser) {
  return `${user.firstName} ${user.lastName}`.trim() || user.username;
}

function bustMediaUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;
  return `${url.split("#")[0].split("?")[0]}?t=${Date.now()}`;
}

function persistUser(user: AuthUser) {
  const token = getSessionToken();
  const stored = getStoredUser();
  const next: AuthUser = {
    ...(stored || user),
    ...user,
    avatar: user.avatar ? bustMediaUrl(user.avatar) : stored?.avatar || "",
    coverPhoto: user.coverPhoto ? bustMediaUrl(user.coverPhoto) : stored?.coverPhoto,
  };
  if (token) setSession(token, next);
  return next;
}

export default function ProfileView({ username }: { username?: string }) {
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const socket=useSocket();
  const [selectedPostId,setSelectedPostId]=useState<string|null>(null);
  const [tab, setTab] = useState<Tab>("posts");
  useEffect(()=>{
    const sync=()=>{if(window.location.hash==="#friends")setTab("friends");};
    sync();window.addEventListener("hashchange",sync);
    return()=>window.removeEventListener("hashchange",sync);
  },[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [unfriendOpen, setUnfriendOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [friendPage,setFriendPage]=useState(1);
  const [friendQuery,setFriendQuery]=useState("");
  const [friendResults,setFriendResults]=useState<{items:FriendUser[];total:number;page:number;hasNext:boolean}|null>(null);
  const [friendsLoading,setFriendsLoading]=useState(false);
  const [friendsError,setFriendsError]=useState("");
  const [friendRevision,setFriendRevision]=useState(0);
  const profileUsername=data?.user.username;
  useEffect(()=>{
    if(tab!=="friends"||!profileUsername)return;
    let cancelled=false;
    const timer=window.setTimeout(()=>{
      setFriendsLoading(true);setFriendsError("");
      void fetchProfileFriends(profileUsername,friendPage,friendQuery).then(result=>{if(!cancelled){setFriendResults(result);if(!result.items.length&&friendPage>1)setFriendPage(value=>value-1);}}).catch(error=>{if(!cancelled){setFriendResults(null);setFriendsError(error instanceof Error?error.message:"Unable to load friends.");}}).finally(()=>{if(!cancelled)setFriendsLoading(false);});
    },friendQuery?200:0);
    return()=>{cancelled=true;window.clearTimeout(timer);};
  },[tab,profileUsername,friendPage,friendQuery,friendRevision]);
  useEffect(()=>{
    const refresh=()=>setFriendRevision(value=>value+1);
    socket?.on("friend_requests_changed",refresh);socket?.on("connect",refresh);
    window.addEventListener("chattm:friends-changed",refresh);
    return()=>{socket?.off("friend_requests_changed",refresh);socket?.off("connect",refresh);window.removeEventListener("chattm:friends-changed",refresh);};
  },[socket]);

  const load = useCallback(async () => {
    setNotice("");
    setFriendResults(null);setFriendPage(1);setFriendQuery("");
    setBlockOpen(false);setUnfriendOpen(false);
    setLoading(true);
    setError("");
    try {
      const profile = username ? await fetchProfile(username) : await fetchMyProfile();
      setData(profile);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Profile unavailable.");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(()=>{
    let cancelled=false;
    const sync=()=>{void (username?fetchProfile(username):fetchMyProfile()).then(profile=>{if(!cancelled)setData(prev=>prev?{...prev,...profile}:profile);}).catch(()=>{if(!cancelled){setData(null);setError("Profile unavailable.");}});};
    socket?.on("friend_requests_changed",sync);
    return()=>{cancelled=true;socket?.off("friend_requests_changed",sync);};
  },[socket,username]);

  async function handleBlockAction() {
    if (!data || data.isOwn || working) return;
    const unblocking = data.friendship.status === "BLOCKED" && data.friendship.canUnblock;
    if (data.friendship.status === "BLOCKED" && !unblocking) return;
    setWorking(true);
    setError("");
    setNotice("");
    try {
      if (unblocking) await unblockFriend(data.user.id);
      else await blockFriend(data.user.id);
      setBlockOpen(false);
      setData(prev => prev ? {
        ...prev,
        friendship: unblocking ? { status: "NONE", requestId: null } : { status: "BLOCKED", requestId: null, canUnblock: true },
        stats: { ...prev.stats, friends: Math.max(0, prev.stats.friends - (prev.friendship.status === "FRIENDS" ? 1 : 0)) },
        friends: unblocking ? prev.friends : prev.friends.filter(friend => friend.id !== getStoredUser()?.id),
      } : prev);
      setNotice(unblocking ? "User unblocked. You can send a new friend request." : "User blocked. Direct messages and new calls are restricted.");
      window.dispatchEvent(new Event("chattm:friends-changed"));
      const profile = await (username ? fetchProfile(username) : fetchMyProfile()).catch(() => null);
      if (profile) setData(profile);
    } catch (err) {
      setBlockOpen(false);
      setError(err instanceof Error ? err.message : "Unable to update block status.");
    } finally { setWorking(false); }
  }

  async function handleFriendAction() {
    if (!data || working) return;
    setWorking(true);
    setError("");
    try {
      const { friendship, user } = data;
      if (friendship.status === "NONE") {
        const result = await sendFriendRequest(user.id);
        setData({
          ...data,
          friendship: { status: "PENDING_OUT", requestId: result.request?.id || null },
        });
      } else if (friendship.status === "PENDING_OUT" && friendship.requestId) {
        await deleteFriendRequest(friendship.requestId);
        setData({ ...data, friendship: { status: "NONE", requestId: null } });
      } else if (friendship.status === "PENDING_IN" && friendship.requestId) {
        await acceptFriendRequest(friendship.requestId);
        setData({
          ...data,
          friendship: { status: "FRIENDS", requestId: friendship.requestId },
          stats: { ...data.stats, friends: data.stats.friends + 1 },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update friendship.");
    } finally {
      setWorking(false);
    }
  }

  async function handleUnfriend() {
    if (!data) return;
    setWorking(true);
    try {
      await unfriend(data.user.id);
      window.dispatchEvent(new Event("chattm:friends-changed"));
      setUnfriendOpen(false);
      setData({
        ...data,
        friendship: { status: "NONE", requestId: null },
        stats: { ...data.stats, friends: Math.max(0, data.stats.friends - 1) },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to unfriend.");
    } finally {
      setWorking(false);
    }
  }

  async function handleMessage() {
    if (!data) return;
    setWorking(true);
    try {
      const chat = await createDirectConversation(data.user.id);
      router.push(`/messenger?chatId=${chat.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start conversation.");
      setWorking(false);
    }
  }

  if (loading) {
    return <div role="status" aria-label="Loading profile" aria-busy="true" className="mx-auto w-full max-w-[820px] space-y-5 pb-6">
      <span className="sr-only">Loading profile…</span>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="h-40 bg-[#E5ECEF] motion-safe:animate-pulse sm:h-56"/>
        <div className="px-5 pb-5">
          <div className="-mt-12 size-24 rounded-full border-4 border-white bg-[#DCE6EA] motion-safe:animate-pulse sm:size-28"/>
          <div className="mt-4 h-6 w-48 rounded bg-[#E5ECEF] motion-safe:animate-pulse"/>
          <div className="mt-3 h-3 w-32 rounded bg-[#EEF2F5] motion-safe:animate-pulse"/>
          <div className="mt-6 flex gap-5 border-t border-gray-100 pt-4">{Array.from({length:3},(_,i)=><div key={i} className="h-4 w-16 rounded bg-[#E5ECEF] motion-safe:animate-pulse"/>)}</div>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-5 h-5 w-28 rounded bg-[#E5ECEF] motion-safe:animate-pulse"/>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{Array.from({length:6},(_,i)=><div key={i} className="rounded-xl border border-gray-100 p-4"><div className="mx-auto size-16 rounded-full bg-[#E5ECEF] motion-safe:animate-pulse"/><div className="mx-auto mt-4 h-4 w-3/4 rounded bg-[#E5ECEF] motion-safe:animate-pulse"/><div className="mx-auto mt-2 h-3 w-1/2 rounded bg-[#EEF2F5] motion-safe:animate-pulse"/></div>)}</div>
      </div>
    </div>;
  }

  if (!data) {
    return (
      <div className="rounded-[16px] bg-white p-8 text-center">
        <p className="text-[16px] font-semibold text-[#111827]">{error || "Profile not found"}</p>
      </div>
    );
  }

  if (data.friendship.status === "BLOCKED") {
    return <section className="mx-auto max-w-[820px] rounded-2xl border border-gray-100 bg-white p-8 text-center"><h1 className="text-lg font-semibold text-gray-900">Profile unavailable</h1><p className="mt-2 text-sm text-gray-500">This profile’s content is not available.</p>{data.friendship.canUnblock && <Link href="/friends/blocked" className="mt-4 inline-block text-sm font-medium text-[#00696F]">Manage blocked users</Link>}</section>;
  }
  const { user, isOwn, friendship, stats, friends, photos, posts } = data;
  const tabs: { id: Tab; label: string }[] = [
    { id: "posts", label: "Posts" },
    { id: "about", label: "About" },
    { id: "friends", label: `Friends ${stats.friends}` },
    { id: "photos", label: "Photos" },
  ];

  return (
    <div className="mx-auto w-full max-w-[820px] pb-4 sm:pb-10">
      <section className="overflow-hidden rounded-[16px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <div className="relative h-[140px] bg-[#117378] sm:h-[180px] lg:h-[220px]">
          {user.coverPhoto ? (
            <img src={user.coverPhoto} alt="" className="size-full object-cover" />
          ) : (
            <div className="size-full bg-[linear-gradient(135deg,#117378_0%,#00696F_55%,#0B1C30_100%)]" />
          )}
        </div>

        <div className="relative px-4 pb-5 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-4">
              <div className="rounded-full border-4 border-white bg-white">
                <UserAvatar avatarUrl={user.avatar} name={fullName(user)} size="size-20 sm:size-28 lg:size-32" />
              </div>
              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-1.5">
                  <h1 className="truncate text-[20px] font-bold leading-7 text-[#111827] sm:text-[24px] sm:leading-8">{fullName(user)}</h1>
                  {user.isVerified ? (
                    <img src="/figma/icons/verified.svg" alt="" width={16} height={16} />
                  ) : null}
                </div>
                <p className="text-[14px] text-[#6B7280]">@{user.username}</p>
                <p className="mt-1 text-[13px] text-[#6B7280]">
                  {stats.friends} friends · {stats.posts} posts
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pb-1">
              {isOwn ? (
                <>
                  <Link
                    href="/create-post"
                    className="rounded-[8px] bg-[#00696F] px-4 py-2 text-[14px] font-bold text-white"
                  >
                    Add post
                  </Link>
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="rounded-[8px] bg-[#F3F4F6] px-4 py-2 text-[14px] font-bold text-[#111827]"
                  >
                    Edit profile
                  </button>
                </>
              ) : (
                <>
                  {friendship.status !== "BLOCKED" && <FriendButton
                    status={friendship.status}
                    working={working}
                    onClick={() => {
                      if (friendship.status === "FRIENDS") setUnfriendOpen(true);
                      else void handleFriendAction();
                    }}
                  />}
                  {friendship.status === "BLOCKED" ? (
                    friendship.canUnblock ? <button type="button" disabled={working} onClick={() => void handleBlockAction()} className="rounded-lg border border-[#DCE5E6] px-4 py-2 text-sm font-semibold text-[#00696F] disabled:opacity-60">{working ? "Please wait…" : "Unblock"}</button>
                    : <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-500">Connection unavailable</span>
                  ) : <button type="button" disabled={working} onClick={() => { setError(""); setBlockOpen(true); }} className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60">Block</button>}
                  {friendship.status==="PENDING_IN"&&<button disabled={working} onClick={async()=>{if(!friendship.requestId)return;setWorking(true);try{await deleteFriendRequest(friendship.requestId);setData(prev=>prev?{...prev,friendship:{status:"NONE",requestId:null}}:prev);window.dispatchEvent(new Event("chattm:friends-changed"));}catch(error){setError(error instanceof Error?error.message:"Unable to delete request");}finally{setWorking(false);}}} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold">Delete request</button>}
                  {friendship.status === "FRIENDS" ? (
                    <button
                      type="button"
                      disabled={working}
                      onClick={() => void handleMessage()}
                      className="rounded-[8px] bg-[#00696F] px-4 py-2 text-[14px] font-bold text-white disabled:opacity-60"
                    >
                      Message
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </div>

          {user.bio ? <p className="mt-4 text-[14px] leading-5 text-[#1F2937]">{user.bio}</p> : null}
          {user.location ? (
            <p className="mt-2 flex items-center gap-1 text-[13px] text-[#6B7280]">
              <img src="/figma/icons/map-pin.svg" alt="" width={11} height={13} />
              Lives in {user.location}
            </p>
          ) : null}

          {notice ? <p role="status" className="mt-3 rounded-lg bg-[#E8F4F3] px-3 py-2 text-sm text-[#00696F]">{notice}</p> : null}
          {error ? <p role="alert" className="mt-3 text-[13px] text-red-600">{error}</p> : null}

          <nav className="mt-5 flex gap-4 overflow-x-auto no-scrollbar border-t border-[#E5E7EB] sm:gap-5">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`shrink-0 border-b-2 px-1 py-3 text-[14px] font-medium ${
                  tab === item.id
                    ? "border-[#00696F] text-[#00696F]"
                    : "border-transparent text-[#6B7280]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </section>

      {selectedPostId&&posts.find(post=>post.id===selectedPostId)&&<div role="dialog" aria-modal="true" aria-label="Post" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={()=>setSelectedPostId(null)}><div className="relative max-h-[90dvh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white" onClick={e=>e.stopPropagation()}><button autoFocus aria-label="Close post" onClick={()=>setSelectedPostId(null)} className="sticky top-2 z-20 ml-auto mr-2 flex size-9 items-center justify-center rounded-full bg-white shadow"><X size={20}/></button><PostCard post={posts.find(post=>post.id===selectedPostId)!} compactMedia onDeleted={id=>{setData(prev=>prev?{...prev,posts:prev.posts.filter(post=>post.id!==id)}:prev);setSelectedPostId(null);}}/></div></div>}
      <div className="mt-5">
        {tab === "posts" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {isOwn ? (
              <Link
                href="/create-post"
                className="col-span-full rounded-[16px] bg-white px-4 py-4 text-[15px] text-[#6B7280] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
              >
                What&apos;s on your mind, {user.firstName}?
              </Link>
            ) : null}
            {posts.length ? (
              posts.map((post) => (
                <button key={post.id} type="button" onClick={()=>setSelectedPostId(post.id)} aria-label={"Open post: "+(post.body||"Media post")} className="group relative aspect-square overflow-hidden rounded-xl bg-white text-left shadow-sm transition hover:shadow-md">
                  {post.media[0] ? post.media[0].type==="video" ? <video src={post.media[0].url} preload="metadata" muted playsInline className="size-full object-cover"/> : <img src={post.media[0].url} alt={post.body||"Post"} loading="lazy" className="size-full object-cover transition group-hover:scale-105"/> : <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#dceff0] to-[#edf3ff] p-4"><p className="line-clamp-5 text-sm font-medium text-[#0B1C30]">{post.body}</p></div>}
                  {post.media[0]?.type==="video"&&<span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white">▶</span>}
                  {post.media.length>1&&<span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white">{post.media.length} photos</span>}
                  <span className="absolute inset-x-0 bottom-0 flex gap-3 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-xs text-white">♡ {post.likesCount} <span>Comments {post.commentsCount}</span></span>
                </button>
              ))
            ) : (
              <p className="rounded-[16px] bg-white py-10 text-center text-[14px] text-[#6B7280]">
                No posts yet.
              </p>
            )}
          </div>
        ) : null}

        {tab === "about" ? (
          <div className="rounded-[16px] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <h2 className="mb-4 text-[18px] font-bold">About</h2>
            <dl className="flex flex-col gap-3 text-[14px]">
              <Row label="Bio" value={user.bio || "No bio yet."} />
              <Row label="Lives in" value={user.location || "Not added"} />
              <Row label="Website" value={user.website || "Not added"} />
              <Row label="Gender" value={user.gender || "Not added"} />
              <Row
                label="Joined"
                value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
              />
            </dl>
          </div>
        ) : null}

        {tab === "friends" ? (
          <section aria-label="Profile friends" className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-lg font-bold">Friends <span className="ml-2 rounded-full bg-[#E8F4F3] px-2.5 py-1 text-xs font-semibold text-[#00696F]">{stats.friends}</span></h2><p className="mt-1 text-sm text-gray-500">People connected with {isOwn ? "you" : user.firstName}</p></div>
              <input aria-label="Search profile friends" maxLength={100} value={friendQuery} onChange={event=>{setFriendQuery(event.target.value);setFriendPage(1);setFriendsLoading(true);}} placeholder="Search friends…" className="w-full rounded-xl border border-[#E1E9EA] px-3 py-2.5 text-sm outline-[#00696F] sm:w-52"/>
            </div>
            {friendsError ? <p role="alert" className="py-6 text-center text-sm text-red-600">{friendsError}</p> : friendsLoading ? <p role="status" className="py-8 text-center text-sm text-gray-500">Loading friends…</p> : (friendResults?.items ?? friends).length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(friendResults?.items ?? friends).map(friend=><Link key={friend.id} href={"/profile/"+encodeURIComponent(friend.username)} className="flex min-w-0 items-center gap-3 rounded-xl border border-[#E7ECEF] bg-white p-3 transition hover:border-[#9FC9CC] hover:bg-[#F5FAFA] focus-visible:outline-2 focus-visible:outline-[#00696F]">
                  <UserAvatar avatarUrl={friend.avatar} name={friendName(friend)} size={48}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#0B1C30]">{friendName(friend)}</p><p className="mt-1 truncate text-xs text-gray-500">@{friend.username}</p><span className="mt-1 block text-xs font-medium text-[#00696F]">View profile</span></div>
                </Link>)}
              </div>
            ) : <p className="py-8 text-center text-sm text-gray-500">{friendQuery?"No matching friends.":"No friends to show."}</p>}
            {(friendPage>1||(friendResults?.hasNext??stats.friends>12)) && !friendsError && <nav aria-label="Profile friends pages" className="mt-5 flex items-center justify-center gap-4 text-sm"><button disabled={friendsLoading||friendPage===1} onClick={()=>{setFriendsLoading(true);setFriendPage(value=>value-1);}} className="rounded-lg bg-gray-100 px-3 py-2 disabled:opacity-40">Previous</button><span>Page {friendPage}</span><button disabled={friendsLoading||!(friendResults?.hasNext??stats.friends>12)} onClick={()=>{setFriendsLoading(true);setFriendPage(value=>value+1);}} className="rounded-lg bg-gray-100 px-3 py-2 disabled:opacity-40">Next</button></nav>}
          </section>
        ) : null}

        {tab === "photos" ? (
          <div className="rounded-[16px] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <h2 className="mb-4 text-[18px] font-bold">Photos</h2>
            {photos.length ? (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo) => (
                  <div key={photo.id} className="aspect-square overflow-hidden rounded-[10px] bg-[#EFF4FF]">
                    <img src={photo.url} alt="" className="size-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-[14px] text-[#6B7280]">No photos yet.</p>
            )}
          </div>
        ) : null}
      </div>

      {editOpen ? (
        <EditProfileModal
          user={user}
          onClose={() => {
            setEditOpen(false);
          }}
          onPreview={(patch) => {
            setData((prev) => (prev ? { ...prev, user: { ...prev.user, ...patch } } : prev));
          }}
          onSaved={(next) => {
            const saved = persistUser(next);
            setEditOpen(false);
            setData((prev) => {
              if (!prev) return prev;
              const nextUser = {
                ...prev.user,
                firstName: saved.firstName,
                lastName: saved.lastName,
                avatar: saved.avatar || prev.user.avatar,
                coverPhoto: saved.coverPhoto || prev.user.coverPhoto,
                bio: saved.bio ?? prev.user.bio,
                location: saved.location ?? prev.user.location,
                website: saved.website ?? prev.user.website,
              };
              return {
                ...prev,
                user: nextUser,
                posts: prev.posts.map((item) =>
                  item.author.id === nextUser.id
                    ? {
                        ...item,
                        author: {
                          ...item.author,
                          avatar: nextUser.avatar,
                          firstName: nextUser.firstName,
                          lastName: nextUser.lastName,
                        },
                      }
                    : item
                ),
              };
            });
          }}
        />
      ) : null}

      {blockOpen && <ProfileConnectionDialog name={fullName(user)} working={working} onClose={() => setBlockOpen(false)} onConfirm={() => void handleBlockAction()} />}
      {unfriendOpen && <ProfileConnectionDialog action="unfriend" name={fullName(user)} working={working} onClose={() => setUnfriendOpen(false)} onConfirm={() => void handleUnfriend()} />}

    </div>
  );
}

function ProfileConnectionDialog({ name, working, onClose, onConfirm, action = "block" }: { name: string; working: boolean; onClose: () => void; onConfirm: () => void; action?: "block" | "unfriend" }) {
  const label = action === "unfriend" ? "Unfriend" : "Block";
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} aria-labelledby="block-profile-title" aria-describedby="block-profile-description" onCancel={event => { event.preventDefault(); if (!working) onClose(); }} className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-2xl border-0 bg-white p-6 shadow-xl backdrop:bg-black/40">
    <h3 id="block-profile-title" className="text-lg font-bold text-[#111827]">{label} {name}?</h3>
    <p id="block-profile-description" className="mt-2 text-sm leading-6 text-gray-600">{action === "unfriend" ? "You will no longer be friends. You can send a new request later." : "This removes your friendship or pending request and stops direct messages and new calls. You can unblock them later. Unblocking will not restore your friendship."}</p>
    <div className="mt-6 grid grid-cols-2 gap-3">
      <button type="button" autoFocus disabled={working} onClick={onClose} className="rounded-lg bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 disabled:opacity-60">Cancel</button>
      <button type="button" disabled={working} onClick={onConfirm} className="rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">{working ? "Please wait…" : label}</button>
    </div>
  </dialog>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] font-semibold uppercase tracking-wide text-[#6B7280]">{label}</dt>
      <dd className="text-[#111827]">{value}</dd>
    </div>
  );
}

function FriendButton({
  status,
  working,
  onClick,
}: {
  status: FriendshipStatus;
  working: boolean;
  onClick: () => void;
}) {
  const label =
    status === "FRIENDS"
      ? "Friends"
      : status === "PENDING_OUT"
        ? "Request Sent"
        : status === "PENDING_IN"
          ? "Confirm"
          : "Add Friend";
  const classes =
    status === "FRIENDS" || status === "PENDING_OUT"
      ? "bg-[#F3F4F6] text-[#111827]"
      : "bg-[rgba(0,105,111,0.12)] text-[#00696F]";

  return (
    <button
      type="button"
      disabled={working}
      onClick={onClick}
      className={`rounded-[8px] px-4 py-2 text-[14px] font-bold disabled:opacity-60 ${classes}`}
    >
      {working ? "Please wait…" : label}
    </button>
  );
}

const editInputClass =
  "h-12 w-full rounded-[14px] border border-[#E6EEF0] bg-[#F4FBFC] px-4 text-[14px] text-[#0B1C30] outline-none transition-all placeholder:text-[#9CA3AF] focus:border-[#00696F] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,105,111,0.14)]";

function IconBadge({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-5 items-center justify-center rounded-full bg-[#EEF9FA] text-[#00696F]">
      {children}
    </span>
  );
}

function IconInput({
  icon: Icon,
  done,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  icon: typeof User;
  done?: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#00696F] shadow-[0_2px_8px_rgba(0,105,111,0.12)]">
        <Icon size={14} />
      </span>
      <input {...props} className={`${editInputClass} pl-[52px] ${done ? "pr-10" : ""} ${className}`} />
      {done ? (
        <Check size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#16A34A]" />
      ) : null}
    </div>
  );
}

function EditProfileModal({
  user,
  onClose,
  onSaved,
  onPreview,
}: {
  user: ProfileUser;
  onClose: () => void;
  onSaved: (user: AuthUser) => void;
  onPreview?: (patch: Partial<Pick<ProfileUser, "avatar" | "coverPhoto">>) => void;
}) {
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const blobUrls = useRef<{ avatar?: string; cover?: string }>({});
  const originalMedia = useRef({ avatar: user.avatar, coverPhoto: user.coverPhoto });
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [bio, setBio] = useState(user.bio);
  const [location, setLocation] = useState(user.location);
  const [website, setWebsite] = useState(user.website);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [coverPreview, setCoverPreview] = useState(user.coverPhoto);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const display = `${firstName} ${lastName}`.trim() || user.username;
  const bioCount = bio.length;
  const checks = [
    { id: "photo", label: "Photo", done: Boolean(avatarPreview), icon: Camera },
    { id: "cover", label: "Cover", done: Boolean(coverPreview), icon: ImageIcon },
    { id: "first", label: "First name", done: Boolean(firstName.trim()), icon: User },
    { id: "last", label: "Last name", done: Boolean(lastName.trim()), icon: UserRound },
    { id: "bio", label: "Bio", done: Boolean(bio.trim()), icon: Quote },
    { id: "location", label: "Location", done: Boolean(location.trim()), icon: MapPin },
    { id: "website", label: "Website", done: Boolean(website.trim()), icon: Link2 },
  ];
  const doneCount = checks.filter((item) => item.done).length;
  const percent = Math.round((doneCount / checks.length) * 100);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving && !placeOpen) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, saving, placeOpen]);

  useEffect(() => {
    return () => {
      if (blobUrls.current.avatar) URL.revokeObjectURL(blobUrls.current.avatar);
      if (blobUrls.current.cover) URL.revokeObjectURL(blobUrls.current.cover);
    };
  }, []);

  function publishPreview(patch: Partial<Pick<ProfileUser, "avatar" | "coverPhoto">>) {
    const token = getSessionToken();
    const stored = getStoredUser();
    if (token && stored) setSession(token, { ...stored, ...patch });
    onPreview?.(patch);
  }

  function handleClose() {
    if (saving) return;
    publishPreview(originalMedia.current);
    onClose();
  }

  function pickFile(kind: "avatar" | "cover", file?: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (kind === "avatar") {
      if (blobUrls.current.avatar) URL.revokeObjectURL(blobUrls.current.avatar);
      blobUrls.current.avatar = url;
      setAvatarPreview(url);
      setAvatar(file);
      publishPreview({ avatar: url });
    } else {
      if (blobUrls.current.cover) URL.revokeObjectURL(blobUrls.current.cover);
      blobUrls.current.cover = url;
      setCoverPreview(url);
      setCoverPhoto(file);
      publishPreview({ coverPhoto: url });
    }
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const payload = await updateProfile({
        firstName,
        lastName,
        bio,
        location,
        website,
        avatar,
        coverPhoto,
      });
      onSaved(payload.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile.");
      setSaving(false);
    }
  }

  return (
    <div
      className="edit-profile-backdrop fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-4 py-6"
      onClick={() => {
        if (!saving) handleClose();
      }}
    >
      <div
        className="edit-profile-card flex max-h-[min(92dvh,calc(100dvh-1.5rem))] w-full max-w-[540px] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          id="edit-cover-upload"
          ref={coverInput}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            pickFile("cover", event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <input
          id="edit-avatar-upload"
          ref={avatarInput}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            pickFile("avatar", event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="relative z-20 h-[160px]">
            {coverPreview ? (
              <img src={coverPreview} alt="" className="size-full object-cover" />
            ) : (
              <div className="size-full bg-[#00696F]" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-black/25" />
            <div className="pointer-events-none absolute left-5 top-5">
              <h3 className="text-[20px] font-bold text-white">Edit profile</h3>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 z-30 flex size-9 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/55"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <label
              htmlFor="edit-cover-upload"
              className="absolute bottom-3 right-4 z-30 flex cursor-pointer items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[12px] font-semibold text-[#111827] shadow-sm hover:bg-[#F9FAFB]"
            >
              <Camera size={14} />
              Change cover
            </label>
          </div>

          <div className="px-6 pb-6">
            <div className="pointer-events-none relative z-30 -mt-12 flex justify-center">
              <div className="pointer-events-auto relative">
                <div className="size-[112px] overflow-hidden rounded-full border-4 border-white bg-white shadow-md">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="size-full object-cover" />
                  ) : (
                    <UserAvatar avatarUrl="" name={display} size={104} />
                  )}
                </div>
                <label
                  htmlFor="edit-avatar-upload"
                  className="absolute bottom-1 right-1 flex size-8 cursor-pointer items-center justify-center rounded-full bg-[#00696F] text-white ring-2 ring-white hover:bg-[#00575c]"
                  aria-label="Change profile photo"
                >
                  <Camera size={14} />
                </label>
              </div>
            </div>
            <div className="mt-3 text-center">
              <p className="text-[18px] font-bold text-[#111827]">{display}</p>
              <p className="text-[13px] text-[#6B7280]">@{user.username}</p>
            </div>

            <div className="mt-5 rounded-[14px] border border-[#E5E7EB] bg-[#F8FAFA] p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-[#111827]">Profile complete</p>
                <span className="text-[12px] font-semibold text-[#00696F]">
                  {percent}% · {doneCount}/{checks.length}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]">
                <div
                  className="h-full rounded-full bg-[#00696F] transition-[width] duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {checks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <span
                      key={item.id}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        item.done ? "bg-[#E6F3F4] text-[#00696F]" : "bg-white text-[#6B7280]"
                      }`}
                    >
                      {item.done ? <Check size={11} /> : <Icon size={11} />}
                      {item.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#6B7280]">
                  <IconBadge>
                    <User size={11} />
                  </IconBadge>
                  First name
                </span>
                <IconInput
                  icon={User}
                  done={Boolean(firstName.trim())}
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#6B7280]">
                  <IconBadge>
                    <UserRound size={11} />
                  </IconBadge>
                  Last name
                </span>
                <IconInput
                  icon={UserRound}
                  done={Boolean(lastName.trim())}
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.1em] text-[#6B7280]">
                <span className="flex items-center gap-1.5">
                  <IconBadge>
                    <Quote size={11} />
                  </IconBadge>
                  Bio
                </span>
                <span className={bioCount > 460 ? "text-[#DC2626]" : "text-[#9CA3AF]"}>{bioCount}/500</span>
              </span>
              <div className="relative">
                <textarea
                  value={bio}
                  maxLength={500}
                  onChange={(event) => setBio(event.target.value)}
                  rows={3}
                  placeholder="Tell people who you are..."
                  className="min-h-[92px] w-full resize-none rounded-[14px] border border-[#E6EEF0] bg-[#F4FBFC] px-4 py-3 text-[14px] text-[#0B1C30] outline-none transition-all placeholder:text-[#9CA3AF] focus:border-[#00696F] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,105,111,0.14)]"
                />
                {bio.trim() ? (
                  <Check size={16} className="pointer-events-none absolute bottom-3 right-3 text-[#16A34A]" />
                ) : null}
              </div>
            </label>

            <div className="mt-4">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#6B7280]">
                <IconBadge>
                  <MapPin size={11} />
                </IconBadge>
                Location
              </span>
              {location ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPlaceOpen(true)}
                    className="flex h-12 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-[14px] border border-[#B7E0E3] bg-[#EEF9FA] px-3 text-left text-[14px] font-medium text-[#00696F]"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,105,111,0.12)]">
                      <MapPin size={14} />
                    </span>
                    <span className="truncate">{location}</span>
                    <Check size={16} className="ml-auto shrink-0 text-[#16A34A]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocation("")}
                    className="flex size-12 cursor-pointer items-center justify-center rounded-[14px] bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                    aria-label="Remove location"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPlaceOpen(true)}
                  className={`${editInputClass} flex cursor-pointer items-center gap-3 pl-3 text-left font-normal text-[#9CA3AF]`}
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-white text-[#00696F] shadow-[0_2px_8px_rgba(0,105,111,0.12)]">
                    <MapPin size={14} />
                  </span>
                  Search any city or village
                </button>
              )}
            </div>

            <label className="mt-4 block">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#6B7280]">
                <IconBadge>
                  <Globe size={11} />
                </IconBadge>
                Website
              </span>
              <IconInput
                icon={Globe}
                done={Boolean(website.trim())}
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                placeholder="https://your-site.com"
              />
            </label>

            {error ? <p className="mt-4 text-[13px] font-medium text-red-600">{error}</p> : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[#EEF2F3] bg-white px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-[#F3F4F6] text-[14px] font-bold text-[#4B5563] hover:bg-[#E8EAED]"
          >
            <X size={16} />
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-[#00696F] text-[14px] font-bold text-white hover:bg-[#00575c] disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>

        {placeOpen ? (
          <LocationPicker
            value={location}
            onSelect={setLocation}
            onClose={() => setPlaceOpen(false)}
          />
        ) : null}
      </div>
    </div>
  );
}
