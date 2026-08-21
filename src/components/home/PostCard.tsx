import React from "react";
import Image from "next/image";

interface PostCardProps {
  author?: {
    name?: string;
    avatar?: string;
    time?: string;
    isVerified?: boolean;
    follow?: boolean;
    privacyIcon?: string;
  };
  content?: string;
  image?: string;
  imageCount?: string;
  likes?: string;
  comments?: string;
  shares?: string;
  liked?: boolean;
  reactions?: string[];
}

function renderCaption(content: string) {
  const parts = content.split(/(#[A-Za-z0-9_]+)/g);
  return parts.map((part, index) =>
    part.startsWith("#") ? (
      <span key={index} className="text-[#00696F] font-medium">
        {part}
      </span>
    ) : (
      part
    )
  );
}

export default function PostCard({
  author,
  content,
  image,
  imageCount,
  likes,
  comments,
  shares,
  liked,
  reactions = ["/figma/photos/like.png", "/figma/photos/heart.png"],
}: PostCardProps) {
  const authorName = author?.name || "User";
  const authorAvatar = author?.avatar || "/figma/photos/rahul.png";
  const postTime = author?.time || "Just now";

  return (
    <div className="w-full bg-white rounded-[16px] p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative size-10 rounded-full overflow-hidden shrink-0">
            <Image src={authorAvatar} alt={authorName} fill sizes="40px" className="object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h4 className="font-bold text-[16px] leading-6 text-[#111827]">{authorName}</h4>
              {author?.isVerified && (
                <span className="relative size-[14px] overflow-clip shrink-0">
                  <img src="/figma/icons/verified.svg" alt="" width={14} height={14} className="size-full object-contain" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[12px] text-[#6B7280] leading-4">
              <span>{postTime} •</span>
              <span className="relative size-3 overflow-clip">
                <img
                  src={author?.privacyIcon || "/figma/icons/globe.svg"}
                  alt=""
                  width={12}
                  height={12}
                  className="size-full object-contain"
                />
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {author?.follow && (
            <button className="px-3 py-1 rounded-lg text-[14px] font-semibold text-[#00696F]">
              Follow
            </button>
          )}
          <button className="size-8 rounded-full flex items-center justify-center">
            <span className="relative w-[4px] h-[14px] overflow-clip">
              <img src="/figma/icons/more-v.svg" alt="" width={4} height={14} className="size-full object-contain" />
            </span>
          </button>
        </div>
      </div>

      {content && (
        <p className="text-[14px] leading-5 text-[#1F2937] whitespace-pre-line pt-1">
          {renderCaption(content)}
        </p>
      )}

      {image && (
        <div className="relative w-full overflow-hidden rounded-[12px]">
          <div className="relative w-full aspect-[572/312] max-h-[400px]">
            <Image src={image} alt="Post media" fill sizes="740px" className="object-cover" />
          </div>
          {imageCount && (
            <div className="absolute top-4 right-3 backdrop-blur-[2px] bg-black/50 text-white text-[12px] leading-4 px-2 py-1 rounded-[6px]">
              {imageCount}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-b border-[#F3F4F6] py-2">
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            {reactions.map((src, index) => (
              <span
                key={src}
                className={`relative size-5 rounded-full overflow-hidden border border-white ${index > 0 ? "-ml-1" : ""}`}
              >
                <img src={src} alt="" width={20} height={20} className="size-full object-cover" />
              </span>
            ))}
          </div>
          <span className="text-[14px] font-medium text-[#6B7280] pl-1">{likes || "0"}</span>
        </div>
        <div className="flex items-center gap-4 text-[14px] text-[#6B7280]">
          <span>{comments || "0"} Comments</span>
          <span>{shares || "0"} Shares</span>
          {image && (
            <span className="flex items-center gap-1 cursor-pointer">
              <span className="relative w-[11px] h-[14px] overflow-clip">
                <img src="/figma/icons/save.svg" alt="" width={11} height={14} className="size-full object-contain" />
              </span>
              Save
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] ${liked ? "font-semibold text-[#00696F]" : "font-medium text-[#4B5563]"}`}>
          <span className="relative w-[14px] h-[12px] overflow-clip">
            <img src="/figma/icons/like.svg" alt="" width={14} height={12} className="size-full object-contain" />
          </span>
          Like
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-medium text-[#4B5563]">
          <span className="relative w-[14px] h-[14px] overflow-clip">
            <img src="/figma/icons/comment.svg" alt="" width={14} height={14} className="size-full object-contain" />
          </span>
          Comment
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-medium text-[#4B5563]">
          <span className="relative w-[14px] h-[12px] overflow-clip">
            <img src="/figma/icons/share.svg" alt="" width={14} height={12} className="size-full object-contain" />
          </span>
          Share
        </button>
      </div>
    </div>
  );
}
