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
import { displayName, getStoredUser, logoutRequest } from "../../lib/auth";

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
    <aside className="w-[259px] h-full shrink-0 bg-white border-r border-[#BCC9C8] flex flex-col overflow-y-auto no-scrollbar">
      <div className="px-4 py-5 shrink-0">
        <Link href="/admin" className="relative block h-10 w-[148px] overflow-clip">
          <Image
            src="/ChatTmLogo.png"
            alt="ChatTm"
            fill
            sizes="148px"
            className="object-contain object-left"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 px-2.5 pb-4 flex flex-col gap-4">
        {ADMIN_NAV.map((group) => (
          <div key={group.heading ?? "dashboard"} className="flex flex-col gap-1">
            {group.heading ? (
              <p className="px-2.5 pt-1 pb-1 text-[11px] font-semibold tracking-[0.8px] uppercase text-[#9AA4B2]">
                {group.heading}
              </p>
            ) : null}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2.5 h-9 px-2.5 rounded-[8px] text-[14px] leading-5 transition-colors ${
                    active
                      ? "bg-[#E5F3F2] text-[#00696F] font-semibold"
                      : "text-[#4E616F] font-normal hover:bg-[#F5FAF9]"
                  }`}
                >
                  {active ? (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#00696F]" />
                  ) : null}
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-2.5 py-4 border-t border-[#E5E7EB] shrink-0">
        <button
          type="button"
          onClick={async () => {
            await logoutRequest();
            window.location.href = "/admin/login";
          }}
          className="w-full flex items-center gap-2.5 h-9 px-2.5 rounded-[8px] text-[14px] text-[#4E616F] hover:bg-[#F5FAF9]"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

export function AdminHeader() {
  const [name, setName] = useState("Admin");

  useEffect(() => {
    const user = getStoredUser();
    if (user) setName(displayName(user));
  }, []);

  return (
    <header className="h-[72px] shrink-0 bg-white border-b border-[#E5E7EB] px-6 flex items-center gap-4">
      <label className="flex-1 max-w-[640px] h-[38px] rounded-full border border-[#BCC9C8] bg-[#F5FAF9] px-4 flex items-center gap-3">
        <span className="inline-flex size-4 overflow-clip shrink-0">
          <img
            src="/figma/icons/search.svg"
            alt=""
            width={16}
            height={16}
            className="size-full object-contain"
          />
        </span>
        <input
          type="search"
          placeholder="Search users, posts, groups..."
          className="flex-1 bg-transparent text-[14px] leading-5 text-[#171D1C] placeholder:text-[#9AA4B2] focus:outline-none"
        />
      </label>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="relative size-9 rounded-full flex items-center justify-center text-[#4E616F] hover:bg-[#F5FAF9]"
        >
          <Bell className="size-5" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#EF4444]" />
        </button>
        <div className="h-9 pl-3 pr-3 rounded-[10px] border border-[#BCC9C8] flex items-center gap-3">
          <span className="relative size-8 rounded-full overflow-hidden shrink-0">
            <Image src="/figma/photos/rahul.png" alt="" fill sizes="32px" className="object-cover" />
          </span>
          <div>
            <p className="text-[13px] font-semibold leading-4 text-[#171D1C]">{name}</p>
            <p className="text-[11px] leading-4 text-[#6B7280]">Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
