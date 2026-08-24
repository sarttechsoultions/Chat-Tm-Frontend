"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  CloudUpload,
  FileText,
  Flag,
  FolderKanban,
  Images,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquare,
  Monitor,
  Settings,
  Shield,
  ShieldCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { displayName, getStoredUser, logoutRequest, meRequest } from "../../lib/auth";
import { UserAvatar } from "../ui/UserAvatar";

export const ADMIN_NAV = [
  {
    heading: null as string | null,
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    heading: "Management",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/posts", label: "Posts", icon: FileText },
      { href: "/admin/stories", label: "Stories", icon: Images },
      { href: "/admin/groups", label: "Groups", icon: UsersRound },
      { href: "/admin/pages", label: "Pages", icon: FolderKanban },
      { href: "/admin/events", label: "Events", icon: CalendarDays },
    ],
  },
  {
    heading: "Content & Moderation",
    items: [
      { href: "/admin/comments", label: "Comments", icon: MessageSquare },
      { href: "/admin/reports", label: "Reports & Flags", icon: Flag },
      { href: "/admin/moderation", label: "Moderation", icon: Shield },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  {
    heading: "System & Settings",
    items: [
      { href: "/admin/roles", label: "Roles & Permissions", icon: KeyRound },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/security", label: "Security", icon: ShieldCheck },
      { href: "/admin/logs", label: "System Logs", icon: Monitor },
      { href: "/admin/backup", label: "Backup", icon: CloudUpload },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[260px] h-full shrink-0 bg-[#FDFDFD] border-r border-[#F0F0F0] flex flex-col shadow-[2px_0_12px_rgba(0,0,0,0.02)] z-10 overflow-hidden">
      <div className="px-5 py-6 shrink-0 flex items-center justify-center border-b border-[#F0F0F0]/50 mb-2">
        <Link href="/admin" className="relative block h-10 w-[148px] overflow-clip hover:opacity-90 transition-opacity">
          <Image
            src="/ChatTmLogo.png"
            alt="ChatTm"
            fill
            sizes="148px"
            className="object-contain"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 px-3 pb-6 flex flex-col gap-6 overflow-y-auto no-scrollbar">
        {ADMIN_NAV.map((group, groupIdx) => (
          <div key={group.heading ?? `group-${groupIdx}`} className="flex flex-col gap-1">
            {group.heading ? (
              <p className="px-3 pt-2 pb-2 text-[10px] font-bold tracking-[1.5px] uppercase text-[#9AA4B2] select-none">
                {group.heading}
              </p>
            ) : null}
            <div className="flex flex-col gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3.5 h-[42px] px-3.5 rounded-[12px] text-[14px] leading-5 transition-all duration-200 overflow-hidden ${
                      active
                        ? "bg-gradient-to-r from-[#00696F] to-[#008A91] text-white shadow-md shadow-[#00696F]/25 font-semibold"
                        : "text-[#4B5563] font-medium hover:bg-[#F2F6F6] hover:text-[#00696F]"
                    }`}
                  >
                    {active ? (
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    ) : null}
                    
                    <div className={`transition-transform duration-300 ${!active && "group-hover:scale-110"}`}>
                      <Icon className={`size-[18px] shrink-0 ${active ? "text-white" : "text-[#7B8A99] group-hover:text-[#00696F]"}`} />
                    </div>
                    <span className="truncate z-10">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-[#F0F0F0]/80 shrink-0 bg-[#FDFDFD]">
        <button
          type="button"
          onClick={async () => {
            await logoutRequest();
            window.location.href = "/admin/login";
          }}
          className="group w-full flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-semibold text-[#6B7280] bg-[#F3F4F6] hover:bg-[#FFEDED] hover:text-[#EF4444] transition-colors"
        >
          <LogOut className="size-[18px] transition-transform group-hover:-translate-x-0.5" />
          Log Out
        </button>
      </div>
    </aside>
  );
}

export function AdminHeader() {
  const [name, setName] = useState(() => {
    const user = getStoredUser();
    return user ? displayName(user) : "Admin";
  });
  const [avatar, setAvatar] = useState(() => getStoredUser()?.avatar || "");

  useEffect(() => {
    meRequest().then(latest => {
      setName(displayName(latest));
      setAvatar(latest.avatar || "");
    }).catch(() => {});
  }, []);

  return (
    <header className="h-[72px] shrink-0 bg-white border-b border-[#F0F0F0] px-8 flex items-center gap-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] z-10 relative">
      <label className="flex-1 max-w-[500px] h-10 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-4 flex items-center gap-3 transition-colors focus-within:border-[#00696F] focus-within:bg-white shadow-inner shadow-black/5">
        <span className="inline-flex size-[18px] overflow-clip shrink-0">
          <img
            src="/figma/icons/search.svg"
            alt=""
            width={18}
            height={18}
            className="size-full object-contain opacity-60"
          />
        </span>
        <input
          type="search"
          placeholder="Search users, posts, groups..."
          className="flex-1 bg-transparent text-[14px] leading-5 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
        />
      </label>

      <div className="ml-auto flex items-center gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="relative size-10 rounded-full flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
        >
          <Bell className="size-[22px]" />
          <span className="absolute top-2 right-2.5 size-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
        </button>
        <div className="h-[42px] pl-2 pr-4 rounded-full border border-[#E5E7EB] bg-white flex items-center gap-3 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
          <UserAvatar avatarUrl={avatar} name={name} size={32} />
          <div className="flex flex-col justify-center">
            <p className="text-[13px] font-bold leading-4 text-[#111827]">{name}</p>
            <p className="text-[11px] leading-4 text-[#00696F] font-semibold">Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
