"use client";
import Image from "next/image";
export default function PostShareButton({onClick,expanded=false}:{onClick:()=>void;expanded?:boolean}){
 return <button type="button" onClick={onClick} aria-expanded={expanded} className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-medium text-[#4B5563] hover:bg-gray-50 sm:gap-2 sm:px-4 sm:text-[14px]"><span className="relative h-[12px] w-[14px] overflow-clip"><Image src="/figma/icons/share.svg" alt="" width={14} height={12} className="size-full object-contain"/></span>Share</button>;
}
