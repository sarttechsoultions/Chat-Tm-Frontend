"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Source_Serif_4 } from "next/font/google";
import FigmaIcon from "../home/FigmaIcon";
import { UserAvatar } from "../ui/UserAvatar";
import {
  displayName,
  listFriends,
  type FriendUser,
} from "../../lib/auth";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { createPost, fetchPost, updatePost, type PostItem } from "../../lib/api/posts";
import { formatFileSize, preparePostFiles } from "../../lib/media";
import ImageCropEditor from "./ImageCropEditor";
import { postDraftFingerprint, readPostDraft, removePostDraft, writePostDraft, type PostDraft } from "../../lib/postDraft";
import { announcePostSuccess } from "./PostNotice";
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

function nameOf(user: FriendUser) {
  return `${user.firstName} ${user.lastName}`.trim() || user.username;
}

function AttachedMediaPreview({ file, onCrop }: { file: File; onCrop: (src: string) => void }) {
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (mediaRef.current) mediaRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  if (file.type.startsWith("video/")) return <video ref={node => { mediaRef.current = node; }} className="size-full object-contain bg-black" muted />;
  return <button type="button" onClick={() => { if (mediaRef.current) onCrop(mediaRef.current.src); }} className="size-full" aria-label="Crop photo">
    <img ref={node => { mediaRef.current = node; }} alt="Attached photo preview" className="size-full object-contain" />
  </button>;
}

export default function CreatePostPage({
  isModal = false,
  onClose,
  onCreated,
  onUpdated,
}: {
  isModal?: boolean;
  onClose?: () => void;
  onCreated?: (post: PostItem) => void;
  onUpdated?: (post: PostItem) => void;
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit") || "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const liveUser = useCurrentUser();
  const user = liveUser;
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [caption, setCaption] = useState("");
  const [heading, setHeading] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<{ id: string; url: string; type: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [privacy, setPrivacy] = useState<(typeof PRIVACY_OPTIONS)[number]["id"]>("PUBLIC");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [feeling, setFeeling] = useState("");
  const [tagged, setTagged] = useState<FriendUser[]>([]);
  const [sheet, setSheet] = useState<"location" | "feeling" | "tags" | "emoji" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [publishFailed, setPublishFailed] = useState(false);
  const [error, setError] = useState("");
  const [draftError, setDraftError] = useState("");
  const [draftNotice, setDraftNotice] = useState("");
  const [savedFingerprint, setSavedFingerprint] = useState("");
  const [loadedKey, setLoadedKey] = useState("");
  const [preparingMedia, setPreparingMedia] = useState(false);
  const [showHeading, setShowHeading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const submittedRef = useRef(false);
  const mediaBusyRef = useRef(false);
  const publishBusyRef = useRef(false);
  const [mentionDismissed, setMentionDismissed] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [cropTarget, setCropTarget] = useState<
    | { kind: "file"; index: number; src: string; name: string }
    | { kind: "existing"; id: string; src: string }
    | null
  >(null);

  const userId = user?.id;
  const formKey = userId ? `${userId}:${editId}` : "";
  const ready = Boolean(formKey && loadedKey === formKey && !loadFailed);
  const draft = useMemo<PostDraft>(() => ({ heading, caption, privacy, location, feeling, tagged, files }),
    [heading, caption, privacy, location, feeling, tagged, files]);
  const fingerprint = postDraftFingerprint(draft, existingMedia.map(item => item.id));
  const unsaved = ready && fingerprint !== savedFingerprint;
  const latest = useRef({ draft, fingerprint, formKey, userId: user?.id, editId, ready });

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    submittedRef.current = false;
    const key = `${userId}:${editId}`;
    async function restore() {
      await Promise.resolve();
      if (cancelled) return;
      setLoadedKey("");
      setLoadFailed(false);
      setError("");
      setDraftError("");
      setDraftNotice("");
      setFiles([]);
      setExistingMedia([]);
      setShowDetails(false);
      setSheet(null);
      setCropTarget(null);
      let restored: PostDraft = { heading: "", caption: "", privacy: "PUBLIC", location: "", feeling: "", tagged: [], files: [] };
      let media: { id: string; url: string; type: string }[] = [];
      try {
        if (editId) {
          const post = await fetchPost(editId);
          if (post.author.id !== userId) throw new Error("You can only edit your own post.");
          restored = {
            heading: post.heading || "", caption: post.body || "", privacy: post.privacy,
            location: post.location || "", feeling: post.feeling || "", files: [],
            tagged: (post.mentions || []).map(person => ({ ...person, mutualFriends: 0, isOnline: false })),
          };
          media = post.media || [];
        } else {
          await saveQueue.current.catch(() => undefined);
          const stored = await readPostDraft(userId!);
          if (stored) {
            restored = stored;
            if (!cancelled) setDraftNotice(stored.files.length ? "Draft restored, including attached media." : "Draft restored. Continue where you left off.");
          }
        }
      } catch (err) {
        if (cancelled) return;
        if (editId) setError(err instanceof Error ? err.message : "Unable to load post.");
        else setDraftError("Draft storage is unavailable. Try again before writing a new post.");
        setLoadFailed(true);
        return;
      }
      if (cancelled) return;
      setHeading(restored.heading);
      setShowHeading(Boolean(restored.heading));
      setCaption(restored.caption);
      setPrivacy(restored.privacy);
      setLocation(restored.location);
      setFeeling(restored.feeling);
      setTagged(restored.tagged);
      setFiles(restored.files);
      setExistingMedia(media);
      setSavedFingerprint(postDraftFingerprint(restored, media.map(item => item.id)));
      setLoadedKey(key);
    }
    void restore();
    listFriends().then(payload => {
      if (!cancelled) setFriends(payload.items || []);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [userId, editId, loadAttempt]);

  const persistDraft = useCallback(async (notify = true, snapshot?: typeof latest.current) => {
    const current = snapshot || latest.current;
    if (!current.ready || !current.userId || current.editId || submittedRef.current) return false;
    const operation = saveQueue.current.catch(() => undefined).then(async () => {
      if (submittedRef.current) return;
      const content = current.draft;
      if (content.heading.trim() || content.caption.trim() || content.files.length || content.location || content.feeling || content.tagged.length || content.privacy !== "PUBLIC") {
        await writePostDraft(current.userId!, content);
      } else {
        await removePostDraft(current.userId!);
      }
    });
    saveQueue.current = operation;
    try {
      await operation;
      if (notify && latest.current.formKey === current.formKey && !submittedRef.current) {
        setSavedFingerprint(current.fingerprint);
        setDraftError("");
        setDraftNotice("Draft saved on this device.");
      }
      return true;
    } catch {
      if (notify && latest.current.formKey === current.formKey) {
        setDraftError("Couldn't save your draft. Keep this window open and try again.");
      }
      return false;
    }
  }, []);

  useEffect(() => {
    const previous = latest.current;
    if (previous.formKey !== formKey && previous.ready && !previous.editId) void persistDraft(false, previous);
    latest.current = { draft, fingerprint, formKey, userId, editId, ready };
  }, [draft, fingerprint, formKey, userId, editId, ready, persistDraft]);

  useEffect(() => {
    if (!unsaved || editId || submitting || preparingMedia) return;
    const timeout = window.setTimeout(() => { void persistDraft(); }, 600);
    return () => window.clearTimeout(timeout);
  }, [unsaved, fingerprint, editId, submitting, preparingMedia, persistDraft]);

  useEffect(() => () => {
    // Flush on in-app navigation even if the debounce has not fired yet.
    void persistDraft(false);
  }, [persistDraft]);

  useEffect(() => {
    if (!unsaved && !submitting && !preparingMedia) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (submittedRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const leaveLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin || url.href === window.location.href) return;
      event.preventDefault();
      event.stopPropagation();
      if (submitting || preparingMedia) return;
      if (editId) {
        if (window.confirm("Leave without saving your post changes?")) router.push(url.pathname + url.search + url.hash);
      } else {
        void persistDraft().then(saved => { if (saved) router.push(url.pathname + url.search + url.hash); });
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", leaveLink, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", leaveLink, true);
    };
  }, [unsaved, submitting, preparingMedia, editId, persistDraft, router]);

  async function requestClose() {
    if (submitting || preparingMedia) return;
    if (unsaved && !submittedRef.current) {
      if (editId) {
        if (!window.confirm("Leave without saving your post changes?")) return;
      } else if (!await persistDraft()) return;
    }
    if (isModal) onClose?.();
    else router.push("/");
  }

  useEffect(() => {
    if (!isModal || sheet || cropTarget) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (privacyOpen) setPrivacyOpen(false);
        else void requestClose();
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  });

  useEffect(() => {
    if (!isModal) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.querySelector<HTMLButtonElement>('button[aria-label="Close"]')?.focus();
    return () => { previousFocus?.focus(); };
  }, [isModal]);

  useEffect(() => {
    const viewport = window.visualViewport;
    const root = viewportRef.current;
    if (!viewport || !root) return;
    const fitViewport = () => {
      if (isModal) {
        // Mobile keyboards resize the visual viewport without always changing dvh.
        root.style.top = `${viewport.offsetTop}px`;
        root.style.height = `${viewport.height}px`;
        root.style.bottom = "auto";
        if (panelRef.current) panelRef.current.style.maxHeight = `${Math.max(180, Math.min(viewport.height - 24, viewport.height * (window.innerWidth >= 640 ? 0.9 : 1)))}px`;
      } else {
        const keyboardOpen = viewport.height < window.innerHeight - 100;
        root.style.maxHeight = keyboardOpen
          ? `${Math.max(180, viewport.height - Math.max(0, root.getBoundingClientRect().top - viewport.offsetTop) - 12)}px`
          : "";
      }
    };
    fitViewport();
    viewport.addEventListener("resize", fitViewport);
    viewport.addEventListener("scroll", fitViewport);
    return () => {
      viewport.removeEventListener("resize", fitViewport);
      viewport.removeEventListener("scroll", fitViewport);
    };
  }, [isModal]);

  const mentionQuery = useMemo(() => {
    const match = caption.slice(0, cursor).match(/@([A-Za-z0-9_.]*)$/);
    return match ? match[1].toLowerCase() : null;
  }, [caption, cursor]);

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    return friends
      .filter((friend) => {
        const hay = `${friend.firstName} ${friend.lastName} ${friend.username}`.toLowerCase();
        return hay.includes(mentionQuery);
      })
      .slice(0, 6);
  }, [friends, mentionQuery]);

  const mentionOpen = !mentionDismissed && mentionQuery !== null && mentionMatches.length > 0;

  const applyFiles = async (incoming: FileList | File[] | null) => {
    if (!incoming?.length || !ready || mediaBusyRef.current || publishBusyRef.current) return;
    const remaining = Math.max(0, 6 - existingMedia.length - files.length);
    if (!remaining) {
      setError("You can attach up to 6 photos or videos.");
      return;
    }
    const allowed = Array.from(incoming);
    if (allowed.some(file => !["image/jpeg", "image/png", "image/webp", "video/mp4"].includes(file.type))) {
      setError("Choose a JPG, PNG, WEBP, or MP4 file.");
      return;
    }
    if (allowed.length > remaining) {
      setError(`You can add ${remaining} more ${remaining === 1 ? "file" : "files"}. Remove some files and try again.`);
      return;
    }
    mediaBusyRef.current = true;
    setPreparingMedia(true);
    try {
      setError("");
      const prepared = await preparePostFiles(allowed);
      if (latest.current.formKey !== formKey) return;
      setFiles((current) => [...current, ...prepared].slice(0, 6 - existingMedia.length));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add media.");
    } finally {
      mediaBusyRef.current = false;
      setPreparingMedia(false);
    }
  };

  const firstName = liveUser?.firstName || user?.firstName || "there";
  const selectedPrivacy = PRIVACY_OPTIONS.find((item) => item.id === privacy) || PRIVACY_OPTIONS[0];
  const canPost = Boolean(heading.trim() || caption.trim() || files.length || existingMedia.length);

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
    const prefix = caption.slice(0, cursor).replace(/@([A-Za-z0-9_.]*)$/, `@${friend.username} `);
    const replaced = prefix + caption.slice(cursor);
    setCaption(replaced);
    setCursor(prefix.length);
    setMentionDismissed(true);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(prefix.length, prefix.length);
    });
    if (!tagged.some((item) => item.id === friend.id)) {
      setTagged((prev) => [...prev, friend]);
    }
  }

  async function handlePost() {
    if (!canPost || !ready || mediaBusyRef.current || publishBusyRef.current) return;
    publishBusyRef.current = true;
    setSubmitting(true);
    setPublishFailed(false);
    setError("");
    let result: PostItem;
    try {
      const payload = {
        heading: heading.trim(),
        body: caption,
        privacy,
        location,
        feeling,
        mentionIds: tagged.map((item) => item.id),
        files,
      };
      if (editId) {
        result = await updatePost(editId, {
          ...payload,
          keepMediaIds: existingMedia.map((item) => item.id),
        });
      } else {
        result = await createPost(payload);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : editId ? "Unable to update post." : "Unable to create post.");
      setSubmitting(false);
      setPublishFailed(true);
      publishBusyRef.current = false;
      return;
    }
    // Cleanup failure must never turn an already-published post into a retry.
    submittedRef.current = true;
    let cleanupFailed = false;
    if (!editId && user) {
      await saveQueue.current.catch(() => undefined);
      await removePostDraft(user.id).catch(() => { cleanupFailed = true; });
    }
    announcePostSuccess(cleanupFailed
      ? "Post published. Your saved draft couldn't be cleared on this device."
      : editId ? "Post updated successfully." : "Post published successfully.");
    if (editId) onUpdated?.(result);
    else onCreated?.(result);
    if (isModal) onClose?.();
    else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div
      ref={viewportRef}
      className={
        isModal
          ? "fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4 chat-fade-in"
          : "flex h-full min-h-0 flex-col items-stretch gap-2 px-0 pb-2 pt-2 sm:flex-row sm:items-start sm:gap-3 sm:px-2"
      }
      onClick={
        isModal
          ? (e) => {
              if (e.target === e.currentTarget) void requestClose();
            }
          : undefined
      }
    >
      {!isModal ? (
        <button
          type="button"
          onClick={() => void requestClose()}
          disabled={submitting || preparingMedia}
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
        </button>
      ) : null}

      <div ref={panelRef} role={isModal ? "dialog" : undefined} aria-modal={isModal || undefined} aria-labelledby="post-composer-title"
        onKeyDown={event => {
          if (!isModal || sheet || cropTarget || event.key !== "Tab") return;
          const targets = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled):not([type="hidden"]), textarea:not(:disabled), a[href]'))
            .filter(element => element.getClientRects().length && element.tabIndex >= 0 && !element.closest("fieldset:disabled"));
          const first = targets[0];
          const last = targets[targets.length - 1];
          if (!first) { event.preventDefault(); return; }
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}
        className={`w-full min-w-0 max-w-[680px] min-h-0 flex flex-col gap-3 ${isModal ? "bg-white rounded-[20px] shadow-2xl p-3 sm:p-5 max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh] overflow-hidden relative" : "h-full"}`}>
        {isModal ? (
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 id="post-composer-title" className={`${sourceSerif.className} text-[20px] sm:text-[22px] font-bold text-[#0B1C30]`}>
                {editId ? "Edit Post" : "Create Post"}
              </h2>
              <p className="text-[12px] sm:text-[13px] text-[#6B7280]">
                {editId ? "Update your post and media" : "Share a moment with your network"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void requestClose()}
              disabled={submitting || preparingMedia}
              aria-label="Close"
              className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
            >
              <span className="text-[18px] leading-none">✕</span>
            </button>
          </div>
        ) : (
          <header className="shrink-0">
            <h1
              id="post-composer-title"
              className={`${sourceSerif.className} text-[24px] font-bold leading-8 tracking-[-0.32px] text-[#0B1C30] sm:text-[32px] sm:leading-[40px]`}
            >
              {editId ? "Edit Post" : "Create New Post"}
            </h1>
            <p className={`${sourceSerif.className} mt-1 text-[16px] leading-6 text-[#3C494A]`}>
              {editId ? "Update your post, photos, and caption." : "Share a moment with your network."}
            </p>
          </header>
        )}

        <section aria-busy={submitting || preparingMedia || !ready} className="flex min-h-0 w-full flex-col bg-white rounded-xl border border-[rgba(211,228,254,0.3)] shadow-[0px_10px_20px_0px_rgba(86,94,116,0.08)] overflow-hidden">
          <div className="min-h-0 overflow-y-auto overscroll-contain">
          <fieldset disabled={!ready || submitting || preparingMedia} className="flex min-w-0 flex-col gap-4 p-4 [&>*]:shrink-0 disabled:opacity-70 sm:gap-5 sm:p-6">
            {!ready && !loadFailed ? <p role="status" className="text-sm text-[#6B7280]">{editId ? "Loading your post…" : "Checking for a saved draft…"}</p> : null}
            {draftNotice.startsWith("Draft restored") ? <p role="status" className="rounded-lg bg-[#EFF4FF] px-3 py-2 text-[13px] text-[#00696F]">{files.length ? draftNotice : "Your saved draft is ready to continue."}</p> : null}
            <div className="flex items-center gap-3">
              <UserAvatar
                avatarUrl={liveUser?.avatar || user?.avatar}
                name={user ? displayName(user) : "User"}
                size={48}
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <h2 className="text-[14px] font-semibold leading-5 tracking-[0.14px] text-[#0B1C30]">
                  {user ? displayName(user) : "You"}
                  {feeling ? <span className="font-normal text-[#3C494A]"> is feeling {feeling}</span> : null}
                </h2>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPrivacyOpen((open) => !open)}
                      aria-expanded={privacyOpen}
                      aria-label={`Post audience: ${selectedPrivacy.label}`}
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
                  <div className={`${showDetails || location ? "flex" : "hidden"} items-center gap-1 bg-[#EFF4FF] border border-[rgba(211,228,254,0.5)] rounded-[6px] px-[9px] py-[5px] text-[12px] font-semibold leading-4 tracking-[0.24px] text-[#3C494A]`}>
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
                    className={`${showDetails || feeling ? "flex" : "hidden"} items-center gap-1 bg-[#EFF4FF] border border-[rgba(211,228,254,0.5)] rounded-[6px] px-[9px] py-[5px] text-[12px] font-semibold leading-4 tracking-[0.24px] text-[#3C494A]`}
                  >
                    <FigmaIcon src="/figma/icons/feeling.svg" alt="" width={13} height={13} />
                    {feeling || "Feeling"}
                  </button>
                  <button type="button" onClick={() => setShowDetails(value => !value)} aria-expanded={showDetails} className="min-h-9 px-2 text-xs font-medium text-[#00696F]">
                    {showDetails ? "Fewer options" : "More options"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-[#6B7280]">{selectedPrivacy.hint}</p>
              </div>
            </div>

            <div className="relative flex flex-col gap-3">
              {showHeading ? <input
                aria-label="Post heading (optional)"
                value={heading}
                maxLength={120}
                onChange={(event) => setHeading(event.target.value)}
                placeholder="Heading (optional)"
                className={`${sourceSerif.className} w-full bg-transparent text-[22px] font-bold leading-7 text-[#0B1C30] placeholder:font-semibold placeholder:text-[rgba(60,73,74,0.45)] focus:outline-none`}
              /> : <button type="button" onClick={() => setShowHeading(true)} className="w-fit text-[13px] font-medium text-[#00696F] hover:underline">+ Add a heading</button>}
              <textarea
                aria-label="Post text"
                ref={textareaRef}
                value={caption}
                onChange={(event) => { setCaption(event.target.value); setCursor(event.target.selectionStart); setMentionDismissed(false); }}
                onSelect={(event) => setCursor(event.currentTarget.selectionStart)}
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

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                void applyFiles(event.dataTransfer.files);
              }}
              className={`relative w-full rounded-lg bg-[#EFF4FF] border-2 border-dashed border-[#BBC9CA] overflow-hidden ${
                isDragging ? "ring-2 ring-[#00696F]/30" : ""
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4"
                multiple
                className="hidden"
                onChange={(event) => {
                  void applyFiles(event.target.files);
                  event.target.value = "";
                }}
              />

              {existingMedia.length || files.length ? (
                <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
                  {existingMedia.map((item) => (
                    <div key={item.id} className="relative aspect-[4/5] overflow-hidden rounded-[10px] bg-black">
                      {item.type === "video" ? (
                        <video src={item.url} className="size-full object-contain bg-black" muted />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCropTarget({ kind: "existing", id: item.id, src: item.url })}
                          className="size-full"
                          aria-label="Crop photo"
                        >
                          <img src={item.url} alt="" className="size-full object-contain" />
                        </button>
                      )}
                      {item.type !== "video" ? (
                        <span className="pointer-events-none absolute left-2 bottom-2 rounded-[6px] bg-black/55 px-2 py-0.5 text-[11px] text-white">
                          Crop
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setExistingMedia((current) => current.filter((media) => media.id !== item.id))}
                        className="absolute top-2 right-2 size-7 rounded-full bg-black/60 text-white text-[16px] leading-none"
                        aria-label="Remove media"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {files.map((file, index) => (
                    <div key={`${file.name}-${file.lastModified}-${index}`} className="relative aspect-[4/5] overflow-hidden rounded-[10px] bg-black">
                      <AttachedMediaPreview file={file} onCrop={src => setCropTarget({ kind: "file", index, src, name: file.name })} />
                      <span className="pointer-events-none absolute left-2 bottom-2 rounded-[6px] bg-black/55 px-2 py-0.5 text-[11px] text-white">
                        {file.type.startsWith("video/") ? formatFileSize(file.size) : `Crop · ${formatFileSize(file.size)}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                        className="absolute top-2 right-2 size-7 rounded-full bg-black/60 text-white text-[16px] leading-none"
                        aria-label="Remove media"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {existingMedia.length + files.length < 6 ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-[4/5] rounded-[10px] border border-dashed border-[#BBC9CA] text-[13px] font-medium text-[#00696F]"
                    >
                      Add media
                    </button>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full min-h-28 items-center justify-center gap-3 p-4 text-left"
                >
                  <div className="size-11 shrink-0 rounded-full bg-[rgba(0,105,111,0.1)] flex items-center justify-center">
                    <FigmaIcon src="/figma/icons/cloud-upload.svg" alt="" width={28} height={20} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span
                      className={`${sourceSerif.className} text-[14px] font-bold leading-5 tracking-[0.14px] text-[#0B1C30]`}
                    >
                      Add photos or a video
                    </span>
                    <span className="text-[12px] leading-5 text-[#6B7280]">
                      JPG, PNG, WEBP or MP4 · Up to 6 files, 50MB each
                    </span>
                  </div>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
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
          </fieldset>
          </div>

          {error ? (
            <p role="alert" className="shrink-0 px-4 pb-2 text-[13px] text-red-600 sm:px-6">{error}{publishFailed ? <span className="block">Your content is still here. Try posting again.</span> : null}</p>
          ) : null}
          {draftError ? <p role="alert" className="shrink-0 px-4 pb-2 text-[13px] text-red-600 sm:px-6">{draftError}</p> : null}
          {loadFailed ? <button type="button" onClick={() => setLoadAttempt(value => value + 1)} className="mx-4 mb-3 w-fit min-h-10 text-sm font-semibold text-[#00696F]">Try loading again</button> : null}

          <div className="shrink-0 bg-[#F5F8FC] border-t border-[rgba(211,228,254,0.5)] flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
            <p role="status" aria-live="polite" className="min-w-0 basis-full text-[12px] text-[#6B7280] sm:basis-auto sm:flex-1">
              {submitting ? (files.length ? "Uploading media and publishing… Keep this window open." : editId ? "Saving your changes…" : "Publishing your post…")
                : preparingMedia ? "Preparing your media…"
                : editId ? (unsaved ? "Changes haven't been saved yet." : "Update your post, then save changes.")
                : draftError ? "Draft not saved."
                : unsaved ? "Saving draft…"
                : draftNotice || "Drafts save automatically on this device."}
            </p>
            <button
              type="button"
              onClick={() => void persistDraft()}
              disabled={!ready || submitting || preparingMedia}
              className={`min-h-11 rounded-lg px-3 text-[13px] font-semibold text-[#3C494A] hover:bg-white disabled:opacity-50 ${editId ? "hidden" : ""}`}
            >
              {draftError ? "Retry draft save" : "Save draft"}
            </button>
            <button
              type="button"
              disabled={!ready || !canPost || submitting || preparingMedia}
              onClick={() => void handlePost()}
              className="ml-auto flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#00696F] px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#00585D] disabled:opacity-50"
            >
              {submitting ? (editId ? "Saving…" : "Posting…") : publishFailed ? "Try again" : editId ? "Save changes" : "Post"}
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
      {cropTarget ? (
        <ImageCropEditor
          src={cropTarget.src}
          fileName={cropTarget.kind === "file" ? cropTarget.name : "photo.jpg"}
          onClose={() => setCropTarget(null)}
          onApply={(file) => {
            if (cropTarget.kind === "file") {
              setFiles((current) => current.map((item, index) => (index === cropTarget.index ? file : item)));
            } else {
              setExistingMedia((current) => current.filter((item) => item.id !== cropTarget.id));
              setFiles((current) => [...current, file]);
            }
            setCropTarget(null);
          }}
        />
      ) : null}
    </div>
  );
}
