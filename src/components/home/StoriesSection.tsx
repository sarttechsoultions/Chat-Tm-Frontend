"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const STORIES = [
  { name: "John", img: "/figma/photos/john-story.png", avatar: "/figma/photos/john.png" },
  { name: "Emma", img: "/figma/photos/emma-story.png", avatar: "/figma/photos/emma.png" },
  { name: "Michael", img: "/figma/photos/michael-story.png", avatar: "/figma/photos/michael.png" },
  { name: "Sophia", img: "/figma/photos/sophia-story.png", avatar: "/figma/photos/sophia.png" },
];

export default function StoriesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 240, behavior: "smooth" });
  };

  return (
    <div className="w-full bg-white rounded-[16px] p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] relative flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[#111827] text-[16px] leading-6">Stories</h3>
        <button className="text-[14px] font-semibold text-[#00696F] hover:underline">See All</button>
      </div>

      <div className="relative w-full">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto no-scrollbar h-[168px] scroll-smooth"
        >
          <Link
            href="/create-story"
            className="relative w-[112px] h-[160px] rounded-[12px] bg-[#FAF5FF] border border-[#F3E8FF] flex flex-col items-center justify-center shrink-0 cursor-pointer group hover:bg-[#F3E8FF] transition-colors"
          >
            <div className="size-10 rounded-full bg-[#00696F] text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <span className="text-[16px] font-black leading-4">+</span>
            </div>
            <span className="text-[12px] font-semibold text-[#1F2937] text-center leading-[15px]">
              Create
              <br />
              Story
            </span>
          </Link>

          {STORIES.map((story) => (
            <div
              key={story.name}
              className="relative w-[112px] h-[160px] rounded-[12px] overflow-hidden shrink-0 cursor-pointer group bg-[#1F2937]"
            >
              <Image
                src={story.img}
                alt={story.name}
                fill
                sizes="112px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute top-2 left-2 size-8 rounded-full border-2 border-[#00696F] overflow-hidden p-0.5">
                <div className="relative size-full rounded-full overflow-hidden">
                  <Image src={story.avatar} alt={story.name} fill sizes="24px" className="object-cover" />
                </div>
              </div>
              <span className="absolute bottom-2 left-2 text-[12px] font-medium text-white leading-4">
                {story.name}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={scrollRight}
          aria-label="Scroll Right"
          className="absolute right-2 top-1/2 -translate-y-1/2 size-8 bg-white rounded-full flex items-center justify-center shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] z-10"
        >
          <span className="relative w-[7px] h-[12px] overflow-clip">
            <img src="/figma/icons/arrow.svg" alt="" width={7} height={12} className="size-full object-contain" />
          </span>
        </button>
      </div>
    </div>
  );
}
