"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link"; // <-- 1. Link import kiya
import { Plus, ChevronRight } from "lucide-react";

const STORIES = [
  { name: "John", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200", avatar: "https://i.pravatar.cc/150?img=11" },
  { name: "Emma", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200", avatar: "https://i.pravatar.cc/150?img=32" },
  { name: "Michael", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200", avatar: "https://i.pravatar.cc/150?img=52" },
  { name: "Sophia", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200", avatar: "https://i.pravatar.cc/150?img=25" },
  { name: "Sophia", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200", avatar: "https://i.pravatar.cc/150?img=25" },
  { name: "Sophia", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200", avatar: "https://i.pravatar.cc/150?img=25" },
];

export default function StoriesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 240, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full bg-white rounded-[16px] p-4 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-[#0B1C30] text-base">Stories</h3>
        <button className="text-xs font-semibold text-[#00696F] hover:underline">See All</button>
      </div>

      <div className="relative w-full">
        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto no-scrollbar pb-1 scroll-smooth"
        >
          {/* 2. Div ki jagah Link tag laga diya aur href="/create-story" add kar diya */}
          <Link 
            href="/create-story" 
            className="relative w-[112px] h-[160px] rounded-[12px] bg-[#FAF5FF] border border-[#F3E8FF] flex flex-col items-center justify-between p-3 shrink-0 cursor-pointer group hover:bg-[#F3E8FF] transition-colors"
          >
            <div className="w-full h-[85px] rounded-[8px] bg-white flex items-center justify-center shadow-sm">
              <div className="w-9 h-9 rounded-full bg-[#00696F] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plus size={20} />
              </div>
            </div>
            <span className="text-xs font-bold text-[#0B1C30] text-center">Create Story</span>
          </Link>

          {/* Friends Stories */}
          {STORIES.map((story, index) => (
            <div key={index} className="relative w-[112px] h-[160px] rounded-[12px] overflow-hidden shrink-0 cursor-pointer group">
              <Image
                src={story.img}
                alt={story.name}
                fill
                sizes="120px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
              
              {/* User Avatar */}
              <div className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full border-2 border-[#00696F] overflow-hidden">
                <Image 
                  src={story.avatar} 
                  alt={story.name} 
                  fill 
                  sizes="40px"
                  className="object-cover" 
                />
              </div>

              {/* Name */}
              <span className="absolute bottom-2.5 left-2.5 text-xs font-bold text-white drop-shadow">
                {story.name}
              </span>
            </div>
          ))}
        </div>

        {/* Scroll Arrow Button */}
        <button 
          onClick={scrollRight}
          aria-label="Scroll Right"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)] z-10 text-[#65676B] hover:bg-gray-50 transition-colors"
        >
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>

      </div>
    </div>
  );
}