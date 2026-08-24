"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import { useAppShell } from "./AppShellContext";
import { fetchUnreadCount, UNREAD_CHANGED_EVENT } from "../../lib/api/chat";
import React from "react";

const ITEMS = [
  { label: "Home", href: "/", icon: "/figma/icons/nav-home.svg" },
  { label: "Friends", href: "/friends", icon: "/figma/icons/nav-groups.svg" },
  { label: "Create", href: "/create-post", emphasize: true },
  { label: "Chats", href: "/messenger", icon: "/figma/icons/messenger.svg" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function TabLabel({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={`text-[10px] font-semibold leading-none tracking-[0.01em] ${
        active ? "text-[#00696F]" : "text-[#6B7280]"
      }`}
    >
      {children}
    </span>
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { openMenu } = useAppShell();
  const [unread, setUnread] = React.useState(0);
  const hide =
    pathname === "/messenger" ||
    pathname.startsWith("/call") ||
    pathname === "/create-story";

  React.useEffect(() => {
    const refresh = () => {
      fetchUnreadCount()
        .then(setUnread)
        .catch(() => undefined);
    };
    refresh();
    window.addEventListener(UNREAD_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(UNREAD_CHANGED_EVENT, refresh);
  }, [pathname]);

  if (hide) return null;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-[#E5E7EB] bg-white md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid h-[58px] grid-cols-5">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href);

          if ("emphasize" in item && item.emphasize) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label="Create post"
                aria-current={active ? "page" : undefined}
                className="relative flex h-full flex-col items-center justify-end gap-1 pb-[7px]"
              >
                <span className="relative flex h-6 w-full items-center justify-center">
                  <span
                    className={`absolute bottom-0 flex size-[46px] items-center justify-center rounded-full bg-[#00696F] text-white shadow-[0_8px_18px_rgba(0,105,111,0.34)] ring-[4px] ring-white transition-transform active:scale-95 ${
                      active ? "scale-[1.04]" : ""
                    }`}
                  >
                    <Plus className="size-[22px]" strokeWidth={2.6} absoluteStrokeWidth />
                  </span>
                </span>
                <TabLabel active={active}>{item.label}</TabLabel>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className="relative flex h-full flex-col items-center justify-end gap-1 pb-[7px]"
            >
              <span className="relative flex h-6 items-center justify-center">
                <span
                  className="block size-[22px]"
                  style={{
                    backgroundColor: active ? "#00696F" : "#4B5563",
                    WebkitMaskImage: `url(${item.icon})`,
                    maskImage: `url(${item.icon})`,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                  }}
                />
                {item.href === "/messenger" && unread > 0 ? (
                  <span className="absolute -right-1 -top-0.5 size-2 rounded-full bg-[#ED4956] ring-2 ring-white" />
                ) : null}
              </span>
              <TabLabel active={active}>{item.label}</TabLabel>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={openMenu}
          className="flex h-full flex-col items-center justify-end gap-1 pb-[7px] text-[#6B7280]"
          aria-label="Open menu"
        >
          <span className="flex h-6 items-center justify-center">
            <Menu className="size-[22px]" strokeWidth={2.1} />
          </span>
          <TabLabel>Menu</TabLabel>
        </button>
      </div>
    </nav>
  );
}
