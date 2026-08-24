"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FigmaIcon from "../home/FigmaIcon";
import PostCard from "../home/PostCard";
import {
  createGroup,
  deleteGroup,
  fetchDiscoverGroups,
  fetchGroupActivity,
  fetchMyGroups,
  joinGroup,
  leaveGroup,
  type CommunityGroup,
} from "../../lib/api/groups";
import type { PostItem } from "../../lib/api/posts";

export type GroupTab = "mine" | "discover" | "invites";

const tabs: { id: GroupTab; label: string; href: string }[] = [
  { id: "mine", label: "Your Groups", href: "/groups" },
  { id: "discover", label: "Discover", href: "/groups/discover" },
  { id: "invites", label: "Invites", href: "/groups/invites" },
];

export const GROUP_CATEGORIES = [
  { id: "Technology", label: "Technology", icon: "/figma/icons/group-cat-tech.svg?v=2", tint: "bg-[#EEF2FF]", iconSize: { w: 23, h: 16 } },
  { id: "Education", label: "Education", icon: "/figma/icons/group-cat-edu.svg?v=2", tint: "bg-[#EFF6FF]", iconSize: { w: 23, h: 16 } },
  { id: "Business", label: "Business", icon: "/figma/icons/group-cat-biz.svg?v=2", tint: "bg-[#F0FDF4]", iconSize: { w: 16, h: 16 } },
  { id: "Entertainment", label: "Entertainment", icon: "/figma/icons/group-cat-fun.svg?v=2", tint: "bg-[#FDF2F8]", iconSize: { w: 18, h: 16 } },
  { id: "Health & Fitness", label: "Health & Fitness", icon: "/figma/icons/group-cat-health.svg?v=2", tint: "bg-[#FEF2F2]", iconSize: { w: 18, h: 15 } },
  { id: "Travel & Places", label: "Travel & Places", icon: "/figma/icons/group-cat-travel.svg?v=2", tint: "bg-[#ECFEFF]", iconSize: { w: 20, h: 18 } },
] as const;

function formatMembers(count: number) {
  if (count >= 1000) {
    const value = count / 1000;
    return `${value >= 10 ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, "")}K Members`;
  }
  return `${count} ${count === 1 ? "Member" : "Members"}`;
}

function formatAgo(value?: string) {
  if (!value) return "";
  const mins = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return new Date(value).toLocaleDateString();
}

function formatPostsLabel(count: number) {
  if (count <= 0) return "No new posts";
  if (count > 25) return "25+ new posts";
  return `${count} ${count === 1 ? "new post" : "new posts"}`;
}

function State({ loading, message }: { loading: boolean; message: string }) {
  return (
    <p className="py-10 text-center text-[14px] text-[#6B7280]">
      {loading ? "Loading…" : message}
    </p>
  );
}

function GroupListCard({
  group,
  tab,
  working,
  menuId,
  onToggleMenu,
  onVisit,
  onJoin,
  onLeave,
  onDelete,
}: {
  group: CommunityGroup;
  tab: GroupTab;
  working: boolean;
  menuId: string | null;
  onToggleMenu: () => void;
  onVisit: () => void;
  onJoin: () => void;
  onLeave: () => void;
  onDelete: () => void;
}) {
  const menuOpen = menuId === group.id;

  return (
    <article className="relative flex flex-col gap-4 rounded-[16px] border border-[#F3F4F6] bg-white p-[21px] shadow-[0_0_2px_rgba(0,0,0,0.25)] sm:flex-row sm:items-start">
      <Link href={`/groups/${group.id}`} className="size-20 shrink-0 overflow-hidden rounded-[12px] bg-[#EEF2FF]">
        {group.coverPhoto ? (
          <img src={group.coverPhoto} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center">
            <FigmaIcon src="/figma/icons/groups.svg" alt="" width={28} height={28} />
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Link href={`/groups/${group.id}`} className="truncate text-[18px] font-bold leading-7 text-[#111827] hover:underline">
            {group.name}
          </Link>
          {group.owner?.isVerified ? (
            <FigmaIcon src="/figma/icons/verified.svg" alt="" width={14} height={14} />
          ) : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[14px] leading-5 text-[#6B7280]">
          <span>{group.isPrivate ? "Private Group" : "Public Group"}</span>
          <span className="size-1 rounded-full bg-[#D1D5DB]" />
          <span>{formatMembers(group.membersCount)}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-[14px] leading-5 text-[#4B5563]">
          {group.description || "No description yet."}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
        <div className="flex items-center gap-2">
          {group.postsCount > 0 ? <span className="size-2 rounded-full bg-[#00696F]" /> : null}
          <span className="text-[14px] font-semibold leading-5 text-[#1F2937]">
            {formatPostsLabel(group.postsCount)}
          </span>
          <span className="text-[12px] leading-4 text-[#9CA3AF]">
            {formatAgo(group.latestPostAt || group.updatedAt || group.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {tab === "discover" && !group.isMember ? (
            <button
              type="button"
              disabled={working}
              onClick={onJoin}
              className="rounded-[8px] bg-[#00696F] px-[21px] py-[7px] text-[14px] font-semibold text-white disabled:opacity-60"
            >
              {working ? "Joining…" : "Join Group"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onVisit}
              className="rounded-[8px] border border-[#00696F] px-[21px] py-[7px] text-[14px] font-semibold text-[#00696F]"
            >
              Visit Group
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              aria-label="More"
              onClick={onToggleMenu}
              className="flex size-8 items-center justify-center rounded-[8px] border border-[#E5E7EB]"
            >
              <FigmaIcon src="/figma/icons/more-h.svg" alt="" width={14} height={4} />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-9 z-10 min-w-[160px] overflow-hidden rounded-[12px] border border-[#F3F4F6] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                <button
                  type="button"
                  onClick={onVisit}
                  className="block w-full px-3 py-2 text-left text-[13px] font-medium text-[#111827] hover:bg-[#F9FAFB]"
                >
                  Visit Group
                </button>
                {group.isOwner ? (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="block w-full px-3 py-2 text-left text-[13px] font-medium text-[#DC2626] hover:bg-red-50"
                  >
                    Delete group
                  </button>
                ) : group.isMember ? (
                  <button
                    type="button"
                    onClick={onLeave}
                    className="block w-full px-3 py-2 text-left text-[13px] font-medium text-[#4B5563] hover:bg-[#F9FAFB]"
                  >
                    Leave group
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

const fieldClass =
  "mt-1.5 w-full rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#00696F] focus:bg-white focus:ring-[3px] focus:ring-[#00696F]/12";

function CreateGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (group: CommunityGroup) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [category, setCategory] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const coverPreview = useMemo(() => (cover ? URL.createObjectURL(cover) : ""), [cover]);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !creating) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [creating, onClose]);

  function applyCover(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a JPG or PNG cover photo.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Cover photo must be under 8MB.");
      return;
    }
    setError("");
    setCover(file);
  }

  function clearCover() {
    setCover(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleCreate() {
    if (name.trim().length < 2 || creating) return;
    setCreating(true);
    setError("");
    try {
      const group = await createGroup({
        name: name.trim(),
        description: description.trim(),
        category,
        isPrivate,
        cover,
      });
      onCreated(group);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create group.");
    } finally {
      setCreating(false);
    }
  }

  const canCreate = name.trim().length >= 2 && !creating;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0B1C30]/45 px-4 py-6 backdrop-blur-[3px]"
      onClick={() => {
        if (!creating) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-group-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[min(860px,calc(100vh-32px))] w-full max-w-[520px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_28px_80px_rgba(11,28,48,0.28)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-[#F3F4F6] px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-[#F0F5FF]">
              <FigmaIcon src="/figma/icons/groups.svg" alt="" width={22} height={22} />
            </span>
            <div>
              <h3 id="create-group-title" className="text-[20px] font-extrabold leading-6 text-[#111827]">
                Create Group
              </h3>
              <p className="mt-1 max-w-[340px] text-[13px] leading-5 text-[#6B7280]">
                Find people who share your interests. Group chats stay in Messenger.
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={creating}
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[18px] text-[#6B7280] hover:bg-[#F3F4F6]"
          >
            ✕
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              applyCover(event.dataTransfer.files?.[0]);
            }}
            className={`relative flex h-[140px] w-full items-center justify-center overflow-hidden rounded-[16px] border-2 border-dashed transition ${
              dragging
                ? "border-[#00696F] bg-[#E8F4F3]"
                : coverPreview
                  ? "border-transparent"
                  : "border-[#D8E0F0] bg-[#F8FAFF] hover:border-[#00696F] hover:bg-[#F0F5FF]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => applyCover(event.target.files?.[0])}
            />
            {coverPreview ? (
              <>
                <img src={coverPreview} alt="" className="absolute inset-0 size-full object-cover" />
                <span className="absolute inset-0 bg-black/25" />
                <span className="relative z-[1] flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[13px] font-semibold text-[#00696F] shadow-sm">
                  <FigmaIcon src="/figma/icons/photo.svg" alt="" width={16} height={14} />
                  Change cover
                </span>
              </>
            ) : (
              <span className="flex flex-col items-center gap-2 px-4 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(11,28,48,0.08)]">
                  <FigmaIcon src="/figma/icons/cloud-upload.svg" alt="" width={24} height={18} />
                </span>
                <span className="text-[14px] font-semibold text-[#111827]">Add a cover photo</span>
                <span className="text-[12px] text-[#6B7280]">JPG or PNG up to 8MB · drag and drop</span>
              </span>
            )}
          </button>
          {cover ? (
            <button
              type="button"
              onClick={clearCover}
              className="mt-2 text-[12px] font-semibold text-[#6B7280] hover:text-[#DC2626]"
            >
              Remove photo
            </button>
          ) : null}

          <label className="mt-5 block text-[13px] font-semibold text-[#111827]">
            Group name <span className="text-[#DC2626]">*</span>
            <input
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Nature Lovers"
              className={`${fieldClass} h-12`}
            />
            <span className="mt-1 block text-right text-[11px] font-medium text-[#9CA3AF]">
              {name.trim().length}/80
            </span>
          </label>

          <label className="mt-1 block text-[13px] font-semibold text-[#111827]">
            Description
            <textarea
              value={description}
              maxLength={500}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this group about?"
              className={`${fieldClass} min-h-[96px] resize-none py-3`}
            />
            <span className="mt-1 block text-right text-[11px] font-medium text-[#9CA3AF]">
              {description.trim().length}/500
            </span>
          </label>

          <div className="mt-1">
            <p className="text-[13px] font-semibold text-[#111827]">Category</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {GROUP_CATEGORIES.map((item) => {
                const active = category === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory((current) => (current === item.id ? "" : item.id))}
                    className={`flex min-h-[52px] items-center gap-2.5 rounded-[12px] border px-2.5 py-2 text-left transition ${
                      active
                        ? "border-[#00696F] bg-[#F0F5FF] shadow-[0_0_0_3px_rgba(0,105,111,0.08)]"
                        : "border-[#F3F4F6] bg-[#F9FAFB] hover:border-[#D8E0F0]"
                    }`}
                  >
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-[8px] ${item.tint}`}>
                      <FigmaIcon src={item.icon} alt="" width={item.iconSize.w} height={item.iconSize.h} />
                    </span>
                    <span className="text-[12px] font-semibold leading-[15px] text-[#111827]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[13px] font-semibold text-[#111827]">Privacy</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                {
                  privateGroup: false,
                  label: "Public",
                  hint: "Anyone can find and join",
                  icon: "/figma/icons/privacy-globe.svg",
                },
                {
                  privateGroup: true,
                  label: "Private",
                  hint: "Only invited members",
                  icon: "/figma/icons/friends-lock.svg",
                },
              ].map((option) => {
                const active = isPrivate === option.privateGroup;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setIsPrivate(option.privateGroup)}
                    className={`rounded-[14px] border px-3 py-3 text-left transition ${
                      active
                        ? "border-[#00696F] bg-[#F0F5FF] shadow-[0_0_0_3px_rgba(0,105,111,0.08)]"
                        : "border-[#F3F4F6] bg-[#F9FAFB] hover:border-[#D8E0F0]"
                    }`}
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-white">
                      <FigmaIcon src={option.icon} alt="" width={16} height={16} />
                    </span>
                    <span className="mt-2 block text-[14px] font-bold text-[#111827]">{option.label}</span>
                    <span className="mt-0.5 block text-[12px] leading-4 text-[#6B7280]">{option.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error ? (
            <p role="alert" className="mt-4 rounded-[12px] bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="grid grid-cols-2 gap-3 border-t border-[#F3F4F6] bg-white px-6 py-4">
          <button
            type="button"
            disabled={creating}
            onClick={onClose}
            className="h-11 rounded-[12px] bg-[#F3F4F6] text-[14px] font-bold text-[#4B5563] hover:bg-[#E5E7EB] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canCreate}
            onClick={() => void handleCreate()}
            className="h-11 rounded-[12px] bg-[#00696F] text-[14px] font-bold text-white shadow-[0_8px_16px_rgba(0,105,111,0.22)] hover:bg-[#01585d] disabled:opacity-45 disabled:shadow-none"
          >
            {creating ? "Creating…" : "Create Group"}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default function GroupsView({ tab }: { tab: GroupTab }) {
  const router = useRouter();
  const categoryRowRef = useRef<HTMLDivElement>(null);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [activity, setActivity] = useState<PostItem[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(8);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CommunityGroup | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "invites") {
        setGroups([]);
        setActivity([]);
      } else {
        const [items, posts] = await Promise.all([
          tab === "discover" ? fetchDiscoverGroups() : fetchMyGroups(),
          tab === "mine" ? fetchGroupActivity() : Promise.resolve([] as PostItem[]),
        ]);
        setGroups(items);
        setActivity(posts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load groups.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    setVisibleCount(8);
    setCategory("");
    setMenuId(null);
    void refresh();
  }, [refresh]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups.filter((group) => {
      const hay = `${group.name} ${group.description} ${group.category || ""}`.toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (category && (group.category || "") !== category) return false;
      return true;
    });
  }, [groups, query, category]);

  const shown = visible.slice(0, visibleCount);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const group of groups) {
      const key = group.category || "";
      if (!key) continue;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [groups]);

  async function handleJoin(group: CommunityGroup) {
    setWorking(group.id);
    setError("");
    try {
      await joinGroup(group.id);
      setNotice(`You joined ${group.name}.`);
      router.push(`/groups/${group.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to join this group.");
    } finally {
      setWorking("");
    }
  }

  async function handleLeave(group: CommunityGroup) {
    setWorking(group.id);
    setMenuId(null);
    try {
      await leaveGroup(group.id);
      setGroups((prev) => prev.filter((item) => item.id !== group.id));
      setNotice(`You left ${group.name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to leave this group.");
    } finally {
      setWorking("");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setWorking(deleteTarget.id);
    try {
      await deleteGroup(deleteTarget.id);
      setGroups((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      setNotice(`${deleteTarget.name} was deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete group.");
    } finally {
      setWorking("");
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-[939px] flex-col gap-6 pb-10">
      <div className="rounded-[16px] border border-[#F3F4F6] bg-white p-[25px] shadow-[0_0_1px_rgba(0,0,0,0.25)]">
        <h1 className="text-[30px] font-extrabold leading-9 text-[#111827]">Groups</h1>
        <p className="mt-1 pb-4 text-[16px] leading-6 text-[#6B7280]">
          Discover groups that match your interests and connect with like-minded people.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F3F4F6]">
          <nav aria-label="Groups sections" className="flex gap-6 overflow-x-auto no-scrollbar">
            {tabs.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`pb-[14px] text-[16px] ${
                  item.id === tab
                    ? "border-b-2 border-[#00696F] font-semibold text-[#00696F]"
                    : "font-medium text-[#6B7280] hover:text-[#00696F]"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {item.label}
                  {item.id === "invites" ? (
                    <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[12px] font-semibold text-[#4B5563]">
                      0
                    </span>
                  ) : null}
                </span>
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E5EDFF] bg-[#F0F5FF] px-[17px] py-[7px] text-[14px] font-semibold text-[#00696F]"
          >
            <span className="text-[16px] leading-none">+</span>
            Create Group
          </button>
        </div>

        <div className="relative pt-4">
          <span className="pointer-events-none absolute left-3 top-1/2 mt-2 -translate-y-1/2">
            <FigmaIcon src="/figma/icons/group-search.svg" alt="" width={14} height={14} />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search groups..."
            className="h-11 w-full max-w-[465px] rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] pl-10 pr-4 text-[14px] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#00696F]"
          />
        </div>
      </div>

      {notice ? (
        <p role="status" className="rounded-[8px] bg-[#E8F4F3] px-4 py-3 text-[14px] text-[#00696F]">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-[8px] bg-red-50 px-4 py-3 text-[14px] text-red-700">
          {error}
        </p>
      ) : null}

      {tab !== "invites" ? (
        <div className="rounded-[16px] border border-[#F3F4F6] bg-white p-[25px] shadow-[0_0_2px_rgba(0,0,0,0.25)]">
          <h2 className="text-[18px] font-bold leading-7 text-[#111827]">Browse Groups by Category</h2>
          <div className="relative mt-4">
            <div ref={categoryRowRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {GROUP_CATEGORIES.map((item) => {
                const count = categoryCounts[item.id] || 0;
                const active = category === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory((current) => (current === item.id ? "" : item.id))}
                    className={`flex min-w-[180px] shrink-0 items-center gap-3 rounded-[12px] border px-[13px] py-[13px] text-left ${
                      active ? "border-[#00696F] bg-[#F0F5FF]" : "border-[#F3F4F6] bg-white"
                    }`}
                  >
                    <span className={`flex size-10 items-center justify-center rounded-[8px] ${item.tint}`}>
                      <FigmaIcon src={item.icon} alt="" width={item.iconSize.w} height={item.iconSize.h} />
                    </span>
                    <span>
                      <span className="block text-[14px] font-semibold leading-5 text-[#111827]">{item.label}</span>
                      <span className="block text-[12px] leading-4 text-[#6B7280]">
                        {count} {count === 1 ? "Group" : "Groups"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-label="Scroll categories"
              onClick={() => categoryRowRef.current?.scrollBy({ left: 220, behavior: "smooth" })}
              className="absolute -right-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#F3F4F6] bg-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] sm:flex"
            >
              <FigmaIcon src="/figma/icons/group-chevron-right.svg" alt="" width={6} height={11} />
            </button>
          </div>
        </div>
      ) : null}

      {tab === "invites" ? (
        <div className="rounded-[16px] border border-[#F3F4F6] bg-white px-6 py-16 text-center shadow-[0_0_2px_rgba(0,0,0,0.25)]">
          <h2 className="text-[18px] font-bold text-[#111827]">Invites</h2>
          <p className="mt-2 text-[14px] text-[#6B7280]">You have no pending group invites.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="px-2 text-[18px] font-bold leading-7 text-[#111827]">
            {tab === "discover" ? "Suggested Groups" : `Your Groups (${visible.length})`}
          </h2>
          {loading ? (
            <State loading message="" />
          ) : shown.length ? (
            shown.map((group) => (
              <GroupListCard
                key={group.id}
                group={group}
                tab={tab}
                working={working === group.id}
                menuId={menuId}
                onToggleMenu={() => setMenuId((current) => (current === group.id ? null : group.id))}
                onVisit={() => router.push(`/groups/${group.id}`)}
                onJoin={() => void handleJoin(group)}
                onLeave={() => void handleLeave(group)}
                onDelete={() => {
                  setMenuId(null);
                  setDeleteTarget(group);
                }}
              />
            ))
          ) : (
            <State
              loading={false}
              message={
                tab === "discover"
                  ? "No public groups to discover yet. Create the first one."
                  : "You have not joined any groups yet."
              }
            />
          )}
          {visible.length > visibleCount ? (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + 8)}
              className="mx-auto flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-[#00696F]"
            >
              Load More Groups
              <span className="text-[10px]">▾</span>
            </button>
          ) : null}
        </div>
      )}

      {tab === "mine" && activity.length ? (
        <div className="flex flex-col gap-6 pt-2">
          <h2 className="px-2 text-[18px] font-bold leading-7 text-[#111827]">
            Recent Activity from Your Groups
          </h2>
          {activity.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDeleted={(id) => setActivity((prev) => prev.filter((item) => item.id !== id))}
            />
          ))}
        </div>
      ) : null}

      {createOpen ? (
        <CreateGroupModal
          onClose={() => setCreateOpen(false)}
          onCreated={(group) => {
            setCreateOpen(false);
            router.push(`/groups/${group.id}`);
          }}
        />
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[380px] rounded-[16px] bg-white p-6">
            <h3 className="text-[18px] font-bold">Delete {deleteTarget.name}?</h3>
            <p className="mt-2 text-[14px] text-[#6B7280]">
              This removes the group and its posts for everyone.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-[8px] bg-[#F3F4F6] py-2.5 text-[14px] font-bold text-[#4B5563]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(working)}
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
