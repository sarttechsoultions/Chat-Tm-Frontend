"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Source_Serif_4 } from "next/font/google";
import FigmaIcon from "../home/FigmaIcon";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const ATTACHMENTS = [
  {
    label: "Add media",
    icon: "/figma/icons/add-media.svg",
    iconSize: { width: 18, height: 18 },
    className: "bg-[rgba(0,105,111,0.1)]",
  },
  {
    label: "Tag friends",
    icon: "/figma/icons/tag-friends.svg",
    iconSize: { width: 22, height: 16 },
    className: "bg-[rgba(233,30,99,0.1)]",
  },
  {
    label: "Add location",
    icon: "/figma/icons/add-location.svg",
    iconSize: { width: 16, height: 20 },
    className: "bg-[rgba(124,88,0,0.1)]",
  },
  {
    label: "Add emoji",
    icon: "/figma/icons/add-emoji.svg",
    iconSize: { width: 20, height: 20 },
    className: "bg-[rgba(254,183,0,0.1)]",
  },
] as const;

export default function CreatePostPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const applyFile = (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

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
              <div className="relative size-12 rounded-full overflow-hidden shrink-0 border border-[#D3E4FE]">
                <Image
                  src="/figma/photos/sarah.png"
                  alt="Sarah Jenkins"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <h2 className="text-[14px] font-semibold leading-5 tracking-[0.14px] text-[#0B1C30]">
                  Sarah Jenkins
                </h2>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    className="flex items-center gap-1 bg-[#EFF4FF] border border-[rgba(211,228,254,0.5)] rounded-[6px] px-[9px] py-[5px] text-[12px] font-semibold leading-4 tracking-[0.24px] text-[#3C494A]"
                  >
                    <FigmaIcon src="/figma/icons/privacy-globe.svg" alt="" width={13} height={13} />
                    Public
                    <FigmaIcon src="/figma/icons/chevron-down.svg" alt="" width={7} height={3} />
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1 bg-[#EFF4FF] border border-[rgba(211,228,254,0.5)] rounded-[6px] px-[9px] py-[5px] text-[12px] font-semibold leading-4 tracking-[0.24px] text-[#3C494A]"
                  >
                    <FigmaIcon src="/figma/icons/map-pin.svg" alt="" width={11} height={13} />
                    Select Area
                    <FigmaIcon src="/figma/icons/chevron-down.svg" alt="" width={7} height={3} />
                  </button>
                </div>
              </div>
            </div>

            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="What's on your mind, Sarah?"
              className={`${sourceSerif.className} w-full min-h-[120px] resize-none bg-transparent text-[18px] leading-7 text-[#0B1C30] placeholder:text-[rgba(60,73,74,0.5)] focus:outline-none`}
            />

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
                applyFile(event.dataTransfer.files[0]);
              }}
              className={`relative w-full h-64 rounded-lg bg-[#EFF4FF] border-2 border-dashed border-[#BBC9CA] flex flex-col items-center justify-center overflow-hidden ${
                isDragging ? "ring-2 ring-[#00696F]/30" : ""
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,video/mp4"
                className="hidden"
                onChange={(event) => applyFile(event.target.files?.[0])}
              />

              {previewUrl ? (
                <img src={previewUrl} alt="Selected media" className="absolute inset-0 size-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-3 p-4">
                  <div className="size-16 rounded-full bg-[rgba(0,105,111,0.1)] flex items-center justify-center">
                    <FigmaIcon src="/figma/icons/cloud-upload.svg" alt="" width={28} height={20} />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`${sourceSerif.className} text-[14px] font-bold leading-5 tracking-[0.14px] text-[#0B1C30]`}
                    >
                      {fileName ?? "Click or drag media here"}
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
                    key={item.label}
                    type="button"
                    aria-label={item.label}
                    onClick={() => {
                      if (item.label === "Add media") fileInputRef.current?.click();
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

          <div className="bg-[#E5EEFF] border-t border-[rgba(211,228,254,0.3)] flex items-center justify-end gap-3 px-6 pt-[25px] pb-6">
            <button
              type="button"
              className={`${sourceSerif.className} px-6 py-2.5 rounded-lg text-[14px] font-bold leading-5 tracking-[0.14px] text-[#3C494A] hover:bg-white/50 transition-colors`}
            >
              Save Draft
            </button>
            <button
              type="button"
              className={`${sourceSerif.className} bg-[#00696F] hover:bg-[#00585D] text-white px-8 py-2.5 rounded-lg text-[14px] font-bold leading-5 tracking-[0.14px] flex items-center gap-2 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] transition-colors`}
            >
              Post
              <FigmaIcon src="/figma/icons/send-post.svg" alt="" width={14} height={12} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
