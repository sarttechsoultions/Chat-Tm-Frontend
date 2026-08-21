"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Home,
  Users,
  UsersRound,
  Video,
  History,
  Bookmark,
  Calendar,
  Flag,
  Settings,
  HelpCircle,
  LogOut,
  Crown,
  CheckCircle2,
} from "lucide-react";

const MENU_ITEMS = [
  { label: "Home", icon: Home, href: "/", active: true },
  { label: "Friends", icon: Users, href: "/friends", active: false },
  { label: "Groups", icon: UsersRound, href: "/groups", active: false },
  { label: "Watch", icon: Video, href: "/watch", active: false },
  { label: "Memories", icon: History, href: "/memories", active: false },
  { label: "Saved", icon: Bookmark, href: "/saved", active: false },
  { label: "Events", icon: Calendar, href: "/events", active: false },
  { label: "Pages", icon: Flag, href: "/pages", active: false },
];

const BOTTOM_MENU_ITEMS = [
  { label: "Settings", icon: Settings, href: "/settings" },
  { label: "Help & Support", icon: HelpCircle, href: "/support" },
  { label: "Logout", icon: LogOut, href: "/logout" },
];

export default function LeftSidebar() {
  return (
    <aside className="w-[300px] flex flex-col p-[10px] bg-white font-sans select-none h-full overflow-y-auto no-scrollbar">
      
      {/* 1. Sticky User Profile Card */}
      <div className="sticky top-0 z-10 bg-white pb-3 pt-1">
        <div 
          className="w-full rounded-[16px] p-5 flex flex-col items-center text-white shadow-[0px_2px_4px_-2px_rgba(0,0,0,0.1),0px_4px_6px_-1px_rgba(0,0,0,0.1)]"
          style={{
            background: "linear-gradient(135deg, #4bacb1 50%, #227d81 100%)"
          }}
        >
          {/* Avatar with Online Badge */}
          <div className="relative w-[75px] h-[75px] rounded-full overflow-hidden mb-2.5 ring-4 ring-white/20">
            <Image
              src="https://i.pravatar.cc/150?img=13"
              alt="Rahul Sharma"
              fill
              className="object-cover"
            />
            <span className="absolute bottom-1 right-1 w-3 h-3 bg-[#2ECC71] border-2 border-white rounded-full" />
          </div>

          {/* Name with Blue Tick */}
          <div className="flex items-center gap-1.5">
            <h2 className="text-[17px] font-bold leading-[24px] text-white">Rahul Sharma</h2>
            <CheckCircle2 size={16} className="text-[#1877F2]" fill="#1877F2" stroke="white" />
          </div>
          
          <p className="text-[13px] font-normal leading-[18px] text-white/80 mb-3">@rahulsharma</p>

          {/* Verification Status Card (Figma Match) */}
          <div className="w-full bg-white/15 border border-white/20 rounded-[12px] p-3 flex flex-col gap-1 mb-4 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <History size={15} className="text-yellow-300" />
              <span className="text-[10px] font-bold tracking-wider text-white/90 uppercase">VERIFICATION STATUS</span>
            </div>
            <div className="text-[13px] font-bold text-white">Verification Pending</div>
            <div className="text-[10px] font-normal text-[#DBEAFE] leading-[15px]">KYC is currently under review</div>
          </div>

          {/* Creator Level Badge */}
          <div className="flex items-center gap-1 bg-white/15 px-3 py-0.5 rounded-full text-xs font-semibold text-yellow-300 mb-4 backdrop-blur-sm">
            <Crown size={13} />
            Creator Level
          </div>

          {/* Stats Row */}
          <div className="w-full grid grid-cols-3 text-center border-t border-white/20 pt-3">
            <div>
              <div className="text-[16px] font-bold">120</div>
              <div className="text-[11px] text-white/70">Friends</div>
            </div>
            <div>
              <div className="text-[16px] font-bold">53</div>
              <div className="text-[11px] text-white/70">Posts</div>
            </div>
            <div>
              <div className="text-[16px] font-bold">28</div>
              <div className="text-[11px] text-white/70">Groups</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Links */}
      <nav className="flex flex-col gap-1 mt-2">
        {MENU_ITEMS.map(({ label, icon: Icon, href, active }) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-[12px] transition-all font-semibold text-[15px] ${
              active
                ? "bg-[#00696F]/20 text-[#00696F]"
                : "text-[#0B1C30] hover:bg-gray-100"
            }`}
          >
            <Icon 
              size={20} 
              className={active ? "text-[#00696F]" : "text-[#0B1C30]"} 
              strokeWidth={active ? 2.2 : 1.8}
            />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Divider */}
      <hr className="border-gray-200 my-3 mx-2" />

      {/* 3. Bottom Utility Links */}
      <nav className="flex flex-col gap-1 pb-4">
        {BOTTOM_MENU_ITEMS.map(({ label, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-[#0B1C30] font-semibold text-[15px] hover:bg-gray-100 transition-all"
          >
            <Icon size={20} className="text-[#0B1C30]" strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

    </aside>
  );
}