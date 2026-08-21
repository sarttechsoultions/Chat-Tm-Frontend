"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CreatePostCard() {
  const router = useRouter();
  const openCreatePost = () => router.push("/create-post");

  return (
    <div className="w-full bg-white rounded-[16px] p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative size-10 rounded-full overflow-hidden shrink-0">
          <Image
            src="/figma/photos/user.png"
            alt="Rahul Sharma"
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
        <button
          type="button"
          onClick={openCreatePost}
          className="w-full bg-[#F9FAFB] rounded-full px-4 py-[13px] flex items-center text-left"
        >
          <span className="text-[16px] text-[#6B7280]">Create something amazing, Rahul!</span>
        </button>
      </div>

      <div className="border-t border-[#F3F4F6] flex items-center justify-between pt-[17px] px-2">
        <button
          type="button"
          onClick={openCreatePost}
          className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors text-[14px] font-medium text-[#4B5563]"
        >
          <span className="relative w-[18px] h-[16px] overflow-clip">
            <img src="/figma/icons/photo.svg" alt="" width={18} height={16} className="size-full object-contain" />
          </span>
          Photo/Video
        </button>

        <button type="button" className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors text-[14px] font-medium text-[#4B5563]">
          <span className="relative w-[20px] h-[14px] overflow-clip">
            <img src="/figma/icons/live.svg" alt="" width={20} height={14} className="size-full object-contain" />
          </span>
          Live Video
        </button>

        <button type="button" className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors text-[14px] font-medium text-[#4B5563]">
          <span className="relative size-[18px] overflow-clip">
            <img src="/figma/icons/feeling.svg" alt="" width={18} height={18} className="size-full object-contain" />
          </span>
          Feeling/Activity
        </button>

        <button type="button" className="size-8 rounded-full bg-[#F3F4F6] flex items-center justify-center">
          <span className="relative w-[14px] h-[4px] overflow-clip">
            <img src="/figma/icons/more-h.svg" alt="" width={14} height={4} className="size-full object-contain" />
          </span>
        </button>
      </div>
    </div>
  );
}