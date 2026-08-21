"use client";

import React from "react";
import Image from "next/image";
import { MoreHorizontal, Search } from "lucide-react";

const TRENDING_TAGS = [
  { 
    tag: "WebDesign", 
    posts: "12.8K posts", 
    iconColor: "text-[#E74C3C]", // Red text
    iconBg: "bg-[#FDECEB]"       // Light red background
  },
  { 
    tag: "AIRevolution", 
    posts: "8.4K posts", 
    iconColor: "text-[#3498DB]", // Blue text
    iconBg: "bg-[#EAF4FC]"       // Light blue background
  },
  { 
    tag: "TravelDiaries", 
    posts: "6.7K posts", 
    iconColor: "text-[#2ECC71]", // Green text
    iconBg: "bg-[#EAFAF1]"       // Light green background
  },
];

const CONTACTS = [
  { name: "Emma Watson", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", online: true },
  { name: "John Doe", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", online: true },
  { name: "Michael Scott", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", online: true, time: "12m" },
  { name: "Sophia Lee", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", online: true },
  { name: "Chris Evans", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150", online: false, time: "1h" },
];

const ATTENDEES = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
];

export default function RightSidebar() {
  return (
    <aside className="w-[300px] flex flex-col gap-4 p-3 bg-[#F0F2F5] font-sans select-none h-full overflow-y-auto no-scrollbar">
      
      {/* 1. Sponsored Section */}
      <div className="bg-white rounded-[16px] p-4 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-semibold text-[#65676B]">
          <span>Sponsored</span>
          <MoreHorizontal size={18} className="cursor-pointer hover:text-[#0B1C30]" />
        </div>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="relative w-[100px] h-[80px] rounded-[10px] overflow-hidden shrink-0">
            <Image
              src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300"
              alt="MacBook Pro"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h4 className="text-[13px] font-bold text-[#0B1C30] leading-[18px] line-clamp-2">
              The New MacBook Pro M3 — Supercharged for pros.
            </h4>
            <span className="text-[11px] text-[#65676B] mt-1">apple.com</span>
          </div>
        </div>

        <button className="w-full bg-[#F0F2F5] hover:bg-[#e4e6eb] text-[#00696F] font-semibold text-xs py-2 rounded-[8px] transition-colors text-center">
          Learn More
        </button>
      </div>

{/* 2. Trending Now Section */}
      <div className="bg-white rounded-[16px] p-4 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-semibold text-[#65676B]">
          <span>Trending Now</span>
          <button className="text-[#00696F] hover:underline">See All</button>
        </div>

        <div className="flex flex-col gap-2 mt-1">
          {TRENDING_TAGS.map((item, index) => (
            <div key={index} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors">
              
              {/* Colorful Hashtag Icon */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${item.iconBg} ${item.iconColor}`}>
                #
              </div>

              {/* Tag Name & Posts Count */}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#0B1C30]">{item.tag}</span>
                <span className="text-xs text-[#65676B]">{item.posts}</span>
              </div>
              
            </div>
          ))}
        </div>
      </div>

      {/* 3. Contacts Section */}
      <div className="bg-white rounded-[16px] p-4 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-semibold text-[#65676B]">
          <span>Contacts</span>
          <div className="flex items-center gap-2">
            <Search size={16} className="cursor-pointer hover:text-[#0B1C30]" />
            <MoreHorizontal size={16} className="cursor-pointer hover:text-[#0B1C30]" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {CONTACTS.map((contact, index) => (
            <div key={index} className="flex items-center justify-between p-1.5 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0">
                  <Image src={contact.avatar} alt={contact.name} fill className="object-cover" />
                  {contact.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#2ECC71] border-2 border-white rounded-full" />
                  )}
                </div>
                <span className="text-sm font-semibold text-[#0B1C30]">{contact.name}</span>
              </div>
              {contact.time && (
                <span className="text-[11px] text-[#65676B]">{contact.time}</span>
              )}
            </div>
          ))}
        </div>

        <button className="w-full bg-[#FAF5FF] hover:bg-[#F3E8FF] text-[#00696F] font-semibold text-xs py-2 rounded-[8px] transition-colors text-center">
          View All Contacts
        </button>
      </div>

      {/* 4. Upcoming Events Section */}
      <div className="bg-white rounded-[16px] p-4 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between text-xs font-semibold text-[#65676B]">
          <span>Upcoming Events</span>
          <button className="text-[#00696F] hover:underline">See All</button>
        </div>

        <div className="flex gap-3 items-start bg-gray-50 p-3 rounded-[12px] border border-gray-100">
          {/* Date Box */}
          <div className="w-[45px] h-[48px] bg-white rounded-[10px] shadow-sm flex flex-col items-center justify-center border border-gray-200 shrink-0">
            <span className="text-[10px] font-bold text-[#E74C3C] uppercase leading-none">MAY</span>
            <span className="text-[16px] font-extrabold text-[#0B1C30] leading-tight">25</span>
          </div>

          <div className="flex flex-col flex-1">
            <h4 className="text-[13px] font-bold text-[#0B1C30] leading-[18px]">UI/UX Design Workshop</h4>
            <p className="text-[11px] text-[#65676B] mt-0.5">10:00 AM – 01:00 PM</p>
            <p className="text-[11px] text-[#00696F] font-medium">Online Event</p>

            {/* Attendees avatars */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex -space-x-2">
                {ATTENDEES.map((img, i) => (
                  <div key={i} className="relative w-6 h-6 rounded-full border-2 border-white overflow-hidden">
                    <Image src={img} alt="attendee" fill className="object-cover" />
                  </div>
                ))}
              </div>
              <span className="text-[11px] text-[#65676B] font-medium">+85</span>
            </div>
          </div>
        </div>
      </div>

    </aside>
  );
}