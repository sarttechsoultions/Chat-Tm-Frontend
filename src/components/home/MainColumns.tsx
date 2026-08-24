"use client";

import React from "react";
import { usePathname } from "next/navigation";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";

export default function MainColumns({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCreateStory = pathname === "/create-story";
  const isMessenger = pathname === "/messenger";
  const isCall = pathname.startsWith("/call");
  const isWallet = pathname.startsWith("/wallet");
  const isAds = pathname.startsWith("/ads");
  const isRefer = pathname.startsWith("/refer");
  const isFriends = pathname.startsWith("/friends");
  const isProfile = pathname.startsWith("/profile");
  const showLeftSidebar = !isCreateStory && !isMessenger && !isCall;
  const showRightSidebar =
    pathname !== "/create-post" &&
    !isCreateStory &&
    !isMessenger &&
    !isCall &&
    !isWallet &&
    !isAds &&
    !isRefer &&
    !isFriends &&
    !isProfile;

  const mobilePad =
    isMessenger || isCall || isCreateStory
      ? ""
      : "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-10";

  if (isCall) {
    return (
      <div className="flex w-full flex-1 overflow-hidden">
        <main className="h-full min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
    );
  }

  if (isMessenger) {
    return (
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 overflow-hidden px-0 sm:px-4 lg:px-[85px]">
        <main className="h-full min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 justify-between gap-4 overflow-hidden px-3 pt-2 sm:px-4 lg:gap-6 lg:px-20">
      {showLeftSidebar ? (
        <aside className="hidden h-full w-[290px] shrink-0 overflow-y-auto no-scrollbar pb-6 lg:block">
          <LeftSidebar />
        </aside>
      ) : null}

      <main
        className={`h-full min-w-0 flex-1 overflow-y-auto no-scrollbar ${mobilePad}`}
      >
        {children}
      </main>

      {showRightSidebar ? (
        <aside className="hidden h-full w-[290px] shrink-0 overflow-y-auto no-scrollbar pb-6 xl:block">
          <RightSidebar />
        </aside>
      ) : null}
    </div>
  );
}
