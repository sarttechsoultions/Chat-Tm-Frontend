"use client";

import React from "react";
import Image from "next/image";

const TRENDING_TAGS = [
  { tag: "WebDesign", posts: "12.8K posts", iconColor: "text-[#EC4899]", iconBg: "bg-[#FDF2F8]" },
  { tag: "AIRevolution", posts: "8.4K posts", iconColor: "text-[#3B82F6]", iconBg: "bg-[#EFF6FF]" },
  { tag: "TravelDiaries", posts: "6.7K posts", iconColor: "text-[#22C55E]", iconBg: "bg-[#F0FDF4]" },
];

const CONTACTS = [
  { name: "Emma Watson", avatar: "/figma/photos/contact-1.png", online: true },
  { name: "John Doe", avatar: "/figma/photos/contact-2.png", online: true },
  { name: "Michael Scott", avatar: "/figma/photos/contact-3.png", online: false, time: "12m", dimmed: true },
  { name: "Sophia Lee", avatar: "/figma/photos/contact-4.png", online: true },
  { name: "Chris Evans", avatar: "/figma/photos/contact-5.png", online: false, time: "1h" },
];

const ATTENDEES = [
  "/figma/photos/attendee-1.png",
  "/figma/photos/attendee-2.png",
  "/figma/photos/attendee-3.png",
  "/figma/photos/attendee-4.png",
];

export default function RightSidebar() {
  return (
    <aside className="w-[300px] flex flex-col gap-6 py-2 font-sans select-none h-full overflow-y-auto no-scrollbar">
      <div className="bg-white rounded-[16px] p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[#111827] leading-6">Sponsored</h3>
          <button type="button" aria-label="More">
            <span className="relative w-[14px] h-[4px] overflow-clip inline-flex">
              <img src="/figma/icons/more-h-dark.svg" alt="" width={14} height={4} className="size-full object-contain" />
            </span>
          </button>
        </div>

        <div className="flex items-start gap-3 cursor-pointer group">
          <div className="relative size-[96px] rounded-[8px] overflow-hidden shrink-0">
            <Image
              src="/figma/photos/macbook.png"
              alt="MacBook Pro"
              fill
              sizes="96px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <h4 className="text-[14px] font-bold text-[#111827] leading-[17.5px]">
              The New MacBook Pro M3 — Supercharged for pros.
            </h4>
            <span className="text-[12px] text-[#6B7280] mt-2">apple.com</span>
            <button className="mt-2 w-full bg-[#FAF5FF] text-[#00696F] font-semibold text-[12px] py-1.5 px-3 rounded-[8px]">
              Learn More
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[16px] p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[#111827] leading-6">Trending Now</h3>
          <button className="text-[14px] font-semibold text-[#00696F] hover:underline">See All</button>
        </div>
        <div className="flex flex-col gap-4">
          {TRENDING_TAGS.map((item) => (
            <div key={item.tag} className="flex items-start gap-3 cursor-pointer">
              <div className={`size-8 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0 ${item.iconBg} ${item.iconColor}`}>
                #
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-[#111827] leading-5">{item.tag}</span>
                <span className="text-[12px] text-[#6B7280] leading-4">{item.posts}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[16px] p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[#111827] leading-6">Contacts</h3>
          <div className="flex items-center gap-2">
            <span className="relative size-[14px] overflow-clip">
              <img src="/figma/icons/search-sm.svg" alt="" width={14} height={14} className="size-full object-contain" />
            </span>
            <span className="relative w-[14px] h-[4px] overflow-clip">
              <img src="/figma/icons/more-h-dark.svg" alt="" width={14} height={4} className="size-full object-contain" />
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {CONTACTS.map((contact) => (
            <div key={contact.name} className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`relative size-8 rounded-full overflow-hidden shrink-0 ${contact.dimmed ? "opacity-60" : ""}`}>
                    <Image src={contact.avatar} alt={contact.name} fill sizes="32px" className="object-cover" />
                  </div>
                  {contact.online && (
                    <span className="absolute bottom-0 right-0 size-2.5 bg-[#22C55E] border-2 border-white rounded-full" />
                  )}
                </div>
                <span className={`text-[14px] font-medium text-[#1F2937] ${contact.dimmed ? "opacity-80" : ""}`}>
                  {contact.name}
                </span>
              </div>
              {contact.time && (
                <span className="text-[12px] text-[#9CA3AF]">{contact.time}</span>
              )}
            </div>
          ))}
        </div>

        <button className="w-full bg-[#FAF5FF] text-[#00696F] font-semibold text-[14px] py-2 rounded-[12px]">
          View All Contacts
        </button>
      </div>

      <div className="bg-white rounded-[16px] p-4 pb-6 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[#111827] leading-6">Upcoming Events</h3>
          <button className="text-[14px] font-semibold text-[#00696F] hover:underline">See All</button>
        </div>

        <div className="flex gap-3 items-start">
          <div className="size-14 bg-[#FAF5FF] border border-[#F3E8FF] rounded-[12px] flex flex-col items-center justify-center shrink-0">
            <span className="text-[18px] font-bold text-[#00696F] leading-[18px]">25</span>
            <span className="text-[12px] font-medium text-[#00696F] uppercase leading-4">MAY</span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <h4 className="text-[14px] font-bold text-[#111827] leading-[17.5px]">UI/UX Design Workshop</h4>
            <p className="text-[12px] text-[#6B7280] mt-1">10:00 AM – 01:00 PM</p>
            <p className="text-[12px] text-[#6B7280]">Online Event</p>
            <div className="flex items-center mt-2">
              <div className="flex">
                {ATTENDEES.map((img, i) => (
                  <div
                    key={img}
                    className={`relative size-6 rounded-full border-2 border-white overflow-hidden ${i > 0 ? "-ml-2" : ""}`}
                  >
                    <Image src={img} alt="attendee" fill sizes="24px" className="object-cover" />
                  </div>
                ))}
              </div>
              <span className="text-[12px] text-[#6B7280] font-medium pl-2">+85</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
