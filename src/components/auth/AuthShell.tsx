import React from "react";
import Image from "next/image";

export default function AuthShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 font-sans">
      <div className="w-full max-w-full flex gap-10 lg:gap-20 items-center justify-center">
        <div className="hidden md:flex flex-col justify-center items-center w-[448px] h-[604px] bg-[#D21B8B1A] rounded-[14px] shadow-lg">
          <div className="relative flex justify-center items-center w-full">
            <Image
              src="/ChatTmLogo.png"
              alt="ChatTm Logo"
              width={200}
              height={100}
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center w-full max-w-[384px]">
          <h1 className="text-[24px] font-bold text-[#0B1C30] mb-8">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}

export const authInputClass =
  "w-full h-[50px] px-4 border border-[#D8D2D2] rounded-[10px] text-[#0B1C30] placeholder-gray-400 focus:outline-none focus:border-[#00696F] focus:ring-1 focus:ring-[#00696F] transition-all";
