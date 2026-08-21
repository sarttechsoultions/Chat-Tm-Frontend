"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FigmaIcon from "../home/FigmaIcon";
import PulsingCallAvatar from "./PulsingCallAvatar";

type VideoCallUIProps = {
  connected?: boolean;
};

const VIDEO_ACTIONS = [
  { label: "Mute", icon: "/figma/icons/video-mic.svg", width: 14, height: 19 },
  { label: "Turn off camera", icon: "/figma/icons/video-cam.svg", width: 20, height: 16 },
  { label: "Share screen", icon: "/figma/icons/video-share.svg", width: 20, height: 16 },
  { label: "Participants", icon: "/figma/icons/video-people.svg", width: 22, height: 16 },
  { label: "Chat", icon: "/figma/icons/video-chat.svg", width: 20, height: 20 },
  { label: "More options", icon: "/figma/icons/video-more.svg", width: 4, height: 16 },
] as const;

export default function VideoCallUI({ connected = false }: VideoCallUIProps) {
  const router = useRouter();
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  useEffect(() => {
    if (connected) return;
    const timer = setTimeout(() => router.replace("/call/video/active"), 2500);
    return () => clearTimeout(timer);
  }, [connected, router]);

  if (!connected) {
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
            <p className="text-[18px] leading-7 text-[#00696F] text-center">Calling...</p>
          </div>
        </div>

        <div className="w-full max-w-[1102px] flex items-end justify-center gap-16 md:gap-40 rounded-[32px] border border-white/50 bg-[rgba(248,249,255,0.7)] p-[25px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] backdrop-blur-[6px]">
          <button type="button" onClick={() => setMuted((value) => !value)} className="flex flex-col items-center gap-2">
            <span className="flex size-14 items-center justify-center rounded-full bg-[#DCE9FF]">
              <FigmaIcon src="/figma/icons/video-call-mute.svg" alt="" width={16} height={22} />
            </span>
            <span className="text-[12px] leading-4 tracking-[0.24px] font-semibold text-[#3C494A]">Mute</span>
          </button>

          <Link href="/messenger" className="flex flex-col items-center gap-2">
            <span className="relative flex size-20 items-center justify-center rounded-full bg-[#BA1A1A] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]">
              <FigmaIcon src="/figma/icons/video-call-end.svg" alt="" width={34} height={13} />
            </span>
            <span className="pt-1 text-[14px] leading-5 tracking-[0.14px] font-bold text-[#BA1A1A]">End Call</span>
          </Link>

          <button type="button" onClick={() => setVideoOff((value) => !value)} className="flex flex-col items-center gap-2">
            <span className={`flex size-14 items-center justify-center rounded-full ${videoOff ? "bg-[#BBC9CA]" : "bg-[#DCE9FF]"}`}>
              <FigmaIcon src="/figma/icons/video-call-off.svg" alt="" width={25} height={25} />
            </span>
            <span className="text-[12px] leading-4 tracking-[0.24px] font-semibold text-[#3C494A]">Video Off</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#213145]">
      <Image
        src="/figma/photos/call-remote.png"
        alt="Emma Watson"
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />

      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-[rgba(0,105,111,0.3)] bg-[rgba(0,105,111,0.2)] px-[17px] py-[9px] backdrop-blur-[6px]">
        <span className="size-2 rounded-full bg-[#BA1A1A]" />
        <span className="text-[14px] leading-5 tracking-[0.14px] font-semibold text-white">00:45:12</span>
      </div>

      <div className="absolute bottom-36 left-4 z-10 flex flex-col gap-1 rounded-lg bg-gradient-to-t from-black/60 to-transparent p-4">
        <p className="text-[24px] leading-8 font-bold text-white drop-shadow-[0px_2px_1px_rgba(0,0,0,0.06)]">Emma Watson</p>
        <div className="flex items-center gap-2">
          <FigmaIcon src="/figma/icons/video-speaking.svg" alt="" width={11} height={10} />
          <span className="text-[12px] leading-4 tracking-[0.24px] font-semibold text-white/80">Speaking...</span>
        </div>
      </div>

      <div className="absolute right-8 bottom-36 z-10 w-[256px] overflow-hidden rounded-[12px] border-2 border-[rgba(248,249,255,0.2)] bg-white shadow-[0px_20px_40px_0px_rgba(19,27,46,0.2)]">
        <div className="relative h-[140px] w-full">
          <Image src="/figma/photos/call-self.png" alt="You" fill sizes="256px" className="object-cover object-top" />
          <span className="absolute bottom-2 left-2 rounded px-2 py-1 bg-black/50 text-[12px] leading-4 tracking-[0.24px] font-semibold text-white">
            You
          </span>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 flex w-[min(100%-32px,560px)] -translate-x-1/2 items-center justify-center">
        <div className="flex h-[74px] w-full items-center justify-between rounded-full border border-[rgba(187,201,202,0.3)] bg-[rgba(248,249,255,0.8)] px-6 shadow-[0px_10px_30px_0px_rgba(11,28,48,0.15)] backdrop-blur-[12px]">
          <div className="flex items-center gap-4">
            {VIDEO_ACTIONS.slice(0, 2).map((action) => (
              <button
                key={action.label}
                type="button"
                aria-label={action.label}
                onClick={() => {
                  if (action.label === "Mute") setMuted((value) => !value);
                  if (action.label === "Turn off camera") setVideoOff((value) => !value);
                }}
                className={`flex size-12 items-center justify-center rounded-full ${
                  (action.label === "Mute" && muted) || (action.label === "Turn off camera" && videoOff)
                    ? "bg-[#BBC9CA]"
                    : "bg-[#E5EEFF]"
                }`}
              >
                <FigmaIcon src={action.icon} alt="" width={action.width} height={action.height} />
              </button>
            ))}
          </div>

          <span className="h-8 w-px bg-[rgba(187,201,202,0.5)]" />

          <div className="flex items-center gap-4">
            {VIDEO_ACTIONS.slice(2).map((action) => (
              <button
                key={action.label}
                type="button"
                aria-label={action.label}
                className="flex size-12 items-center justify-center rounded-full bg-[#E5EEFF]"
              >
                <FigmaIcon src={action.icon} alt="" width={action.width} height={action.height} />
              </button>
            ))}
          </div>

          <span className="h-8 w-px bg-[rgba(187,201,202,0.5)]" />

          <Link
            href="/messenger"
            aria-label="End call"
            className="flex h-12 w-16 items-center justify-center rounded-full bg-[#BA1A1A] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
          >
            <FigmaIcon src="/figma/icons/video-hangup.svg" alt="" width={22} height={9} />
          </Link>
        </div>
      </div>
    </div>
  );
}
