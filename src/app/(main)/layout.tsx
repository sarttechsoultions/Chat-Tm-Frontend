import React from "react";
import Navbar from "../../components/home/Navbar";
import MainColumns from "../../components/home/MainColumns";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <div className="shrink-0 z-50">
        <Navbar />
      </div>

      <MainColumns>{children}</MainColumns>
    </div>
  );
}