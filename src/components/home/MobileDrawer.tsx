"use client";

import React from "react";
import { X } from "lucide-react";
import { useAppShell } from "./AppShellContext";
import LeftSidebar from "./LeftSidebar";

export default function MobileDrawer() {
  const { menuOpen, closeMenu } = useAppShell();

  return (
    <div
      className={`fixed inset-0 z-[70] lg:hidden ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!menuOpen}
    >
      <button
        type="button"
        aria-label="Close menu"
        onClick={closeMenu}
        className={`absolute inset-0 bg-black/40 transition-opacity ${menuOpen ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className={`absolute inset-y-0 left-0 flex w-[min(88vw,320px)] max-w-full flex-col bg-[#F9FAFB] shadow-[8px_0_24px_rgba(0,0,0,0.18)] transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-3">
          <p className="text-[15px] font-semibold text-[#0B1C30]">Menu</p>
          <button
            type="button"
            onClick={closeMenu}
            aria-label="Close menu"
            className="flex size-9 items-center justify-center rounded-full hover:bg-[#F3F4F6]"
          >
            <X className="size-5 text-[#4B5563]" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {menuOpen ? <LeftSidebar onNavigate={closeMenu} /> : null}
        </div>
      </div>
    </div>
  );
}
