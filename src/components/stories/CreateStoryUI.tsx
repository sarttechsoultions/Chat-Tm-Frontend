"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  Type, 
  Music, 
  Clock, 
  Play, 
  Upload, 
  ChevronDown 
} from "lucide-react";

export default function CreateStoryUI() {
  // States to manage the UI flow
  const [activeTab, setActiveTab] = useState<"photo" | "text">("photo");
  const [isMediaUploaded, setIsMediaUploaded] = useState(false);
  const [selectedBg, setSelectedBg] = useState("#D65454"); // Default Red from Figma

  // Mock colors for the Text background picker
  const backgroundColors = [
    "#4A90E2", "#E91E63", "#F5A623", "#D65454", 
    "#2ECC71", "#9B59B6", "#34495E", "#F1C40F", "#1ABC9C"
  ];

  return (
    <div className="flex h-[calc(100vh-60px)] w-full bg-[#F0F2F5] overflow-hidden">
      
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-[300px] h-full bg-white shadow-sm flex flex-col p-4 shrink-0 overflow-y-auto no-scrollbar">
        
        {/* User Info (Always visible) */}
        <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-200">
            <Image
              src="https://i.pravatar.cc/150?img=13"
              alt="User"
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-[#0B1C30]">Welcome back</span>
            <span className="text-[12px] text-[#65676B]">Active Now</span>
          </div>
        </div>

        {/* --- STATE 1: Text Editor Tools --- */}
        {activeTab === "text" && (
          <div className="flex flex-col gap-6 flex-1">
            {/* Font Selector */}
            <button className="flex items-center justify-between border border-gray-200 rounded-[8px] p-2.5 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2 text-[#0B1C30] text-sm font-semibold">
                <Type size={16} className="text-[#65676B]" />
                Clean
              </div>
              <ChevronDown size={16} className="text-[#65676B]" />
            </button>

            {/* Background Color Picker */}
            <div className="flex flex-col border border-gray-200 rounded-[12px] p-4">
              <span className="text-sm font-semibold text-[#0B1C30]">Backgrounds</span>
              <span className="text-xs text-[#65676B] mb-3">Gradient</span>
              
              <div className="grid grid-cols-5 gap-2">
                {backgroundColors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedBg(color)}
                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                      selectedBg === color ? "ring-2 ring-offset-2 ring-[#00696F]" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Add Music Tool */}
            <button className="flex items-center gap-3 text-sm font-semibold text-[#0B1C30] hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <Music size={18} className="text-[#65676B]" /> Add music
            </button>
          </div>
        )}

        {/* --- STATE 2: Photo Editor Tools --- */}
        {activeTab === "photo" && isMediaUploaded && (
          <div className="flex flex-col gap-4 flex-1">
            <button className="flex items-center gap-3 text-sm font-semibold text-[#0B1C30] hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <Type size={18} className="text-[#20B2AA]" /> Add text
            </button>
            <button className="flex items-center gap-3 text-sm font-semibold text-[#0B1C30] hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <Music size={18} className="text-[#0B1C30]" /> Add music
            </button>
            <button className="flex items-center gap-3 text-sm font-semibold text-[#0B1C30] hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <Clock size={18} className="text-[#0B1C30]" /> Add time
            </button>
          </div>
        )}

        {/* Bottom Action Buttons (Visible only if media uploaded OR Text tab is active) */}
        {(isMediaUploaded || activeTab === "text") && (
          <div className="mt-auto flex flex-col gap-3 pt-4">
            <button className="w-full bg-[#00696F] hover:bg-[#00585D] text-white py-2.5 rounded-[8px] font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors">
              <Play size={16} fill="white" /> Share to Story
            </button>
            <button 
              onClick={() => setIsMediaUploaded(false)} 
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-[#0B1C30] py-2.5 rounded-[8px] font-semibold text-[14px] transition-colors"
            >
              Discard
            </button>
          </div>
        )}
      </aside>

      {/* ================= CENTER CANVAS ================= */}
      <main className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        
        {/* --- STATE 0: Initial Screen (Not uploaded & Photo tab) --- */}
        {!isMediaUploaded && activeTab === "photo" && (
          <div className="w-full max-w-[718px] bg-white rounded-[16px] shadow-sm p-6 border border-gray-100 flex flex-col gap-6">
            <h2 className="text-[28px] font-bold text-[#0B1C30]">Create Story</h2>
            
            {/* Tabs */}
            <div className="flex bg-[#F0F2F5] p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab("photo")}
                className="flex-1 bg-white text-[#00696F] py-2 rounded-md font-semibold text-sm shadow-sm transition-all"
              >
                Photo/Video
              </button>
              <button 
                onClick={() => setActiveTab("text")}
                className="flex-1 text-[#65676B] hover:text-[#0B1C30] py-2 rounded-md font-semibold text-sm transition-all"
              >
                Text
              </button>
            </div>

            {/* Upload Area (Click to simulate upload) */}
            <div 
              onClick={() => setIsMediaUploaded(true)}
              className="w-full h-[250px] border-2 border-dashed border-gray-300 rounded-[12px] bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className="w-12 h-12 bg-[#EAF4FC] rounded-full flex items-center justify-center text-[#00696F] mb-3">
                <Upload size={20} />
              </div>
              <span className="font-bold text-[#0B1C30] text-[15px]">Click to upload media</span>
              <span className="text-[#65676B] text-[13px] mt-1">or drag and drop here</span>
            </div>
          </div>
        )}

        {/* --- STATE 1: Photo Preview (Uploaded) --- */}
        {isMediaUploaded && activeTab === "photo" && (
          <div className="relative w-[400px] h-[710px] rounded-[16px] overflow-hidden shadow-xl bg-black">
            <Image
              src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800"
              alt="Story Preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
              priority
            />
            {/* Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/30 backdrop-blur-md px-6 py-2 rounded-[12px]">
                <h1 className="text-white text-3xl font-bold tracking-wide">Morning vibes!</h1>
              </div>
            </div>
            {/* Music Badge */}
            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Music size={12} /> Add Music
            </div>
          </div>
        )}

        {/* --- STATE 2: Text Story Canvas --- */}
        {activeTab === "text" && (
          <div 
            className="w-[400px] h-[710px] rounded-[16px] shadow-xl flex items-center justify-center transition-colors duration-300 relative cursor-text"
            style={{ backgroundColor: selectedBg }}
          >
             <textarea 
                className="w-[80%] bg-transparent text-white text-center text-3xl font-bold placeholder-white/60 resize-none focus:outline-none"
                placeholder="Start typing..."
                rows={4}
             />
          </div>
        )}

      </main>
    </div>
  );
}