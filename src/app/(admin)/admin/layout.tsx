import React from "react";
import { Inter } from "next/font/google";
import { AdminFrame } from "../../../components/admin/AdminShell";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={inter.className}>
      <AdminFrame>{children}</AdminFrame>
    </div>
  );
}
