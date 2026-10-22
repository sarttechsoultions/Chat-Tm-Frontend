"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type AppShellContextValue = {
  menuOpen: boolean;
  searchOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  toggleSearch: () => void;
  closeSearch: () => void;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  React.useEffect(()=>{
    const viewport=window.visualViewport;
    const root=document.documentElement;
    const sync=()=>{
      const editing=document.activeElement?.matches("input,textarea,[contenteditable=true]");
      const keyboard=!!editing && !!viewport && window.innerHeight-viewport.height>120;
      root.toggleAttribute("data-keyboard-open",keyboard);
      root.style.setProperty("--visible-height", (viewport?.height || window.innerHeight)+"px");
    };
    viewport?.addEventListener("resize",sync);
    document.addEventListener("focusin",sync);document.addEventListener("focusout",sync);
    sync();
    return()=>{viewport?.removeEventListener("resize",sync);document.removeEventListener("focusin",sync);document.removeEventListener("focusout",sync);root.removeAttribute("data-keyboard-open");};
  },[]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const value = useMemo(
    () => ({
      menuOpen,
      searchOpen,
      openMenu: () => setMenuOpen(true),
      closeMenu,
      toggleMenu: () => setMenuOpen((open) => !open),
      toggleSearch: () => setSearchOpen((open) => !open),
      closeSearch,
    }),
    [menuOpen, searchOpen, closeMenu, closeSearch]
  );

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error("useAppShell must be used within AppShellProvider");
  }
  return context;
}
