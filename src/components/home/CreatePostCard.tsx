"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { meRequest } from "../../lib/auth";
import { UserAvatar } from "../ui/UserAvatar";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function CreatePostCard() {
  const router = useRouter();
  const openCreatePost = () => router.push("/create-post");
  const user = useCurrentUser();
  const firstName = user?.firstName || "User";
  const avatar = user?.avatar || "";

  useEffect(() => {
    void meRequest().catch(() => undefined);
  }, []);

  return (
    <div className="w-full bg-white rounded-[16px] p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <UserAvatar avatarUrl={avatar} name={firstName} size={40} />
        <button
          type="button"
          onClick={openCreatePost}
          className="w-full bg-[#F9FAFB] rounded-full px-4 py-[13px] flex items-center text-left"
        >
          <span className="truncate text-[14px] text-[#6B7280] sm:text-[16px]">
            Create something amazing, {firstName}!
          </span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar border-t border-[#F3F4F6] px-0 pt-[17px] sm:px-2">
        <button
          type="button"
          onClick={openCreatePost}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-[12px] font-medium text-[#4B5563] transition-colors hover:bg-gray-50 sm:gap-2 sm:px-3 sm:text-[14px]"
        >
          <span className="relative h-[16px] w-[18px] overflow-clip">
            <img src="/figma/icons/photo.svg" alt="" width={18} height={16} className="size-full object-contain" />
          </span>
          <span className="sm:hidden">Photo</span>
          <span className="hidden sm:inline">Photo/Video</span>
        </button>

        <button type="button" className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-[12px] font-medium text-[#4B5563] transition-colors hover:bg-gray-50 sm:gap-2 sm:px-3 sm:text-[14px]">
          <span className="relative h-[14px] w-[20px] overflow-clip">
            <img src="/figma/icons/live.svg" alt="" width={20} height={14} className="size-full object-contain" />
          </span>
          Live
        </button>

        <button
          type="button"
          onClick={openCreatePost}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-[12px] font-medium text-[#4B5563] transition-colors hover:bg-gray-50 sm:gap-2 sm:px-3 sm:text-[14px]"
        >
          <span className="relative size-[18px] overflow-clip">
            <img src="/figma/icons/feeling.svg" alt="" width={18} height={18} className="size-full object-contain" />
          </span>
          <span className="sm:hidden">Feeling</span>
          <span className="hidden sm:inline">Feeling/Activity</span>
        </button>

        <button type="button" className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] sm:flex">
          <span className="relative h-[4px] w-[14px] overflow-clip">
            <img src="/figma/icons/more-h.svg" alt="" width={14} height={4} className="size-full object-contain" />
          </span>
        </button>
      </div>
    </div>
  );
}