import React from "react";
import Navbar from "../../components/home/Navbar";
import MainColumns from "../../components/home/MainColumns";
import { AppShellProvider } from "../../components/home/AppShellContext";
import MobileDrawer from "../../components/home/MobileDrawer";
import MobileBottomNav from "../../components/home/MobileBottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShellProvider>
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#F9FAFB]">
        <div className="z-50 shrink-0">
          <Navbar />
        </div>
        <MainColumns>{children}</MainColumns>
        <MobileBottomNav />
        <MobileDrawer />
      </div>
    </AppShellProvider>
  );
}