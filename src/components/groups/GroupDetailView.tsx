"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "../ui/UserAvatar";
import PostCard from "../home/PostCard";
import GroupPostComposer from "./GroupPostComposer";
import { listFriends, type FriendUser } from "../../lib/auth";
import {
  addGroupMembers,
  deleteGroup,
  fetchGroup,
  joinGroup,
  leaveGroup,
  type CommunityGroup,
} from "../../lib/api/groups";
import { fetchPosts, type PostItem } from "../../lib/api/posts";

function nameOf(user: { firstName: string; lastName: string; username?: string }) {
  return `${user.firstName} ${user.lastName}`.trim() || user.username || "Member";
}

export default function GroupDetailView({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [group, setGroup] = useState<CommunityGroup | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [friendQuery, setFriendQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextGroup, nextPosts] = await Promise.all([
        fetchGroup(groupId),
        fetchPosts(undefined, groupId),
      ]);
      setGroup(nextGroup);
      setPosts(nextPosts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load this group.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleFriends = useMemo(() => {
    const memberIds = new Set(group?.members.map((member) => member.id) || []);
    const q = friendQuery.trim().toLowerCase();
    return friends.filter((friend) => {
      if (memberIds.has(friend.id)) return false;
      if (!q) return true;
      return `${friend.firstName} ${friend.lastName} ${friend.username}`.toLowerCase().includes(q);
    });
  }, [friends, friendQuery, group?.members]);

  async function handleJoinOrLeave() {
    if (!group || working) return;
    setWorking(true);
    setError("");
    try {
      if (group.isMember) {
        await leaveGroup(group.id);
        router.push("/groups");
      } else {
        const next = await joinGroup(group.id);
        setGroup(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update membership.");
    } finally {
      setWorking(false);
    }
  }

  async function openAddMembers() {
    setAddOpen(true);
    try {
      const result = await listFriends();
      setFriends(result.items || []);
    } catch {
      setFriends([]);
    }
  }

  async function handleAddMembers() {
    if (!selected.length || working) return;
    setWorking(true);
    setError("");
    try {
      const next = await addGroupMembers(groupId, selected);
      setGroup(next);
      setAddOpen(false);
      setSelected([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add members.");
    } finally {
      setWorking(false);
    }
  }

  async function confirmDelete() {
    if (working) return;
    setWorking(true);
    try {
      await deleteGroup(groupId);
      router.push("/groups");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete group.");
      setWorking(false);
    }
  }

  if (loading) {
    return <p className="py-16 text-center text-[14px] text-[#6B7280]">Loading group…</p>;
  }

  if (!group) {
    return (
      <div className="mx-auto max-w-[720px] rounded-[12px] bg-white p-8 text-center">
        <p className="text-[16px] font-semibold text-[#0B1C30]">{error || "Group not found"}</p>
        <Link href="/groups" className="mt-3 inline-block text-[14px] font-semibold text-[#00696F]">
          Back to groups
        </Link>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[720px] pb-10">
      <div className="overflow-hidden rounded-[16px] bg-white shadow-[0_0_4px_rgba(0,0,0,0.14)]">
        <div className="relative h-[180px] bg-[#D7E8E9] sm:h-[220px]">
          {group.coverPhoto ? (
            <img src={group.coverPhoto} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-[48px]">👥</div>
          )}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[22px] font-bold text-[#111827]">{group.name}</h1>
              <p className="mt-1 text-[13px] text-[#6B7280]">
                {group.isPrivate ? "Private group" : "Public group"} · {group.membersCount} members ·{" "}
                {group.postsCount} posts
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.isOwner ? (
                <>
                  <button
                    type="button"
                    onClick={() => void openAddMembers()}
                    className="rounded-[8px] bg-[rgba(0,105,111,0.1)] px-4 py-2 text-[13px] font-bold text-[#00696F]"
                  >
                    Add members
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="rounded-[8px] bg-[#FEE2E2] px-4 py-2 text-[13px] font-bold text-[#DC2626]"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={working}
                  onClick={() => void handleJoinOrLeave()}
                  className={`rounded-[8px] px-4 py-2 text-[13px] font-bold disabled:opacity-60 ${
                    group.isMember
                      ? "bg-[#F3F4F6] text-[#4B5563]"
                      : "bg-[#00696F] text-white"
                  }`}
                >
                  {group.isMember ? "Leave group" : "Join group"}
                </button>
              )}
            </div>
          </div>
          <p className="mt-3 text-[14px] leading-6 text-[#3C494A]">
            {group.description || "No description yet."}
          </p>
          <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {group.members.slice(0, 8).map((member) => (
              <Link key={member.id} href={`/profile/${member.username}`} title={nameOf(member)}>
                <UserAvatar avatarUrl={member.avatar} name={nameOf(member)} size={36} />
              </Link>
            ))}
            {group.membersCount > group.members.length ? (
              <span className="text-[12px] text-[#6B7280]">+{group.membersCount - group.members.length}</span>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-[8px] bg-red-50 px-4 py-3 text-[14px] text-red-700">
          {error}
        </p>
      ) : null}

      {group.isMember ? (
        <div className="mt-4">
          <GroupPostComposer
            groupId={group.id}
            groupName={group.name}
            onCreated={(post) => {
              setPosts((prev) => [post, ...prev]);
              setGroup((prev) => (prev ? { ...prev, postsCount: prev.postsCount + 1 } : prev));
            }}
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-4">
        {posts.length ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDeleted={(id) => setPosts((prev) => prev.filter((item) => item.id !== id))}
              onUpdated={(updated) =>
                setPosts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
              }
            />
          ))
        ) : (
          <p className="rounded-[16px] bg-white py-10 text-center text-[14px] text-[#6B7280]">
            No posts in this group yet.
          </p>
        )}
      </div>

      {addOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[420px] overflow-hidden rounded-[16px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
              <h3 className="text-[16px] font-bold">Add friends</h3>
              <button type="button" onClick={() => setAddOpen(false)}>
                ✕
              </button>
            </div>
            <div className="p-3">
              <input
                value={friendQuery}
                onChange={(event) => setFriendQuery(event.target.value)}
                placeholder="Search friends"
                className="h-10 w-full rounded-full bg-[#EFF4FF] px-4 text-[14px] outline-none"
              />
            </div>
            <div className="max-h-[320px] overflow-y-auto px-2 pb-3">
              {visibleFriends.length ? (
                visibleFriends.map((friend) => {
                  const checked = selected.includes(friend.id);
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() =>
                        setSelected((prev) =>
                          checked ? prev.filter((id) => id !== friend.id) : [...prev, friend.id]
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-[#EFF4FF]"
                    >
                      <UserAvatar
                        avatarUrl={friend.avatar}
                        name={nameOf(friend)}
                        size={40}
                      />
                      <span className="flex-1 truncate text-[14px] font-semibold">
                        {nameOf(friend)}
                      </span>
                      <span
                        className={`size-5 rounded-full border ${
                          checked ? "border-[#00696F] bg-[#00696F]" : "border-[#D1D5DB]"
                        }`}
                      />
                    </button>
                  );
                })
              ) : (
                <p className="py-8 text-center text-[13px] text-[#6B7280]">No friends to add.</p>
              )}
            </div>
            <div className="border-t border-[#E5E7EB] p-3">
              <button
                type="button"
                disabled={!selected.length || working}
                onClick={() => void handleAddMembers()}
                className="w-full rounded-[8px] bg-[#00696F] py-2.5 text-[14px] font-bold text-white disabled:opacity-50"
              >
                Add {selected.length || ""} {selected.length === 1 ? "friend" : "friends"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[380px] rounded-[16px] bg-white p-6">
            <h3 className="text-[18px] font-bold">Delete {group.name}?</h3>
            <p className="mt-2 text-[14px] text-[#6B7280]">
              This removes the group and its posts for everyone.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-[8px] bg-[#F3F4F6] py-2.5 text-[14px] font-bold text-[#4B5563]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={working}
                onClick={() => void confirmDelete()}
                className="rounded-[8px] bg-[#DC2626] py-2.5 text-[14px] font-bold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
