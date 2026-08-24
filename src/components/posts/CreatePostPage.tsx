"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Source_Serif_4 } from "next/font/google";
import FigmaIcon from "../home/FigmaIcon";
import { UserAvatar } from "../ui/UserAvatar";
import {
  displayName,
  getStoredUser,
  listFriends,
  type AuthUser,
  type FriendUser,
} from "../../lib/auth";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { createPost } from "../../lib/api/posts";
import {
  EmojiSheet,
  FeelingPicker,
  LocationPicker,
  PRIVACY_OPTIONS,
  TagFriendsPicker,
} from "./PostExtras";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const DRAFT_KEY = "chattm_post_draft";

const ATTACHMENTS = [
  {
    id: "media",
    label: "Add media",
    icon: "/figma/icons/add-media.svg",
    iconSize: { width: 18, height: 18 },
    className: "bg-[rgba(0,105,111,0.1)]",
  },
  {
    id: "tags",
    label: "Tag friends",
    icon: "/figma/icons/tag-friends.svg",
    iconSize: { width: 22, height: 16 },
    className: "bg-[rgba(233,30,99,0.1)]",
  },
  {
    id: "location",
    label: "Add location",
    icon: "/figma/icons/add-location.svg",
    iconSize: { width: 16, height: 20 },
    className: "bg-[rgba(124,88,0,0.1)]",
  },
  {
    id: "emoji",
    label: "Add emoji",
    icon: "/figma/icons/add-emoji.svg",
    iconSize: { width: 20, height: 20 },
    className: "bg-[rgba(254,183,0,0.1)]",
  },
] as const;

type Draft = {
  caption: string;
  privacy: (typeof PRIVACY_OPTIONS)[number]["id"];
  location: string;
  feeling: string;
  mentionIds: string[];
};

function readDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function nameOf(user: FriendUser) {
  return `${user.firstName} ${user.lastName}`.trim() || user.username;
}

export default function CreatePostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const liveUser = useCurrentUser();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [privacy, setPrivacy] = useState<(typeof PRIVACY_OPTIONS)[number]["id"]>("PUBLIC");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [feeling, setFeeling] = useState("");
  const [tagged, setTagged] = useState<FriendUser[]>([]);
  const [sheet, setSheet] = useState<"location" | "feeling" | "tags" | "emoji" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    const draft = readDraft();
    if (draft) {
      setCaption(draft.caption || "");
      setPrivacy(draft.privacy || "PUBLIC");
      setLocation(draft.location || "");
      setFeeling(draft.feeling || "");
    }
    listFriends()
      .then((payload) => {
        const items = payload.items || [];
        setFriends(items);
        if (draft?.mentionIds?.length) {
          setTagged(items.filter((item) => draft.mentionIds.includes(item.id)));
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const mentionQuery = useMemo(() => {
    const match = caption.slice(0, textareaRef.current?.selectionStart || caption.length).match(/@([A-Za-z0-9_.]*)$/);
    return match ? match[1].toLowerCase() : null;
  }, [caption]);

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    return friends
      .filter((friend) => {
        const hay = `${friend.firstName} ${friend.lastName} ${friend.username}`.toLowerCase();
        return hay.includes(mentionQuery);
      })
      .slice(0, 6);
  }, [friends, mentionQuery]);

  useEffect(() => {
    setMentionOpen(mentionQuery !== null && mentionMatches.length > 0);
  }, [mentionQuery, mentionMatches.length]);

  const applyFiles = (incoming: FileList | File[] | null) => {
    if (!incoming?.length) return;
    const next = Array.from(incoming).slice(0, 6);
    setFiles(next);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const first = next[0];
    setPreviewUrl(first?.type.startsWith("image/") ? URL.createObjectURL(first) : null);
  };

  const firstName = liveUser?.firstName || user?.firstName || "there";
  const selectedPrivacy = PRIVACY_OPTIONS.find((item) => item.id === privacy) || PRIVACY_OPTIONS[0];
  const canPost = Boolean(caption.trim() || files.length);

  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    if (!el) {
      setCaption((prev) => prev + text);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = `${caption.slice(0, start)}${text}${caption.slice(end)}`;
    setCaption(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function insertMention(friend: FriendUser) {
    const replaced = caption.replace(/@([A-Za-z0-9_.]*)$/, `@${friend.username} `);
    setCaption(replaced);
    setMentionOpen(false);
    if (!tagged.some((item) => item.id === friend.id)) {
      setTagged((prev) => [...prev, friend]);
    }
  }

  function saveDraft() {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        caption,
        privacy,
        location,
        feeling,
        mentionIds: tagged.map((item) => item.id),
      } satisfies Draft)
    );
  }

  async function handlePost() {
    if (!canPost || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await createPost({
        body: caption,
        privacy,
        location,
        feeling,
        mentionIds: tagged.map((item) => item.id),
        files,
      });
      localStorage.removeItem(DRAFT_KEY);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create post.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-start justify-center gap-3 pt-2.5 pb-12 px-2">
      <Link
        href="/"
        aria-label="Go back"
        className="size-10 rounded-full flex items-center justify-center shrink-0 mt-1 hover:bg-[#EFF4FF] transition-colors"
      >
        <span className="relative size-4 overflow-clip">
          <img
            src="/figma/icons/back-arrow.svg"
            alt=""
            width={16}
            height={16}
            className="size-full object-contain"
          />
        </span>
      </Link>

      <div className="w-full max-w-[768px] flex flex-col gap-6">
        <header>
          <h1
            className={`${sourceSerif.className} text-[32px] font-bold leading-[40px] tracking-[-0.32px] text-[#0B1C30]`}
          >
            Create New Post
          </h1>
          <p className={`${sourceSerif.className} mt-1 text-[16px] leading-6 text-[#3C494A]`}>
            Share a moment with your network.
          </p>
        </header>

        <section className="w-full bg-white rounded-xl border border-[rgba(211,228,254,0.3)] shadow-[0px_10px_20px_0px_rgba(86,94,116,0.08)] overflow-hidden">
          <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-3">
              <UserAvatar
                avatarUrl={liveUser?.avatar || user?.avatar}
                name={user ? displayName(user) : "User"}
                size={48}
              />
              <div className="flex flex-col">
                <h2 className="text-[14px] font-semibold leading-5 tracking-[0.14px] text-[#0B1C30]">
                  {user ? displayName(user) : "You"}
                  {feeling ? <span className="font-normal text-[#3C494A]"> is feeling {feeling}</span> : null}
                </h2>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPrivacyOpen((open) => !open)}
                      className="flex items-center gap-1 bg-[#EFF4FF] border border-[rgba(211,228,254,0.5)] rounded-[6px] px-[9px] py-[5px] text-[12px] font-semibold leading-4 tracking-[0.24px] text-[#3C494A]"
                    >
                      <FigmaIcon src={selectedPrivacy.icon} alt="" width={13} height={13} />
                      {selectedPrivacy.label}
                      <FigmaIcon src="/figma/icons/chevron-down.svg" alt="" width={7} height={3} />
                    </button>
                    {privacyOpen ? (
                      <div className="absolute left-0 top-9 z-10 min-w-[180px] rounded-[10px] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                        {PRIVACY_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setPrivacy(option.id);
                              setPrivacyOpen(false);
                            }}
                            className={`flex w-full flex-col items-start px-3 py-2 text-left ${
                              option.id === privacy ? "bg-[#EFF4FF]" : ""
                            }`}
                          >
                            <span className="flex items-center gap-2 text-[13px] font-semibold text-[#0B1C30]">
                              <FigmaIcon src={option.icon} alt="" width={13} height={13} />
                              {option.label}
                            </span>
                            <span className="pl-5 text-[11px] text-[#6B7280]">{option.hint}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1 bg-[#EFF4FF] border border-[rgba(211,228,254,0.5)] rounded-[6px] px-[9px] py-[5px] text-[12px] font-semibold leading-4 tracking-[0.24px] text-[#3C494A]">
                    <button type="button" onClick={() => setSheet("location")} className="flex items-center gap-1">
                      <FigmaIcon src="/figma/icons/map-pin.svg" alt="" width={11} height={13} />
                      {location || "Select Area"}
                    </button>
                    {location ? (
                      <button
                        type="button"
                        aria-label="Remove location"
                        onClick={() => setLocation("")}
                        className="ml-1 text-[14px] leading-none text-[#6B7280] hover:text-[#111827]"
                      >
                        ×
                      </button>
                    ) : (
                      <FigmaIcon src="/figma/icons/chevron-down.svg" alt="" width={7} height={3} />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSheet("feeling")}
                    className="flex items-center gap-1 bg-[#EFF4FF] border border-[rgba(211,228,254,0.5)] rounded-[6px] px-[9px] py-[5px] text-[12px] font-semibold leading-4 tracking-[0.24px] text-[#3C494A]"
                  >
                    <FigmaIcon src="/figma/icons/feeling.svg" alt="" width={13} height={13} />
                    {feeling || "Feeling"}
                  </button>
                </div>
              </div>
            </div>

            <div className="relative">
              <textarea
                ref={textareaRef}
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder={`What's on your mind, ${firstName}? Use @ to mention friends.`}
                className={`${sourceSerif.className} w-full min-h-[120px] resize-none bg-transparent text-[18px] leading-7 text-[#0B1C30] placeholder:text-[rgba(60,73,74,0.5)] focus:outline-none`}
              />
              {mentionOpen ? (
                <div className="absolute left-0 top-full z-20 w-full max-w-[320px] rounded-[12px] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                  {mentionMatches.map((friend) => (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => insertMention(friend)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#EFF4FF]"
                    >
                      <UserAvatar avatarUrl={friend.avatar} name={nameOf(friend)} size={28} />
                      <span>
                        <span className="block text-[13px] font-semibold">{nameOf(friend)}</span>
                        <span className="text-[12px] text-[#6B7280]">@{friend.username}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {tagged.length ? (
              <div className="flex flex-wrap gap-2">
                {tagged.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => setTagged((prev) => prev.filter((item) => item.id !== friend.id))}
                    className="rounded-full bg-[#EFF4FF] px-3 py-1 text-[12px] font-semibold text-[#00696F]"
                  >
                    @{friend.username} ×
                  </button>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                applyFiles(event.dataTransfer.files);
              }}
              className={`relative w-full h-64 rounded-lg bg-[#EFF4FF] border-2 border-dashed border-[#BBC9CA] flex flex-col items-center justify-center overflow-hidden ${
                isDragging ? "ring-2 ring-[#00696F]/30" : ""
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,video/mp4"
                multiple
                className="hidden"
                onChange={(event) => applyFiles(event.target.files)}
              />

              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Selected media" className="absolute inset-0 size-full object-cover" />
                  {files.length > 1 ? (
                    <span className="absolute top-3 right-3 rounded-[6px] bg-black/50 px-2 py-1 text-[12px] text-white">
                      {files.length} files
                    </span>
                  ) : null}
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 p-4">
                  <div className="size-16 rounded-full bg-[rgba(0,105,111,0.1)] flex items-center justify-center">
                    <FigmaIcon src="/figma/icons/cloud-upload.svg" alt="" width={28} height={20} />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`${sourceSerif.className} text-[14px] font-bold leading-5 tracking-[0.14px] text-[#0B1C30]`}
                    >
                      {files[0]?.name ?? "Click or drag media here"}
                    </span>
                    <span className={`${sourceSerif.className} text-[14px] leading-5 text-[#3C494A]`}>
                      Supports JPG, PNG, MP4 up to 50MB
                    </span>
                  </div>
                </div>
              )}
            </button>

            <div className="flex items-center justify-between pt-2">
              <span
                className={`${sourceSerif.className} text-[12px] font-bold leading-4 tracking-[0.24px] text-[#3C494A]`}
              >
                Add to your post
              </span>
              <div className="flex items-center gap-2">
                {ATTACHMENTS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={item.label}
                    onClick={() => {
                      if (item.id === "media") fileInputRef.current?.click();
                      if (item.id === "tags") setSheet("tags");
                      if (item.id === "location") setSheet("location");
                      if (item.id === "emoji") setSheet("emoji");
                    }}
                    className={`size-10 rounded-full flex items-center justify-center ${item.className}`}
                  >
                    <FigmaIcon
                      src={item.icon}
                      alt=""
                      width={item.iconSize.width}
                      height={item.iconSize.height}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error ? (
            <p className="px-6 pb-2 text-[14px] text-red-600">{error}</p>
          ) : null}

          <div className="bg-[#E5EEFF] border-t border-[rgba(211,228,254,0.3)] flex items-center justify-end gap-3 px-6 pt-[25px] pb-6">
            <button
              type="button"
              onClick={saveDraft}
              className={`${sourceSerif.className} px-6 py-2.5 rounded-lg text-[14px] font-bold leading-5 tracking-[0.14px] text-[#3C494A] hover:bg-white/50 transition-colors`}
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={!canPost || submitting}
              onClick={() => void handlePost()}
              className={`${sourceSerif.className} bg-[#00696F] hover:bg-[#00585D] text-white px-8 py-2.5 rounded-lg text-[14px] font-bold leading-5 tracking-[0.14px] flex items-center gap-2 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] transition-colors disabled:opacity-50`}
            >
              {submitting ? "Posting…" : "Post"}
              <FigmaIcon src="/figma/icons/send-post.svg" alt="" width={14} height={12} />
            </button>
          </div>
        </section>
      </div>

      {sheet === "location" ? (
        <LocationPicker value={location} onSelect={setLocation} onClose={() => setSheet(null)} />
      ) : null}
      {sheet === "feeling" ? (
        <FeelingPicker onSelect={setFeeling} onClose={() => setSheet(null)} />
      ) : null}
      {sheet === "tags" ? (
        <TagFriendsPicker
          friends={friends}
          selected={tagged}
          onChange={setTagged}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet === "emoji" ? (
        <EmojiSheet onSelect={insertAtCursor} onClose={() => setSheet(null)} />
      ) : null}
    </div>
  );
}
