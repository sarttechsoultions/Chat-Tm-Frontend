"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import FigmaIcon from "./FigmaIcon";

const NAV_ICONS = [
  { label: "Home", icon: "/figma/icons/nav-home.svg", href: "/" },
  { label: "Friends", icon: "/figma/icons/nav-friends.svg", href: "/friends" },
  { label: "Groups", icon: "/figma/icons/nav-groups.svg", href: "/groups" },
  { label: "Marketplace", icon: "/figma/icons/nav-marketplace.svg", href: "/marketplace" },
  { label: "Watch", icon: "/figma/icons/nav-watch.svg", href: "/watch" },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full h-[50px] bg-white shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] flex items-center">
      <div className="max-w-[1440px] w-full mx-auto px-[24px] lg:px-[80px] flex items-center justify-between h-full gap-2">
        <div className="flex items-center gap-3 lg:gap-6 flex-1">
          <Link href="/" className="relative w-[66px] h-[40px] shrink-0 overflow-clip">
            <Image
              src="/figma/photos/logo.png"
              alt="Chattm"
              fill
              sizes="66px"
              className="object-contain object-left"
              priority
            />
          </Link>

          <div className="hidden sm:flex h-9 w-[180px] lg:w-[220px] items-center gap-2 rounded-[8px] bg-[#F3F4F6] px-3 shrink-0">
            <FigmaIcon src="/figma/icons/search.svg" alt="" width={13} height={12} />
            <input
              type="text"
              placeholder="Search ChatTm"
              className="w-full bg-transparent border-none text-[12px] lg:text-[14px] text-[#3C494A] placeholder-[#3C494A] focus:outline-none"
            />
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center gap-8 lg:gap-16 h-full shrink-0">
          {NAV_ICONS.map(({ label, icon, href }) => {
            const active = isNavActive(pathname, href);
            return (
              <Link
                key={label}
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className="flex items-center justify-center h-full"
              >
                <span
                  className="relative size-[20px] overflow-clip shrink-0"
                  style={{
                    backgroundColor: active ? "#00696F" : "#4B5563",
                    WebkitMaskImage: `url(${icon})`,
                    maskImage: `url(${icon})`,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                  }}
                />
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3 lg:gap-[20px] flex-1 justify-end shrink-0">
          <button type="button" aria-label="Notifications" className="relative size-[30px] overflow-clip shrink-0">
            <img src="/figma/icons/bell.svg" alt="" width={30} height={30} className="size-full object-contain" />
          </button>
          <Link href="/messenger" aria-label="Messenger" className="relative size-[30px] overflow-clip shrink-0">
            <img src="/figma/icons/messenger.svg" alt="" width={30} height={30} className="size-full object-contain" />
          </Link>
          <div className="relative size-[30px] overflow-hidden rounded-full shrink-0">
            <Image
              src="/figma/photos/nav-avatar.png"
              alt="Rahul Sharma"
              fill
              sizes="30px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
