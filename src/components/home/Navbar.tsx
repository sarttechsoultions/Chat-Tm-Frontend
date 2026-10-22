"use client";
import useFriendRequestCount from "../hooks/useFriendRequestCount";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import SearchPanel from "./SearchPanel";
import FigmaIcon from "./FigmaIcon";
import { UserAvatar } from "../ui/UserAvatar";
import { useAppShell } from "./AppShellContext";
import { displayName, meRequest } from "../../lib/auth";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useSocket } from "../hooks/useSocket";
import {
  fetchUnreadCount,
  UNREAD_CHANGED_EVENT,
} from "../../lib/api/chat";

const NAV_ICONS = [
  { label: "Home", icon: "/figma/icons/nav-home.svg", href: "/" },
  { label: "Friends", icon: "/figma/icons/nav-groups.svg", href: "/friends" },
  { label: "Groups", icon: "/figma/icons/nav-friends.svg", href: "/groups" },
  { label: "Marketplace", icon: "/figma/icons/nav-marketplace.svg", href: "/marketplace" },
  { label: "Watch", icon: "/figma/icons/nav-watch.svg", href: "/watch" },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function formatUnread(count: number) {
  if (count > 9) return "9+";
  return String(count);
}

export default function Navbar() {
  const friendRequests=useFriendRequestCount();
  const pathname = usePathname();
  const router=useRouter();
  const { searchOpen, toggleSearch, closeSearch } = useAppShell();
  const [searchQuery,setSearchQuery]=React.useState("");
  React.useEffect(()=>{setSearchQuery("");},[pathname]);
  React.useEffect(()=>{if(!searchOpen)setSearchQuery("");},[searchOpen]);
  const searchBox=React.useRef<HTMLDivElement>(null);
  React.useEffect(()=>{if(!searchOpen)return;const outside=(event:PointerEvent)=>{if(!searchBox.current?.contains(event.target as Node))closeSearch();};document.addEventListener("pointerdown",outside);return()=>document.removeEventListener("pointerdown",outside);},[searchOpen,closeSearch]);

  const socket = useSocket();
  const currentUser = useCurrentUser();
  const user = currentUser
    ? { name: displayName(currentUser), avatar: currentUser.avatar || "" }
    : null;
  const [unread, setUnread] = React.useState(0);

  const refreshUnread = React.useCallback(() => {
    fetchUnreadCount()
      .then(setUnread)
      .catch(() => undefined);
  }, []);

  React.useEffect(() => {
    void meRequest().catch(() => undefined);
  }, []);

  React.useEffect(() => {
    refreshUnread();
  }, [pathname, refreshUnread]);

  React.useEffect(() => {
    const onChanged = () => refreshUnread();
    window.addEventListener(UNREAD_CHANGED_EVENT, onChanged);
    window.addEventListener("focus", onChanged);
    return () => {
      window.removeEventListener(UNREAD_CHANGED_EVENT, onChanged);
      window.removeEventListener("focus", onChanged);
    };
  }, [refreshUnread]);

  React.useEffect(() => {
    if (!socket) return;

    const onIncoming = () => refreshUnread();
    socket.on("new_message", onIncoming);
    socket.on("new_message_notification", onIncoming);
    socket.on("conversation_upserted", onIncoming);

    return () => {
      socket.off("new_message", onIncoming);
      socket.off("new_message_notification", onIncoming);
      socket.off("conversation_upserted", onIncoming);
    };
  }, [socket, refreshUnread]);

  return (
    <header className="sticky top-0 z-50 flex min-h-[48px] sm:min-h-[56px] w-full flex-col bg-white shadow-[0px_4px_10px_0px_rgba(0,0,0,0.12)]">
      <div className="mx-auto flex h-[48px] sm:h-[56px] w-full max-w-[1440px] items-center justify-between gap-2 px-3 sm:px-6 lg:px-[80px]">
        <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-6">
          <Link href="/" className="relative h-8 w-[52px] shrink-0 overflow-clip sm:h-10 sm:w-[66px]">
            <Image
              src="/figma/photos/logo.png"
              alt="Chattm"
              fill
              sizes="66px"
              className="object-contain object-left"
              priority
            />
          </Link>

          <div ref={searchBox} className="relative hidden h-9 w-[180px] shrink-0 items-center gap-2 rounded-[8px] bg-[#F3F4F6] px-3 sm:flex lg:w-[220px]">
            <FigmaIcon src="/figma/icons/search.svg" alt="" width={13} height={12} />
            <input
              type="text"
              placeholder="Search ChatTm"
              value={searchQuery}
              onChange={event=>{setSearchQuery(event.target.value);if(!searchOpen)toggleSearch();}}
              onFocus={()=>{if(window.innerWidth>=768){if(!searchOpen)toggleSearch();}else router.push("/search");}}
              onKeyDown={event=>{if(event.key==="Escape")closeSearch();}}
              className="w-full border-none bg-transparent text-[12px] text-[#3C494A] placeholder-[#3C494A] focus:outline-none lg:text-[14px]"
            />
            {searchOpen && <div role="region" aria-label="Search results" className="absolute left-0 top-[calc(100%+12px)] z-[70] hidden max-h-[70dvh] w-[340px] overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl md:block"><SearchPanel hideInput externalQuery={searchQuery} onQueryChange={setSearchQuery} onClose={closeSearch}/></div>}
          </div>
        </div>

        <div className="hidden h-full shrink-0 items-center justify-center gap-6 md:flex lg:gap-16">
          {NAV_ICONS.map(({ label, icon, href }) => {
            const active = isNavActive(pathname, href);
            return (
              <Link
                key={label}
                href={href}
                aria-label={href==="/friends"&&friendRequests ? label+", "+friendRequests+" pending requests" : label}
                aria-current={active ? "page" : undefined}
                className="relative flex items-center justify-center h-full"
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
                {href==="/friends"&&friendRequests>0&&<span className="absolute -right-3 top-1 min-w-4 rounded-full bg-[#ED4956] px-1 text-center text-[10px] font-bold leading-4 text-white">{friendRequests>99?"99+":friendRequests}</span>}
              </Link>
            );
          })}
        </div>

        <div className="flex shrink-0 flex-1 items-center justify-end gap-3 sm:gap-3 lg:gap-[20px]">
          <button
            type="button"
            aria-label={searchOpen ? "Close search" : "Search"}
            onClick={()=>{closeSearch();router.push("/search");}}
            className="flex size-8 items-center justify-center rounded-full hover:bg-[#F3F4F6] sm:hidden"
          >
            {searchOpen ? <X className="size-[18px] text-[#0B1C30]" /> : <Search className="size-5 text-[#0B1C30]" />}
          </button>
          <button type="button" aria-label="Notifications" className="relative size-[30px] shrink-0 overflow-clip">
            <img src="/figma/icons/bell.svg" alt="" width={30} height={30} className="size-full object-contain" />
          </button>
          <Link
            href="/messenger"
            aria-label={unread ? `Messenger, ${unread} unread` : "Messenger"}
            className="relative size-[30px] shrink-0"
          >
            <img src="/figma/icons/messenger.svg" alt="" width={30} height={30} className="size-full object-contain" />
            {unread > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#ED4956] px-1 text-[10px] font-bold leading-none text-white shadow-[0_0_0_2px_white]">
                {formatUnread(unread)}
              </span>
            ) : null}
          </Link>
          <Link href="/profile" aria-label="Your profile" className="shrink-0">
            <UserAvatar avatarUrl={user?.avatar} name={user?.name} size={30} />
          </Link>
        </div>
      </div>


    </header>
  );
}
