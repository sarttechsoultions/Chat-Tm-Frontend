import React from "react";
import Navbar from "../../components/home/Navbar";
import LeftSidebar from "../../components/home/LeftSidebar";
import RightSidebar from "../../components/home/RightSidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-[#F0F2F5] overflow-hidden">
      {/* Top Navbar */}
      <div className="shrink-0 z-50">
        <Navbar />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1440px] mx-auto flex justify-between flex-1 overflow-hidden">
        
        {/* Left Sidebar (Fixed) */}
        <aside className="hidden lg:block w-[300px] h-full shrink-0 overflow-y-auto no-scrollbar">
          <LeftSidebar />
        </aside>

        {/* Center Main Content (Scrollable) */}
        <main className="flex-1 h-full overflow-y-auto no-scrollbar pb-10 px-4 lg:px-6 max-w-[720px]">
          {children}
        </main>

        {/* Right Sidebar (Fixed) */}
        <aside className="hidden xl:block w-[300px] h-full shrink-0 overflow-y-auto no-scrollbar">
          <RightSidebar />
        </aside>

      </div>
    </div>
  );
}