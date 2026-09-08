"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  Ban,
  BarChart3,
  Bell,
  CalendarDays,
  Flag,
  FolderKanban,
  Images,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  MessagesSquare,
  Monitor,
  Phone,
  Settings,
  Shield,
  ShieldCheck,
  Store,
  Users,
  UsersRound,
  Video,
  Wallet,
  FileText,
  Landmark,
  LineChart,
} from "lucide-react";
import { displayName, getStoredUser, logoutRequest, meRequest } from "../../lib/auth";
import { UserAvatar } from "../ui/UserAvatar";

export const ADMIN_NAV = [
  {
    heading: null as string | null,
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    heading: "Users",
    items: [
      { href: "/admin/users", label: "All Users", icon: Users },
      { href: "/admin/users/kyc", label: "KYC / Verification", icon: BadgeCheck },
      { href: "/admin/users/suspended", label: "Suspended Users", icon: Ban },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/admin/posts", label: "Posts", icon: FileText },
      { href: "/admin/stories", label: "Stories", icon: Images },
      { href: "/admin/videos", label: "Videos", icon: Video },
      { href: "/admin/comments", label: "Comments", icon: MessageSquare },
    ],
  },
  {
    heading: "Moderation",
    items: [
      { href: "/admin/reports", label: "Reports", icon: Flag },
      { href: "/admin/moderation", label: "Moderation Queue", icon: Shield },
      { href: "/admin/moderation/blocked", label: "Blocked Content", icon: Ban },
    ],
  },
  {
    heading: "Social",
    items: [
      { href: "/admin/groups", label: "Groups", icon: UsersRound },
      { href: "/admin/pages", label: "Pages", icon: FolderKanban },
      { href: "/admin/events", label: "Events", icon: CalendarDays },
    ],
  },
  {
    heading: "Messaging",
    items: [
      { href: "/admin/messaging/messages", label: "Reported Messages", icon: MessagesSquare },
      { href: "/admin/messaging/calls", label: "Calls", icon: Phone },
    ],
  },
  {
    heading: "Monetization",
    items: [
      { href: "/admin/ads", label: "Ads", icon: Megaphone },
      { href: "/admin/ads/advertisers", label: "Advertisers", icon: Users },
      { href: "/admin/marketplace", label: "Marketplace", icon: Store },
    ],
  },
  {
    heading: "Finance",
    items: [
      { href: "/admin/finance/wallets", label: "Wallets", icon: Wallet },
      { href: "/admin/finance/transactions", label: "Transactions", icon: Landmark },
      { href: "/admin/finance/bank", label: "Bank Verification", icon: BadgeCheck },
    ],
  },
  {
    heading: "Communication",
    items: [
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  {
    heading: "Analytics",
    items: [
      { href: "/admin/analytics/users", label: "User Analytics", icon: LineChart },
      { href: "/admin/analytics/content", label: "Content Analytics", icon: BarChart3 },
      { href: "/admin/analytics/safety", label: "Safety Analytics", icon: Shield },
      { href: "/admin/analytics/revenue", label: "Revenue Analytics", icon: Wallet },
    ],
  },
  {
    heading: "System",
    items: [
      { href: "/admin/roles", label: "Admins & Roles", icon: KeyRound },
      { href: "/admin/logs", label: "Audit Logs", icon: Monitor },
      { href: "/admin/settings", label: "Platform Settings", icon: Settings },
      { href: "/admin/security", label: "Security", icon: ShieldCheck },
    ],
  },
  {
    heading: "Support",
    items: [{ href: "/admin/support", label: "Tickets", icon: LifeBuoy }],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/users") {
    if (pathname === "/admin/users") return true;
    if (!pathname.startsWith("/admin/users/")) return false;
    const slug = pathname.slice("/admin/users/".length);
    return slug.length > 0 && slug !== "kyc" && slug !== "suspended" && !slug.includes("/");
  }
  return pathname === href;
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

      <nav className="flex-1 px-3 pb-6 flex flex-col gap-5 overflow-y-auto no-scrollbar">
        {ADMIN_NAV.map((group, groupIdx) => (
          <div key={group.heading ?? `group-${groupIdx}`} className="flex flex-col gap-1">
            {group.heading ? (
              <p className="px-3 pt-1 pb-1 text-[10px] font-bold tracking-[1.5px] uppercase text-[#9AA4B2] select-none">
                {group.heading}
              </p>
            ) : null}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3.5 h-[40px] px-3.5 rounded-[12px] text-[13px] leading-5 transition-all duration-200 overflow-hidden ${
                      active
                        ? "bg-gradient-to-r from-[#00696F] to-[#008A91] text-white shadow-md shadow-[#00696F]/25 font-semibold"
                        : "text-[#4B5563] font-medium hover:bg-[#F2F6F6] hover:text-[#00696F]"
                    }`}
                  >
                    <Icon className={`size-[17px] shrink-0 ${active ? "text-white" : "text-[#7B8A99] group-hover:text-[#00696F]"}`} />
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

export function AdminFrame({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#F5F7F7]">
      <div className="hidden h-full lg:flex">
        <AdminSidebar />
      </div>

      <div className={`fixed inset-0 z-40 lg:hidden ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <button
          type="button"
          aria-label="Close admin menu"
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity ${menuOpen ? "opacity-100" : "opacity-0"}`}
        />
        <div
          className={`absolute inset-y-0 left-0 h-full w-[min(86vw,260px)] bg-[#FDFDFD] shadow-[8px_0_24px_rgba(0,0,0,0.16)] transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {menuOpen ? <AdminSidebar /> : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onMenuClick={() => setMenuOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export function AdminHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const [name, setName] = useState(() => {
    const user = getStoredUser();
    return user ? displayName(user) : "Admin";
  });
  const [avatar, setAvatar] = useState(() => getStoredUser()?.avatar || "");

  useEffect(() => {
    meRequest()
      .then((latest) => {
        setName(displayName(latest));
        setAvatar(latest.avatar || "");
      })
      .catch(() => {});
  }, []);

  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center gap-3 border-b border-[#F0F0F0] bg-white px-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] sm:h-[72px] sm:gap-6 sm:px-8">
      {onMenuClick ? (
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open admin menu"
          className="flex size-10 items-center justify-center rounded-full hover:bg-[#F3F4F6] lg:hidden"
        >
          <Menu className="size-5 text-[#0B1C30]" />
        </button>
      ) : null}
      <label className="flex h-10 min-w-0 flex-1 max-w-[500px] items-center gap-3 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-3 shadow-inner shadow-black/5 transition-colors focus-within:border-[#00696F] focus-within:bg-white sm:px-4">
        <span className="inline-flex size-[18px] overflow-clip shrink-0">
          <img src="/figma/icons/search.svg" alt="" width={18} height={18} className="size-full object-contain opacity-60" />
        </span>
        <input
          type="search"
          placeholder="Search users, posts, groups..."
          className="flex-1 bg-transparent text-[14px] leading-5 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
        />
      </label>

      <div className="ml-auto flex items-center gap-4">
        <Link
          href="/admin/reports"
          aria-label="Open reports"
          className="relative size-10 rounded-full flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
        >
          <Bell className="size-[22px]" />
        </Link>
        <div className="hidden h-[42px] cursor-pointer items-center gap-3 rounded-full border border-[#E5E7EB] bg-white pl-2 pr-4 shadow-sm hover:bg-gray-50 transition-colors sm:flex">
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
