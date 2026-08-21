"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FigmaIcon from "../home/FigmaIcon";

type StoryTab = "photo" | "text";

type BackgroundOption = {
  id: string;
  style?: React.CSSProperties;
  image?: string;
};

const BACKGROUNDS: BackgroundOption[] = [
  { id: "blue", style: { backgroundImage: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)" } },
  { id: "teal", style: { backgroundColor: "#00696F" } },
  { id: "orange", style: { backgroundImage: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" } },
  { id: "red", style: { backgroundImage: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)" } },
  { id: "green", style: { backgroundImage: "linear-gradient(135deg, #10B981 0%, #059669 100%)" } },
  { id: "purple", style: { backgroundImage: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" } },
  { id: "gray", style: { backgroundImage: "linear-gradient(135deg, #6B7280 0%, #4B5563 100%)" } },
  { id: "teal-2", style: { backgroundColor: "#00696F" } },
  { id: "pink", style: { backgroundImage: "linear-gradient(to right, #F9A8D4, #D8B4FE)" } },
  { id: "lime", style: { backgroundImage: "linear-gradient(to right, #FEF08A, #BBF7D0)" } },
  { id: "dark", style: { backgroundImage: "linear-gradient(to right, #374151, #111827)" } },
  { id: "pattern-1", image: "/figma/icons/story-pattern-1.svg" },
  { id: "pattern-2", image: "/figma/icons/story-pattern-2.svg" },
  { id: "pattern-3", image: "/figma/icons/story-pattern-3.svg" },
];

function WelcomeRow() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg w-full">
      <div className="relative size-10 rounded-full overflow-hidden shrink-0">
        <Image
          src="/figma/photos/story-user.png"
          alt="User"
          fill
          sizes="40px"
          className="object-cover"
        />
      </div>
      <div className="flex flex-col">
        <span className="text-[14px] font-semibold leading-5 tracking-[0.14px] text-[#0B1C30]">
          Welcome back
        </span>
        <span className="text-[12px] font-semibold leading-4 tracking-[0.24px] text-[#565E74]">
          Active Now
        </span>
      </div>
    </div>
  );
}

function ShareActions() {
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => router.push("/")}
        className="w-full bg-[#00696F] hover:bg-[#00585D] text-white py-4 rounded-lg text-[14px] font-semibold leading-5 tracking-[0.14px] flex items-center justify-center gap-2 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] transition-colors"
      >
        <FigmaIcon src="/figma/icons/share-play.svg" alt="" width={11} height={9} />
        Share to Story
      </button>
      <button
        type="button"
        onClick={() => router.back()}
        className="w-full border border-[#BBC9CA] rounded-lg py-[17px] text-[14px] font-semibold leading-5 tracking-[0.14px] text-[#565E74] hover:bg-gray-50 transition-colors"
      >
        Discard
      </button>
    </>
  );
}

export default function CreateStoryUI() {
  const [activeTab, setActiveTab] = useState<StoryTab>("photo");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [overlayText, setOverlayText] = useState("Morning vibes! ☕️");
  const [showOverlay, setShowOverlay] = useState(true);
  const [selectedBgId, setSelectedBgId] = useState("salmon");
  const [canvasStyle, setCanvasStyle] = useState<React.CSSProperties>({
    backgroundColor: "#D65454",
  });

  const isPhotoEditor = activeTab === "photo" && Boolean(previewUrl);
  const isTextEditor = activeTab === "text";
  const showTools = isPhotoEditor || isTextEditor;

  const applyFile = (file?: File) => {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl("/figma/photos/story-preview.png");
    }
    setActiveTab("photo");
  };

  const selectBackground = (option: BackgroundOption) => {
    setSelectedBgId(option.id);
    if (option.image) {
      setCanvasStyle({
        backgroundImage: `url(${option.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      });
      return;
    }
    setCanvasStyle(option.style ?? { backgroundColor: "#D65454" });
  };

  return (
    <div className="flex h-full w-full items-start gap-6">
      <aside className="hidden lg:flex w-[290px] h-full shrink-0 overflow-y-auto no-scrollbar pb-6">
        <div className="w-full h-fit min-h-full p-2.5 bg-white rounded-[10px] shadow-[0px_4px_2px_rgba(0,0,0,0.25)]">
          <div className="w-full bg-white rounded-2xl p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col gap-5">
            <WelcomeRow />

            {isPhotoEditor ? (
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setShowOverlay(true)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left"
                >
                  <span className="size-7 rounded-full bg-[rgba(0,105,111,0.1)] flex items-center justify-center shrink-0">
                    <FigmaIcon src="/figma/icons/add-text.svg" alt="" width={10} height={12} />
                  </span>
                  <span className="text-[16px] font-medium leading-6 text-[#00696F]">Add text</span>
                </button>
                <button type="button" className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left">
                  <span className="relative size-7 overflow-clip shrink-0">
                    <img src="/figma/icons/add-music.svg" alt="" width={28} height={28} className="size-full object-contain" />
                  </span>
                  <span className="text-[16px] font-medium leading-6 text-[#4B5563]">Add music</span>
                </button>
                <button type="button" className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left">
                  <span className="relative size-7 overflow-clip shrink-0">
                    <img src="/figma/icons/add-time.svg" alt="" width={28} height={28} className="size-full object-contain" />
                  </span>
                  <span className="text-[16px] font-medium leading-6 text-[#00696F]">Add time</span>
                </button>
              </div>
            ) : null}

            {isTextEditor ? (
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  className="h-12 w-full border border-[#D1D5DB] rounded-lg px-[13px] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FigmaIcon src="/figma/icons/font-clean.svg" alt="" width={12} height={12} />
                    <span className="text-[15px] leading-[22.5px] text-[#111827]">Clean</span>
                  </span>
                  <FigmaIcon src="/figma/icons/font-chevron.svg" alt="" width={12} height={7} />
                </button>

                <div className="border border-[#D1D5DB] rounded-lg p-4 flex flex-col gap-1">
                  <span className="text-[14px] font-medium leading-5 text-[#6B7280]">Backgrounds</span>
                  <span className="text-[13px] leading-[19.5px] text-[#9CA3AF]">Gradient</span>
                  <div className="flex flex-wrap gap-x-3 gap-y-3.5 pt-3">
                    {BACKGROUNDS.map((option) => {
                      const selected = selectedBgId === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          aria-label={`Background ${option.id}`}
                          onClick={() => selectBackground(option)}
                          className={`relative size-7 shrink-0 rounded-full overflow-hidden ${
                            selected ? "ring-2 ring-[#3B82F6] ring-offset-2 ring-offset-white" : ""
                          }`}
                          style={option.image ? undefined : option.style}
                        >
                          {option.image ? (
                            <img src={option.image} alt="" width={28} height={28} className="size-full object-cover" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-center pt-2">
                    <FigmaIcon src="/figma/icons/backgrounds-more.svg" alt="" width={8} height={5} />
                  </div>
                </div>

                <button type="button" className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left">
                  <span className="relative size-7 overflow-clip shrink-0">
                    <img src="/figma/icons/add-music.svg" alt="" width={28} height={28} className="size-full object-contain" />
                  </span>
                  <span className="text-[16px] font-medium leading-6 text-[#4B5563]">Add music</span>
                </button>
              </div>
            ) : null}

            {showTools ? <ShareActions /> : null}
          </div>
        </div>
      </aside>

      <div className="flex-1 h-full min-w-0">
        {!showTools ? (
          <div className="flex items-start gap-3 pt-2.5">
            <Link
              href="/"
              aria-label="Go back"
              className="size-10 rounded-full flex items-center justify-center shrink-0 hover:bg-[#EFF4FF] transition-colors"
            >
              <FigmaIcon src="/figma/icons/back-arrow.svg" alt="" width={16} height={16} />
            </Link>

            <div className="w-full max-w-[742px] flex flex-col">
              <h1 className="text-[32px] font-bold leading-10 tracking-[-0.32px] text-[#0B1C30] pb-10">
                Create Story
              </h1>

              <div className="bg-[#D3E4FE] p-1 rounded-lg flex items-center mb-10">
                <button
                  type="button"
                  onClick={() => setActiveTab("photo")}
                  className="flex-1 py-2 rounded-md bg-white text-[#00696F] text-[14px] font-semibold leading-5 tracking-[0.14px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                >
                  Photo/Video
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("text")}
                  className="flex-1 py-2 rounded-md text-[#565E74] text-[14px] font-semibold leading-5 tracking-[0.14px]"
                >
                  Text
                </button>
              </div>

              <button
                type="button"
                onClick={() => applyFile()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  applyFile(event.dataTransfer.files[0]);
                }}
                className="w-full max-w-[695px] border border-dashed border-[#BBC9CA] rounded-xl py-6 px-8 flex flex-col items-center justify-center gap-2.5"
              >
                <span className="relative size-10 overflow-clip">
                  <img
                    src="/figma/icons/story-upload.svg"
                    alt=""
                    width={40}
                    height={40}
                    className="size-full object-contain"
                  />
                </span>
                <span className="text-[14px] font-semibold leading-5 tracking-[0.14px] text-[#0B1C30]">
                  Click to upload media
                </span>
                <span className="text-[12px] font-semibold leading-4 tracking-[0.24px] text-[#565E74]">
                  or drag and drop here
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {isPhotoEditor ? (
          <div className="flex items-center justify-center min-h-full pt-3">
            <div className="relative w-full max-w-[407px] h-[637px] overflow-hidden bg-[#D3E4FE]">
              <Image
                src={previewUrl!}
                alt="Story preview"
                fill
                sizes="407px"
                className="object-cover"
                unoptimized={previewUrl!.startsWith("blob:")}
                priority
              />
              {showOverlay ? (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="-rotate-2">
                    <div className="backdrop-blur-[2px] bg-black/20 border border-white/20 rounded-xl p-[13px]">
                      <input
                        value={overlayText}
                        onChange={(event) => setOverlayText(event.target.value)}
                        className="bg-transparent text-white text-[24px] font-bold leading-8 text-center drop-shadow-[0px_4px_1.5px_rgba(0,0,0,0.1)] focus:outline-none w-[224px]"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
              <button
                type="button"
                className="absolute top-4 right-4 backdrop-blur-[6px] bg-white/20 border border-white/30 rounded-full px-[13px] py-[5px] flex items-center gap-1"
              >
                <FigmaIcon src="/figma/icons/add-music-pill.svg" alt="" width={7} height={11} />
                <span className="text-[12px] font-semibold leading-4 tracking-[0.24px] text-white">
                  Add Music
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {isTextEditor ? (
          <div className="flex items-center justify-center min-h-full pt-12">
            <div
              className="relative w-full max-w-[407px] h-[637px] rounded-xl overflow-hidden flex items-center justify-center"
              style={canvasStyle}
            >
              <textarea
                className="w-[80%] bg-transparent text-white text-center text-[24px] font-bold leading-8 placeholder-white/70 resize-none focus:outline-none"
                placeholder="Start typing..."
                rows={4}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
