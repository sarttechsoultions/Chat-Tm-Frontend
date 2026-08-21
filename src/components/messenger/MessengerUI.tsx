"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import FigmaIcon from "../home/FigmaIcon";

const CHATS = [
  {
    id: "emma",
    name: "Emma Watson",
    avatar: "/figma/photos/emma-chat.png",
    preview: "Typing...",
    previewClass: "text-[#00696F] font-normal",
    time: "2m",
    timeClass: "text-[#3C494A] font-semibold",
    online: true,
    active: true,
    nameClass: "font-semibold",
  },
  {
    id: "john",
    name: "John Doe",
    avatar: "/figma/photos/john-chat.png",
    preview: "Let's catch up tomorrow.",
    previewClass: "text-[#3C494A] font-normal truncate",
    time: "10m",
    timeClass: "text-[#3C494A] font-semibold",
    online: true,
    active: false,
    nameClass: "font-semibold",
  },
  {
    id: "michael",
    name: "Michael Scott",
    avatar: "/figma/photos/michael-chat.png",
    preview: "Sent a photo",
    previewClass: "text-[#3C494A] font-bold",
    time: "15m",
    timeClass: "text-[#00696F] font-bold",
    online: false,
    active: false,
    nameClass: "font-bold",
  },
] as const;

const ACCORDIONS = [
  { label: "Chat info", chevron: "/figma/icons/accordion-chevron.svg" },
  { label: "Customize chat", chevron: "/figma/icons/accordion-chevron.svg" },
  { label: "Media, files and links", chevron: "/figma/icons/accordion-chevron.svg" },
  { label: "Privacy & support", chevron: "/figma/icons/accordion-chevron-alt.svg" },
] as const;

const ATTACHMENTS = [
  { label: "Add", icon: "/figma/icons/attach-plus.svg", width: 20, height: 20 },
  { label: "Photo", icon: "/figma/icons/attach-image.svg", width: 18, height: 18 },
  { label: "Sticker", icon: "/figma/icons/attach-sticker.svg", width: 18, height: 18 },
  { label: "GIF", icon: "/figma/icons/attach-gif.svg", width: 18, height: 18 },
] as const;

function Avatar({
  src,
  alt,
  size,
  online,
  onlineBorder = "border-white",
  onlineSize = 12,
}: {
  src: string;
  alt: string;
  size: number;
  online?: boolean;
  onlineBorder?: string;
  onlineSize?: number;
}) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="size-full overflow-hidden rounded-full">
        <Image src={src} alt={alt} width={size} height={size} className="size-full object-cover" />
      </div>
      {online ? (
        <span
          className={`absolute bottom-0 right-0 rounded-full bg-[#42B72A] border-2 ${onlineBorder}`}
          style={{ width: onlineSize, height: onlineSize }}
        />
      ) : null}
    </div>
  );
}

export default function MessengerUI() {
  const [draft, setDraft] = useState("");

  return (
    <div className="h-full w-full flex bg-white border border-[#D3E4FE] overflow-hidden">
      <aside className="w-[320px] shrink-0 h-full flex flex-col border-r border-[#D3E4FE] bg-white">
        <div className="flex items-center justify-between px-4 pt-4 pb-[17px] border-b border-[#D3E4FE]">
          <h2 className="text-[16px] leading-6 text-[#0B1C30] font-normal">Chats</h2>
          <div className="flex items-start gap-2">
            <button type="button" aria-label="More" className="flex items-center justify-center rounded-full pt-2 pb-[14px] px-2">
              <FigmaIcon src="/figma/icons/chats-more.svg" alt="" width={16} height={4} />
            </button>
            <button
              type="button"
              aria-label="New message"
              className="flex items-center justify-center rounded-full bg-[#EFF4FF] pt-2 pb-[14px] px-2"
            >
              <FigmaIcon src="/figma/icons/new-message.svg" alt="" width={20} height={20} />
            </button>
          </div>
        </div>

        <div className="p-4">
          <label className="relative block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <FigmaIcon src="/figma/icons/search-messenger.svg" alt="" width={11} height={11} />
            </span>
            <input
              type="search"
              placeholder="Search Messenger"
              className="w-full rounded-full bg-[#EFF4FF] pl-10 pr-4 py-[9px] text-[16px] text-[#0B1C30] placeholder:text-[#6B7280] outline-none"
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col items-center gap-1 px-[8.5px]">
          {CHATS.map((chat) => (
            <button
              key={chat.id}
              type="button"
              className={`flex w-full max-w-[303px] items-center gap-3 p-3 rounded-[8px] text-left ${
                chat.active ? "bg-[#DCE9FF]" : "bg-transparent"
              }`}
            >
              <Avatar
                src={chat.avatar}
                alt={chat.name}
                size={48}
                online={chat.online}
                onlineBorder={chat.active ? "border-[#D3E4FE]" : "border-white"}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-[14px] leading-5 tracking-[0.14px] text-[#0B1C30] ${chat.nameClass}`}>
                  {chat.name}
                </p>
                <p className={`text-[16px] leading-6 ${chat.previewClass}`}>{chat.preview}</p>
              </div>
              <span className={`text-[12px] leading-4 tracking-[0.24px] shrink-0 ${chat.timeClass}`}>
                {chat.time}
              </span>
            </button>
          ))}

          <div className="w-full flex justify-center px-4 py-[18px]">
            <button type="button" className="text-[14px] leading-5 tracking-[0.14px] font-semibold text-[#00696F]">
              See All
            </button>
          </div>
        </div>
      </aside>

      <section className="flex-1 min-w-0 h-full flex flex-col bg-white relative">
        <header className="shrink-0 flex items-center justify-between px-4 pt-4 pb-[17px] border-b border-[#D3E4FE] bg-white/90 backdrop-blur-[2px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
            <Avatar
              src="/figma/photos/emma-header.png"
              alt="Emma Watson"
              size={40}
              online
              onlineBorder="border-white"
              onlineSize={10}
            />
            <div>
              <p className="text-[14px] leading-5 tracking-[0.14px] font-semibold text-[#0B1C30]">Emma Watson</p>
              <p className="text-[12px] leading-4 tracking-[0.24px] font-semibold text-[#3C494A]">Active now</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Link href="/call/audio" aria-label="Voice call" className="flex items-center justify-center rounded-full pt-2 pb-[14px] px-2">
              <FigmaIcon src="/figma/icons/call-phone.svg" alt="" width={18} height={18} />
            </Link>
            <Link href="/call/video" aria-label="Video call" className="flex items-center justify-center rounded-full pt-2 pb-[14px] px-2">
              <FigmaIcon src="/figma/icons/call-video.svg" alt="" width={20} height={16} />
            </Link>
            <button type="button" aria-label="Conversation info" className="flex items-center justify-center rounded-full pt-2 pb-[14px] px-2">
              <FigmaIcon src="/figma/icons/chat-info.svg" alt="" width={20} height={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#F8F9FF] px-4 py-8 flex flex-col gap-4">
          <p className="text-center text-[12px] leading-4 tracking-[0.24px] font-semibold text-[#3C494A]">
            Today, 10:24 AM
          </p>

          <div className="flex items-start gap-3 max-w-[306px]">
            <div className="w-8 pt-10 shrink-0">
              <Avatar src="/figma/photos/emma-bubble.png" alt="" size={32} />
            </div>
            <div className="bg-[#E5EEFF] rounded-tl-2xl rounded-tr-2xl rounded-br-2xl p-3 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
              <p className="text-[16px] leading-6 text-[#0B1C30]">
                Hey Rahul! 👋
                <br />
                How are you doing?
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="bg-[#00696F] rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl p-3 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
              <p className="text-[16px] leading-6 text-white">I&apos;m good! How about you?</p>
            </div>
          </div>

          <div className="flex items-start gap-3 max-w-[306px]">
            <div className="w-8 pt-10 shrink-0" />
            <div className="bg-[#E5EEFF] rounded-2xl pl-3 pr-6 py-3 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
              <p className="text-[16px] leading-6 text-[#0B1C30]">
                I&apos;m great! Just working on a
                <br />
                new project.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-[3.5px]">
            <div className="bg-[#00696F] rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl p-3 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
              <p className="text-[16px] leading-6 text-white">
                That&apos;s awesome! 🎉
                <br />
                Can&apos;t wait to see it.
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[12px] leading-4 tracking-[0.24px] font-semibold text-[#3C494A]">Seen</span>
              <FigmaIcon src="/figma/icons/seen.svg" alt="" width={13} height={7} />
            </div>
          </div>

          <div className="flex items-end gap-3 mt-2">
            <Avatar src="/figma/photos/emma-typing.png" alt="" size={32} />
            <div className="flex h-10 w-16 items-center justify-center gap-1 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl bg-[#E5EEFF] p-3 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
              <span className="size-1.5 rounded-full bg-[#3C494A]" />
              <span className="size-1.5 rounded-full bg-[#3C494A]" />
              <span className="size-1.5 rounded-full bg-[#3C494A]" />
            </div>
          </div>
        </div>

        <form
          className="shrink-0 flex items-center gap-2 px-3 pt-[13px] pb-3 border-t border-[#D3E4FE] bg-white"
          onSubmit={(event) => {
            event.preventDefault();
            setDraft("");
          }}
        >
          {ATTACHMENTS.map((item) => (
            <button
              key={item.label}
              type="button"
              aria-label={item.label}
              className="flex items-center justify-center rounded-full pt-2 pb-[14px] px-2 shrink-0"
            >
              <FigmaIcon src={item.icon} alt="" width={item.width} height={item.height} />
            </button>
          ))}

          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a message..."
              className="w-full rounded-full bg-[#EFF4FF] pl-4 pr-10 py-[11px] text-[16px] text-[#0B1C30] placeholder:text-[#6B7280] outline-none"
            />
            <button
              type="button"
              aria-label="Emoji"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
            >
              <FigmaIcon src="/figma/icons/input-emoji.svg" alt="" width={17} height={17} />
            </button>
          </div>

          <button type="submit" aria-label="Send" className="flex items-center justify-center rounded-full pt-2 pb-[14px] px-2 shrink-0">
            <FigmaIcon src="/figma/icons/send-message.svg" alt="" width={19} height={16} />
          </button>
        </form>
      </section>

      <aside className="hidden xl:flex w-[288px] shrink-0 h-full flex-col border-l border-[#D3E4FE] bg-white overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center px-6 pt-6 pb-[25px] border-b border-[#D3E4FE]">
          <div className="pb-4">
            <Avatar src="/figma/photos/emma-info.png" alt="Emma Watson" size={96} />
          </div>
          <h2 className="text-[16px] leading-6 font-bold text-[#0B1C30]">Emma Watson</h2>
          <p className="text-[16px] leading-6 text-[#3C494A] pb-4">Active now</p>
          <div className="flex items-start justify-center gap-4 w-full">
            <button type="button" className="flex flex-col items-center gap-1">
              <span className="relative h-[46px] w-10 overflow-clip">
                <img src="/figma/icons/action-profile.svg" alt="" width={40} height={46} className="size-full object-contain" />
              </span>
              <span className="text-[12px] leading-4 tracking-[0.24px] font-semibold text-[#0B1C30]">Profile</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-1">
              <span className="relative h-[51px] w-[44px] overflow-clip">
                <img src="/figma/icons/action-mute.svg" alt="" width={44} height={51} className="size-full object-contain" />
              </span>
              <span className="text-[12px] leading-4 tracking-[0.24px] font-semibold text-[#0B1C30]">Mute</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-1">
              <span className="relative h-12 w-[42px] overflow-clip">
                <img src="/figma/icons/action-search.svg" alt="" width={42} height={48} className="size-full object-contain" />
              </span>
              <span className="text-[12px] leading-4 tracking-[0.24px] font-semibold text-[#0B1C30]">Search</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col p-2">
          {ACCORDIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              className="flex items-center justify-between p-3 rounded-[8px] w-full"
            >
              <span className="text-[14px] leading-5 tracking-[0.14px] font-semibold text-[#0B1C30]">{item.label}</span>
              <FigmaIcon src={item.chevron} alt="" width={12} height={8} />
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
