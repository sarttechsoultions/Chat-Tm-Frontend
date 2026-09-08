"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FigmaIcon from "../home/FigmaIcon";
import { UserAvatar } from "../ui/UserAvatar";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { createPost, type PostItem } from "../../lib/api/posts";
import { formatFileSize, preparePostFiles } from "../../lib/media";
import { EmojiSheet, FeelingPicker } from "../posts/PostExtras";
import ImageCropEditor from "../posts/ImageCropEditor";

const ACTIONS = [
  { id: "media" as const, label: "Photo/Video", icon: "/figma/icons/photo.svg", size: { w: 18, h: 16 } },
  { id: "feeling" as const, label: "Feeling", icon: "/figma/icons/feeling.svg", size: { w: 18, h: 18 } },
  { id: "emoji" as const, label: "Emoji", icon: "/figma/icons/add-emoji.svg", size: { w: 18, h: 18 } },
];

export default function GroupPostComposer({
  groupId,
  groupName,
  onCreated,
}: {
  groupId: string;
  groupName: string;
  onCreated: (post: PostItem) => void;
}) {
  const currentUser = useCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [heading, setHeading] = useState("");
  const [body, setBody] = useState("");
  const [feeling, setFeeling] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sheet, setSheet] = useState<"feeling" | "emoji" | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [cropIndex, setCropIndex] = useState<number | null>(null);

  const previews = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        type: file.type.startsWith("video/") ? "video" : "image",
        url: URL.createObjectURL(file),
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previews]);

  const canPost = Boolean(heading.trim() || body.trim() || files.length) && !posting;

  async function applyFiles(incoming: FileList | File[] | null) {
    if (!incoming?.length) return;
    const remaining = Math.max(0, 6 - files.length);
    if (!remaining) {
      setError("You can attach up to 6 photos or videos.");
      return;
    }
    const allowed = Array.from(incoming).filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/"),
    );
    if (!allowed.length) {
      setError("Choose a JPG, PNG, WEBP, or MP4 file.");
      return;
    }
    try {
      const prepared = await preparePostFiles(allowed.slice(0, remaining));
      setError("");
      const startIndex = files.length;
      setFiles((current) => [...current, ...prepared].slice(0, 6));
      setExpanded(true);
      const firstImage = prepared.findIndex(
        (file) => file.type.startsWith("image/") && file.type !== "image/gif",
      );
      if (firstImage >= 0) setCropIndex(startIndex + firstImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add media.");
    }
  }

  function insertEmoji(emoji: string) {
    const el = bodyRef.current;
    if (!el) {
      setBody((prev) => prev + emoji);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = `${body.slice(0, start)}${emoji}${body.slice(end)}`;
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function reset() {
    setHeading("");
    setBody("");
    setFeeling("");
    setFiles([]);
    setExpanded(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handlePost() {
    if (!canPost) return;
    setPosting(true);
    setError("");
    try {
      const post = await createPost({
        heading: heading.trim(),
        body: body.trim(),
        feeling,
        groupId,
        files,
      });
      reset();
      onCreated(post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create post.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="rounded-[16px] bg-white p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
      <div className="flex items-start gap-3">
        <UserAvatar
          avatarUrl={currentUser?.avatar}
          name={currentUser?.firstName}
          size={40}
        />
        <div className="min-w-0 flex-1">
          {expanded ? (
            <div className="flex flex-col gap-3">
              <input
                value={heading}
                maxLength={120}
                onChange={(event) => setHeading(event.target.value)}
                placeholder="Add a heading"
                className="h-11 w-full rounded-[12px] bg-[#F9FAFB] px-4 text-[16px] font-bold text-[#111827] outline-none placeholder:font-semibold placeholder:text-[#9CA3AF] focus:ring-[3px] focus:ring-[#00696F]/12"
              />
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={`What's on your mind in ${groupName}?`}
                className="min-h-[88px] w-full resize-none rounded-[12px] bg-[#F9FAFB] px-4 py-3 text-[14px] leading-6 text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:ring-[3px] focus:ring-[#00696F]/12"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="h-11 w-full rounded-full bg-[#F9FAFB] px-4 text-left text-[14px] text-[#6B7280]"
            >
              Write something in {groupName}...
            </button>
          )}
        </div>
      </div>

      {feeling ? (
        <button
          type="button"
          onClick={() => setFeeling("")}
          className="mt-3 rounded-full bg-[#EFF4FF] px-3 py-1 text-[12px] font-semibold text-[#00696F]"
        >
          feeling {feeling} ×
        </button>
      ) : null}

      {previews.length ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {previews.map((item, index) => (
            <div key={item.url} className="relative aspect-[4/5] overflow-hidden rounded-[12px] bg-black">
              {item.type === "video" ? (
                <video src={item.url} className="size-full object-contain bg-black" muted />
              ) : (
                <button
                  type="button"
                  className="size-full"
                  aria-label="Crop photo"
                  onClick={() => setCropIndex(index)}
                >
                  <img src={item.url} alt="" className="size-full object-cover" />
                </button>
              )}
              <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-[6px] bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
                {item.type === "video"
                  ? formatFileSize(files[index]?.size || 0)
                  : `Crop · ${formatFileSize(files[index]?.size || 0)}`}
              </span>
              <button
                type="button"
                aria-label="Remove file"
                onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/55 text-[12px] text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
        multiple
        className="hidden"
        onChange={(event) => {
          void applyFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {error ? (
        <p role="alert" className="mt-3 rounded-[8px] bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#F3F4F6] pt-3">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => {
                setExpanded(true);
                if (action.id === "media") fileInputRef.current?.click();
                if (action.id === "feeling") setSheet("feeling");
                if (action.id === "emoji") setSheet("emoji");
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-[12px] font-medium text-[#4B5563] hover:bg-gray-50 sm:px-3 sm:text-[13px]"
            >
              <FigmaIcon src={action.icon} alt="" width={action.size.w} height={action.size.h} />
              {action.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={!canPost}
          onClick={() => void handlePost()}
          className="shrink-0 rounded-full bg-[#00696F] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50"
        >
          {posting ? "Posting…" : "Post"}
        </button>
      </div>

      {sheet === "feeling" ? (
        <FeelingPicker onSelect={setFeeling} onClose={() => setSheet(null)} />
      ) : null}
      {sheet === "emoji" ? (
        <EmojiSheet
          onSelect={(emoji) => {
            setExpanded(true);
            insertEmoji(emoji);
          }}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {cropIndex !== null && previews[cropIndex] && !files[cropIndex]?.type.startsWith("video/") ? (
        <ImageCropEditor
          src={previews[cropIndex].url}
          fileName={files[cropIndex]?.name || "photo.jpg"}
          onClose={() => setCropIndex(null)}
          onApply={(file) => {
            setFiles((current) => current.map((item, index) => (index === cropIndex ? file : item)));
            setCropIndex(null);
          }}
        />
      ) : null}
    </div>
  );
}
