import React from "react";
import Image from "next/image";
import { MoreHorizontal, ThumbsUp, MessageSquare, Share2, CheckCircle2 } from "lucide-react";

interface PostCardProps {
  author?: {
    name?: string;
    avatar?: string;
    time?: string;
    isVerified?: boolean;
    follow?: boolean;
  };
  content?: string;
  image?: string;
  likes?: string;
  comments?: string;
  shares?: string;
}

export default function PostCard({ author, content, image, likes, comments, shares }: PostCardProps) {
  // Safe fallbacks agar koi prop miss ho jaye
  const authorName = author?.name || "User";
  const authorAvatar = author?.avatar || "https://i.pravatar.cc/150?img=13";
  const postTime = author?.time || "Just now";

  return (
    <div className="w-full bg-white rounded-[16px] p-4 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] flex flex-col gap-4">
      
      {/* Post Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden">
            <Image
              src={authorAvatar}
              alt={authorName}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h4 className="font-bold text-sm text-[#0B1C30]">{authorName}</h4>
              {author?.isVerified && (
                <CheckCircle2 size={14} className="text-[#1877F2]" fill="#1877F2" stroke="white" />
              )}
              {author?.follow && (
                <span className="text-xs font-semibold text-[#00696F] ml-1 cursor-pointer hover:underline">Follow</span>
              )}
            </div>
            <p className="text-xs text-[#65676B]">{postTime} • 🌐</p>
          </div>
        </div>
        <button className="text-[#65676B] hover:bg-gray-100 p-2 rounded-full transition-colors">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Post Caption */}
      <p className="text-sm text-[#1F2937] whitespace-pre-line">
        {content}
      </p>

      {/* Post Image (Conditional) */}
      {image && (
        <div className="relative w-full h-[320px] rounded-[12px] overflow-hidden">
          <Image
            src={image}
            alt="Post media"
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Post Stats */}
      <div className="flex items-center justify-between text-xs text-[#65676B] border-b border-gray-100 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[10px]">👍</span>
          <span>{likes || "0"}</span>
        </div>
        <div className="flex gap-3">
          <span>{comments || "0"} Comments</span>
          <span>{shares || "0"} Shares</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-1 pt-1">
        <button className="flex items-center justify-center gap-2 hover:bg-gray-100 py-2 rounded-lg text-sm font-semibold text-[#65676B] transition-colors">
          <ThumbsUp size={18} />
          <span>Like</span>
        </button>
        <button className="flex items-center justify-center gap-2 hover:bg-gray-100 py-2 rounded-lg text-sm font-semibold text-[#65676B] transition-colors">
          <MessageSquare size={18} />
          <span>Comment</span>
        </button>
        <button className="flex items-center justify-center gap-2 hover:bg-gray-100 py-2 rounded-lg text-sm font-semibold text-[#65676B] transition-colors">
          <Share2 size={18} />
          <span>Share</span>
        </button>
      </div>

    </div>
  );
}