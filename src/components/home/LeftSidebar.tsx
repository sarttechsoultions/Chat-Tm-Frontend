"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { displayName, getStoredUser, logoutRequest } from "../../lib/auth";

const MENU_ITEMS = [
  { label: "Home", icon: "/figma/icons/home.svg", href: "/" },
  { label: "Friends", icon: "/figma/icons/friends.svg", href: "/friends" },
  { label: "Groups", icon: "/figma/icons/groups.svg", href: "/groups" },
  { label: "Watch", icon: "/figma/icons/watch.svg", href: "/watch" },
  { label: "Memories", icon: "/figma/icons/memories.svg", href: "/memories" },
  { label: "Saved", icon: "/figma/icons/saved.svg", href: "/saved" },
  { label: "Events", icon: "/figma/icons/events.svg", href: "/events" },
  { label: "Refer & Earn", icon: "/figma/icons/refer.svg", href: "/refer" },
  { label: "Ad Manager", icon: "/figma/icons/ads.svg", href: "/ads" },
  { label: "Pages", icon: "/figma/icons/pages.svg", href: "/pages" },
  { label: "My Wallet", icon: "/figma/icons/wallet.svg", href: "/wallet" },
];

function isMenuActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
const BOTTOM_MENU_ITEMS = [
  { label: "Settings", icon: "/figma/icons/settings.svg", href: "/settings" },
  { label: "Help & Support", icon: "/figma/icons/help.svg", href: "/support" },
];

export default function LeftSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState("ChatTm User");
  const [handle, setHandle] = useState("@user");
  const [avatar, setAvatar] = useState("/figma/photos/rahul.png");

  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    setName(displayName(user));
    setHandle(`@${user.username}`);
    if (user.avatar) setAvatar(user.avatar);
  }, []);

  return (
    <aside className="w-full flex flex-col gap-6 p-[10px] bg-white rounded-[10px] shadow-[0px_4px_2px_rgba(0,0,0,0.25)] font-sans select-none">
   <div className="relative w-full shrink-0 rounded-[16px] bg-[#117378] p-6 flex flex-col items-center overflow-hidden shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]">
        <div className="pointer-events-none absolute bg-white blur-[20px] opacity-10 right-[-64px] rounded-full size-[128px] top-[-64px]" />

        <div className="relative z-10 mb-3 shrink-0">
          <div className="relative size-[80px] rounded-full overflow-hidden border-4 border-white/30">
            <Image
              src={avatar}
              alt={name}
              width={80}
              height={80}
              className="size-full object-cover"
            />
          </div>
          <span className="absolute bottom-1 right-1 size-4 bg-[#22C55E] border-2 border-white rounded-full" />
        </div>

        <div className="flex items-center gap-1.5">
          <h2 className="text-[18px] font-bold leading-[28px] text-white">{name}</h2>
          <span className="relative size-[14px] overflow-clip shrink-0">
            <img src="/figma/icons/verified-white.svg" alt="" width={14} height={14} className="size-full object-contain" />
          </span>
        </div>
        <p className="text-[14px] leading-[20px] text-[#DBEAFE] mb-4">{handle}</p>

        <div className="w-full backdrop-blur-[6px] bg-white/20 border border-white/20 rounded-[12px] px-[13px] py-[9px] flex items-center gap-2 mb-2">
          <span className="relative size-[14px] overflow-clip shrink-0">
            <img src="/figma/icons/clock.svg" alt="" width={14} height={14} className="size-full object-contain" />
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-[0.5px] uppercase text-white/80 leading-[10px]">
              Verification Status
            </span>
            <span className="text-[12px] font-bold text-white leading-[16px]">
              Verification Pending
            </span>
          </div>
        </div>
        <p className="text-[10px] leading-[15px] text-[#DBEAFE] text-center mb-4 opacity-80">
          KYC is currently under review
        </p>

        <div className="w-full grid grid-cols-3 text-center border-t border-white/20 pt-[17px]">
          <div>
            <div className="text-[18px] font-bold leading-[28px] text-white">120</div>
            <div className="text-[12px] leading-[16px] text-[#DBEAFE]">Friends</div>
          </div>
          <div>
            <div className="text-[18px] font-bold leading-[28px] text-white">53</div>
            <div className="text-[12px] leading-[16px] text-[#DBEAFE]">Posts</div>
          </div>
          <div>
            <div className="text-[18px] font-bold leading-[28px] text-white">28</div>
            <div className="text-[12px] leading-[16px] text-[#DBEAFE]">Groups</div>
          </div>
        </div>
      </div>

      <nav className="bg-white rounded-[16px] p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col gap-1">
        {MENU_ITEMS.map(({ label, icon, href }) => {
          const active = isMenuActive(pathname, href);
          return (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-[12px] transition-all text-[16px] ${
              active
                ? "bg-[rgba(0,105,111,0.2)] text-[#00696F] font-semibold"
                : "text-[#4B5563] font-medium hover:bg-gray-50"
            }`}
          >
            <span className="relative w-5 h-5 overflow-clip shrink-0">
              <img src={icon} alt="" width={20} height={20} className="size-full object-contain" />
            </span>
            <span>{label}</span>
          </Link>
          );
        })}

        <div className="h-[24px]" />

        {BOTTOM_MENU_ITEMS.map(({ label, icon, href }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-[#4B5563] font-medium text-[16px] hover:bg-gray-50 transition-all"
          >
            <span className="relative w-5 h-5 overflow-clip shrink-0">
              <img src={icon} alt="" width={20} height={20} className="size-full object-contain" />
            </span>
            <span>{label}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={async () => {
            await logoutRequest();
            router.replace("/login");
            router.refresh();
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-[#4B5563] font-medium text-[16px] hover:bg-gray-50 transition-all"
        >
          <span className="relative w-5 h-5 overflow-clip shrink-0">
            <img src="/figma/icons/logout.svg" alt="" width={20} height={20} className="size-full object-contain" />
          </span>
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
}
