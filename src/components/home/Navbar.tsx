"use client";

import React from "react";
import Image from "next/image";
import { Search, MessageCircle } from "lucide-react"; 

const NAV_ICONS = [
  { label: "Home", icon: "/nav/home.png", active: true },
  { label: "Friends", icon: "/nav/friends.png", active: false },
  { label: "Groups", icon: "/nav/groups.png", active: false },
//   { label: "Marketplace", icon: "/nav/marketplace.png", active: false },
  { label: "Watch", icon: "/nav/watch.png", active: false },
] as const;

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full h-[60px] bg-white shadow-[0px_1px_4px_rgba(0,0,0,0.1)] flex items-center">
      <div className="max-w-[1440px] w-full mx-auto px-4 flex items-center justify-between h-full gap-2">
        
        {/* Left Section: Logo & Search */}
        <div className="flex items-center gap-2 lg:gap-3 flex-1">
          
          {/* Logo Image - Fixed container height, CSS zoom applied */}
          <div className="relative w-[130px] lg:w-[150px] h-[54px] cursor-pointer flex items-center shrink-0">
            <Image 
              src="/chattm-logo.png" 
              alt="ChatTm Logo" 
              fill 
              // scale-[2] ya scale-[2.5] image ko transparent space ke andar bada kar dega
              className="object-contain object-left scale-[2] origin-left" 
              priority
            />
          </div>

          {/* Search Pill - Tablet pe chota aur Desktop pe bada */}
       <div className="hidden sm:flex h-[40px] w-[180px] lg:w-[240px] items-center gap-2 rounded-full bg-[#F0F2F5] px-4 shrink-0">
  <Search className="h-[18px] w-[18px] shrink-0 text-[#65676B]" strokeWidth={2} />
  <input 
    type="text" 
    placeholder="Search ChatTm"
    className="w-full bg-transparent border-none text-[14px] lg:text-[15px] text-[#0B1C30] placeholder-[#65676B] focus:outline-none"
  />
</div>
        </div>

        {/* Center Section: PNG Navigation Icons */}
        <div className="hidden md:flex items-center justify-center gap-1 lg:gap-8 h-full shrink-0">
          {NAV_ICONS.map(({ label, icon, active }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              className={`flex items-center justify-center w-[50px] lg:w-[100px] h-[48px] rounded-lg transition-colors ${
                active ? "hover:bg-transparent" : "hover:bg-[#F0F2F5]"
              }`}
            >
              <div className={`relative w-[24px] h-[24px] lg:w-[26px] lg:h-[26px] transition-opacity ${active ? "opacity-100" : "opacity-60"}`}>
                <Image
                  src={icon}
                  alt={label}
                  fill
                  className="object-contain"
                />
              </div>
            </button>
          ))}
        </div>

        {/* Right Section: Actions & Avatar */}
        <div className="flex items-center gap-2 lg:gap-3 flex-1 justify-end shrink-0">
          
          {/* Notification Bell (PNG) */}
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-[36px] w-[36px] lg:h-10 lg:w-10 items-center justify-center rounded-full bg-[#E4E6EB] hover:bg-[#D8DADF] transition-colors shrink-0"
          >
            <div className="relative w-[18px] h-[18px] lg:w-[20px] lg:h-[20px]">
              <Image
                src="/nav/bell.png"
                alt="Notifications"
                fill
                className="object-contain"
              />
            </div>
          </button>

          {/* Messenger Bubble */}
          <button
            type="button"
            aria-label="Messenger"
            className="flex h-[36px] w-[36px] lg:h-10 lg:w-10 items-center justify-center rounded-full bg-[#E4E6EB] hover:bg-[#D8DADF] transition-colors text-[#0B1C30] shrink-0"
          >
            <MessageCircle size={20} fill="#0B1C30" strokeWidth={0} className="lg:w-[22px] lg:h-[22px]" />
          </button>

          {/* User Profile Avatar */}
          <div className="relative h-[36px] w-[36px] lg:h-10 lg:w-10 overflow-hidden rounded-full cursor-pointer ml-1 border border-gray-200 hover:brightness-95 transition-all shrink-0">
            <Image
              src="https://i.pravatar.cc/150?img=13"
              alt="Rahul Sharma"
              fill
              className="object-cover"
            />
          </div>
        </div>

      </div>
    </header>
  );
}