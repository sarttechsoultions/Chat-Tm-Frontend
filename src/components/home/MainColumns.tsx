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
  const isAdsDashboard = pathname === "/ads";
  const isRefer = pathname.startsWith("/refer");
  const showLeftSidebar = !isCreateStory && !isMessenger && !isCall;
  const showRightSidebar =
    pathname !== "/create-post" &&
    !isCreateStory &&
    !isMessenger &&
    !isCall &&
    !isWallet &&
    !isAds &&
    !isRefer;

  if (isCall) {
    return (
      <div className="w-full flex flex-1 overflow-hidden">
        <main className="flex-1 h-full min-w-0 overflow-hidden">{children}</main>
      </div>
    );
  }

  if (isMessenger) {
    return (
      <div className="w-full max-w-[1440px] mx-auto flex flex-1 overflow-hidden px-4 lg:px-[85px] pt-0">
        <main className="flex-1 h-full min-w-0 overflow-hidden">{children}</main>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto flex justify-between gap-6 flex-1 overflow-hidden px-4 lg:px-20 pt-2.5">
      {showLeftSidebar ? (
        <aside className="hidden lg:block w-[290px] h-full shrink-0 overflow-y-auto no-scrollbar pb-6">
          <LeftSidebar />
        </aside>
      ) : null}

      <main
        className={`flex-1 h-full min-w-0 ${
          isAdsDashboard ? "overflow-hidden" : "overflow-y-auto no-scrollbar pb-10"
        }`}
      >
        {children}
      </main>

      {showRightSidebar ? (
        <aside className="hidden xl:block w-[290px] h-full shrink-0 overflow-y-auto no-scrollbar pb-6">
          <RightSidebar />
        </aside>
      ) : null}
    </div>
  );
}
