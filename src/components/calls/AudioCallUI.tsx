"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FigmaIcon from "../home/FigmaIcon";
import PulsingCallAvatar from "./PulsingCallAvatar";

type AudioCallUIProps = {
  connected?: boolean;
};

export default function AudioCallUI({ connected = false }: AudioCallUIProps) {
  const router = useRouter();
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);

  useEffect(() => {
    if (connected) return;
    const timer = setTimeout(() => router.replace("/call/audio/active"), 2500);
    return () => clearTimeout(timer);
  }, [connected, router]);

  return (
    <div className="h-full w-full bg-white flex flex-col items-center justify-between px-12 pt-10 pb-16">
      <div className="flex flex-col items-center">
        <div className="pb-10">
          <PulsingCallAvatar src="/figma/photos/emma-call.png" />
        </div>
        <div className="pt-4 flex flex-col items-center gap-2">
          <h1 className="text-[32px] leading-10 font-bold tracking-[-0.32px] text-[#0B1C30] text-center">
            Emma Watson
          </h1>
          {connected ? (
            <div className="flex items-center justify-center gap-2 pt-1">
              <FigmaIcon src="/figma/icons/call-wave.svg" alt="" width={11} height={12} />
              <p className="text-[18px] leading-7 font-semibold tracking-[1.8px] text-[#00696F]">05:24</p>
            </div>
          ) : (
            <p className="text-[18px] leading-7 text-[#00696F] text-center">Calling...</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-[40px] md:gap-[60px] rounded-full bg-[#F8F9FF] border border-[#D3E4FE] px-[25px] py-[17px] shadow-[0px_10px_20px_rgba(0,105,111,0.08)] backdrop-blur-[12px]">
        <button type="button" onClick={() => setMuted((value) => !value)} className="flex flex-col items-center gap-1">
          <span
            className={`flex size-14 items-center justify-center rounded-full ${
              muted ? "bg-[#D3E4FE]" : "bg-[rgba(211,228,254,0.5)]"
            }`}
          >
            <FigmaIcon src="/figma/icons/call-mute.svg" alt="" width={14} height={19} />
          </span>
          <span className="text-[12px] leading-4 tracking-[0.24px] font-semibold text-[#3C494A]">Mute</span>
        </button>

        <button type="button" onClick={() => setSpeakerOn((value) => !value)} className="flex flex-col items-center gap-1">
          <span
            className={`flex size-14 items-center justify-center rounded-full ${
              speakerOn ? "bg-[rgba(44,199,209,0.2)]" : "bg-[rgba(211,228,254,0.5)]"
            }`}
          >
            <FigmaIcon src="/figma/icons/call-speaker.svg" alt="" width={18} height={18} />
          </span>
          <span className={`text-[12px] leading-4 tracking-[0.24px] font-semibold ${speakerOn ? "text-[#00696F]" : "text-[#3C494A]"}`}>
            Speaker
          </span>
        </button>

        <Link href="/messenger" className="flex flex-col items-center gap-1 pl-2">
          <span className="relative flex size-16 items-center justify-center rounded-full bg-[#BA1A1A] shadow-[0px_10px_15px_-3px_rgba(186,26,26,0.2),0px_4px_6px_-4px_rgba(186,26,26,0.2)]">
            <FigmaIcon src="/figma/icons/call-end.svg" alt="" width={28} height={11} />
          </span>
          <span className="text-[12px] leading-4 tracking-[0.24px] font-semibold text-[#BA1A1A]">End</span>
        </Link>
      </div>
    </div>
  );
}
