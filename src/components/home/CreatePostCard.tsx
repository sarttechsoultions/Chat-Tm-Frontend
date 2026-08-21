"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  Image as ImageIcon, 
  Video, 
  Smile, 
  Globe, 
  MapPin, 
  ChevronDown, 
  CloudUpload, 
  UserPlus, 
  Send,
  X
} from "lucide-react";

export default function CreatePostCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* ---------------- CREATE POST CARD (Trigger) ---------------- */}
      <div className="w-full bg-white rounded-[16px] p-4 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] flex flex-col gap-4">
        {/* Top Input Row */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-100">
            <Image
              src="https://i.pravatar.cc/150?img=13"
              alt="Rahul Sharma"
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
          <div 
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-[#F0F2F5] hover:bg-[#e4e6eb] transition-colors rounded-full px-5 h-10 flex items-center cursor-text"
          >
            <span className="text-sm text-[#65676B]">Create something amazing, Rahul!</span>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between px-2">
          {/* Photo/Video Button - Trigger Modal */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors text-sm font-semibold text-[#65676B]"
          >
            <ImageIcon size={20} className="text-[#20B2AA]" />
            <span>Photo/Video</span>
          </button>

          <button className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors text-sm font-semibold text-[#65676B]">
            <Video size={20} className="text-[#F02849]" />
            <span>Live Video</span>
          </button>

          <button className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors text-sm font-semibold text-[#65676B]">
            <Smile size={20} className="text-[#F7B125]" />
            <span>Feeling/Activity</span>
          </button>
        </div>
      </div>

      {/* ---------------- MODAL (Create New Post) ---------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          
          {/* Modal Container */}
          <div className="relative w-full max-w-[768px] bg-white rounded-[16px] shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Modal Content Wrapper */}
            <div className="p-6 md:p-8 flex-1 overflow-y-auto no-scrollbar">
              
              {/* Header Titles */}
              <h2 className="text-[32px] font-bold text-[#0B1C30] font-serif tracking-tight leading-tight">
                Create New Post
              </h2>
              <p className="text-[16px] text-[#3C494A] mt-1">
                Share a moment with your network.
              </p>

              {/* Author Profile Row */}
              <div className="flex items-center gap-3 mt-6">
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-gray-200">
                  <Image
                    src="https://i.pravatar.cc/150?img=32" // Using Sarah's avatar
                    alt="Sarah Jenkins"
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-[#0B1C30] text-[14px]">Sarah Jenkins</h4>
                  <div className="flex gap-2 mt-1">
                    {/* Public Dropdown */}
                    <button className="flex items-center gap-1 text-[12px] font-semibold text-[#3C494A] border border-gray-200 hover:bg-gray-50 px-2 py-0.5 rounded-[4px] transition-colors">
                      <Globe size={12} />
                      Public
                      <ChevronDown size={12} />
                    </button>
                    {/* Select Area Dropdown */}
                    <button className="flex items-center gap-1 text-[12px] font-semibold text-[#3C494A] border border-gray-200 hover:bg-gray-50 px-2 py-0.5 rounded-[4px] transition-colors">
                      <MapPin size={12} />
                      Select Area
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Text Area (Caption Input) */}
              <textarea 
                className="w-full mt-5 text-[16px] text-[#0B1C30] placeholder-[#8A94A6] focus:outline-none resize-none h-[100px]" 
                placeholder="What's on your mind, Sarah?"
              />

              {/* Drag & Drop Upload Box */}
              <div className="w-full bg-[#F8FAFC] border-2 border-dashed border-[#D3E4FE] rounded-[12px] h-[220px] flex flex-col items-center justify-center cursor-pointer hover:bg-[#F1F5F9] transition-colors mt-2">
                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                  <CloudUpload className="text-[#00696F]" size={24} />
                </div>
                <span className="font-bold text-[#0B1C30] text-[14px]">Click or drag media here</span>
                <span className="text-[12px] text-[#65676B] mt-1">Supports JPG, PNG, MP4 up to 50MB</span>
              </div>

              {/* Add to your post row */}
              <div className="flex items-center justify-between mt-6 px-2">
                <span className="text-[12px] font-bold text-[#0B1C30]">Add to your post</span>
                <div className="flex gap-3">
                  <button className="w-8 h-8 rounded-full bg-[#E6F4F1] flex items-center justify-center text-[#20B2AA] hover:brightness-95 transition-all">
                    <ImageIcon size={16} strokeWidth={2.5} />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-[#FCE8ED] flex items-center justify-center text-[#F02849] hover:brightness-95 transition-all">
                    <UserPlus size={16} strokeWidth={2.5} />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-[#FFF4E5] flex items-center justify-center text-[#F7B125] hover:brightness-95 transition-all">
                    <MapPin size={16} strokeWidth={2.5} />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-[#FFF7E5] flex items-center justify-center text-[#F7C325] hover:brightness-95 transition-all">
                    <Smile size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#F0F5FA] p-4 flex items-center justify-between rounded-b-[16px] px-6 md:px-8">
              <button className="text-[#3C494A] font-bold text-[13px] hover:text-[#0B1C30] transition-colors">
                Save Draft
              </button>
              <button className="bg-[#00696F] hover:bg-[#00585D] text-white px-6 py-2.5 rounded-[8px] font-semibold text-[14px] flex items-center gap-2 transition-colors">
                Post <Send size={16} />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}