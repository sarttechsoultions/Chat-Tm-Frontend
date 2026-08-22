import React from "react";
import { Inter } from "next/font/google";
import { AdminHeader, AdminSidebar } from "../../../components/admin/AdminShell";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} h-screen flex bg-[#F5F7F7] overflow-hidden`}>
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <AdminHeader />
        <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-6">{children}</main>
      </div>
    </div>
  );
}
