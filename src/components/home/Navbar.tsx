"use client";
import useFriendRequestCount from "../hooks/useFriendRequestCount";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Bell, CheckCheck, Search, X } from "lucide-react";
import SearchPanel from "./SearchPanel";
import FigmaIcon from "./FigmaIcon";
import { UserAvatar } from "../ui/UserAvatar";
import { useAppShell } from "./AppShellContext";
import { displayName, meRequest } from "../../lib/auth";
import { useCurrentUser } from "../hooks/useCurrentUser";
import useUnreadCount from "../hooks/useUnreadCount";
import { AppNotification, fetchNotificationUnreadCount, fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../../lib/api/notifications";
import { useSocket } from "../hooks/useSocket";
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
  React.useEffect(()=>{const timer=window.setTimeout(()=>setSearchQuery(""),0);return()=>window.clearTimeout(timer);},[pathname]);
  React.useEffect(()=>{if(searchOpen)return;const timer=window.setTimeout(()=>setSearchQuery(""),0);return()=>window.clearTimeout(timer);},[searchOpen]);
  const searchBox=React.useRef<HTMLDivElement>(null);
  React.useEffect(()=>{if(!searchOpen)return;const outside=(event:PointerEvent)=>{if(!searchBox.current?.contains(event.target as Node))closeSearch();};document.addEventListener("pointerdown",outside);return()=>document.removeEventListener("pointerdown",outside);},[searchOpen,closeSearch]);


  const currentUser = useCurrentUser();
  const user = currentUser
    ? { name: displayName(currentUser), avatar: currentUser.avatar || "" }
    : null;
  const unread = useUnreadCount();
  const socket = useSocket();
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [notificationsLoading, setNotificationsLoading] = React.useState(false);
  const [notificationsError, setNotificationsError] = React.useState("");
  const notificationsRef = React.useRef<HTMLDivElement>(null);
  const refreshNotifications = React.useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      const result = await fetchNotifications();
      setNotifications(result.items || []);
      setNotificationCount(result.unreadCount || 0);
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : "Could not load notifications");
    } finally { setNotificationsLoading(false); }
  }, []);
  React.useEffect(() => { void fetchNotificationUnreadCount().then(setNotificationCount).catch(() => undefined); }, []);
  React.useEffect(() => {
    if (!socket) return;
    const onNew = (item: AppNotification) => {
      setNotifications(current => [item, ...current.filter(existing => existing.id !== item.id)].slice(0, 30));
      setNotificationCount(count => count + 1);
    };
    socket.on("notification_new", onNew);
    return () => { socket.off("notification_new", onNew); };
  }, [socket]);
  React.useEffect(() => {
    if (!notificationsOpen) return;
    const outside = (event: PointerEvent) => { if (!notificationsRef.current?.contains(event.target as Node)) setNotificationsOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setNotificationsOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [notificationsOpen]);
  const openNotification = async (item: AppNotification) => {
    if (!item.isRead) {
      setNotifications(current => current.map(row => row.id === item.id ? { ...row, isRead: true } : row));
      setNotificationCount(count => Math.max(0, count - 1));
      try { await markNotificationRead(item.id); } catch { void refreshNotifications(); }
    }
    setNotificationsOpen(false);
    const path = item.data?.path;
    router.push(path?.startsWith("/") ? path : "/notifications");
  };
  const markAllRead = async () => {
    setNotifications(current => current.map(item => ({ ...item, isRead: true })));
    setNotificationCount(0);
    try { await markAllNotificationsRead(); } catch { void refreshNotifications(); }
  };
  React.useEffect(() => { void meRequest().catch(() => undefined); }, []);

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
          <div ref={notificationsRef} className="relative shrink-0">
            <button type="button" aria-label={notificationCount ? `Notifications, ${notificationCount} unread` : "Notifications"} aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen(value => !value); if (!notificationsOpen) void refreshNotifications(); }} className="relative flex size-[30px] items-center justify-center rounded-full hover:bg-[#F3F4F6]">
              <img src="/figma/icons/bell.svg" alt="" width={30} height={30} className="size-full object-contain" />
              {notificationCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ED4956] px-1 text-[10px] font-bold leading-none text-white shadow-[0_0_0_2px_white]">{notificationCount > 99 ? "99+" : notificationCount}</span>}
            </button>
            {notificationsOpen && <section aria-label="Notifications" className="fixed left-3 right-3 top-[calc(56px+env(safe-area-inset-top))] z-[80] w-auto overflow-hidden rounded-2xl border border-[#E4EAEC] bg-white shadow-[0_12px_40px_rgba(16,36,48,.18)] md:absolute md:left-auto md:right-0 md:top-[calc(100%+10px)] md:w-[360px]">
              <div className="flex items-center justify-between border-b border-[#EDF1F2] px-4 py-3"><div><h2 className="font-semibold text-[#15232C]">Notifications</h2><p className="text-xs text-[#687681]">{notificationCount ? `${notificationCount} unread` : "You're all caught up"}</p></div><div className="flex items-center gap-2">{notificationCount > 0 && <button onClick={() => void markAllRead()} className="rounded-lg px-2 py-1 text-xs font-semibold text-[#00696F] hover:bg-[#E8F4F4]">Mark all read</button>}<button aria-label="Close notifications" onClick={() => setNotificationsOpen(false)} className="rounded-full p-1.5 hover:bg-gray-100"><X size={16}/></button></div></div>
              <div className="max-h-[min(65dvh,460px)] overflow-y-auto">
                {notificationsLoading && !notifications.length ? <p className="p-6 text-center text-sm text-gray-500">Loading notifications…</p> : notificationsError ? <p role="alert" className="p-5 text-center text-sm text-red-600">{notificationsError}</p> : !notifications.length ? <div className="px-5 py-10 text-center"><Bell className="mx-auto mb-2 text-[#8EA1A6]" size={24}/><p className="text-sm font-medium">No notifications yet</p><p className="mt-1 text-xs text-gray-500">Friend requests and post activity will appear here.</p></div> : notifications.map(item => <button key={item.id} onClick={() => void openNotification(item)} className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[#F5F9F9] ${item.isRead ? "bg-white" : "bg-[#F0F8F8]"}`}><span className={`mt-1 flex size-9 shrink-0 items-center justify-center rounded-full ${item.isRead ? "bg-[#EFF3F4] text-[#65747D]" : "bg-[#D9EEEE] text-[#00696F]"}`}><Bell size={17}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#17232B]">{item.title}</span><span className="mt-0.5 block line-clamp-2 text-xs text-[#586770]">{item.body}</span><span className="mt-1 block text-[11px] text-[#829098]">{new Date(item.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span></span>{!item.isRead ? <span className="mt-3 size-2 shrink-0 rounded-full bg-[#00777C]"/> : <CheckCheck size={15} className="mt-2 shrink-0 text-[#9AA7AC]"/>}</button>)}
              </div>
              <Link href="/notifications" onClick={() => setNotificationsOpen(false)} className="block border-t border-[#EDF1F2] py-3 text-center text-sm font-semibold text-[#00696F] hover:bg-[#F5F9F9]">See all notifications</Link>
            </section>}
          </div>
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
