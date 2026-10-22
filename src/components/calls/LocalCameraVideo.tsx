"use client";
import { useEffect, useRef } from "react";
import type { ILocalVideoTrack } from "agora-rtc-sdk-ng";
export default function LocalCameraVideo({track,off,revision=0}:{track:ILocalVideoTrack|null;off:boolean;revision?:number}) {
 const ref=useRef<HTMLVideoElement>(null);
 useEffect(()=>{const video=ref.current;if(!video||!track)return;video.srcObject=new MediaStream([track.getMediaStreamTrack()]);void video.play().catch(()=>{});return()=>{video.srcObject=null;};},[track,off,revision]);
 return <><video ref={ref} autoPlay muted playsInline aria-label="Your camera" className="size-full object-cover" style={{transform:track?.getMediaStreamTrack().getSettings().facingMode==='environment'?'none':'scaleX(-1)',objectFit:'cover',width:'100%',height:'100%',display:'block'}}/>{off&&<span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#00696F] to-[#102329] text-xs text-white"><span className="flex flex-col items-center gap-2"><img src="/ChatTmLogo.png" alt="ChatTm" className="w-14 object-contain"/>Camera off</span></span>}<span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">You</span></>;
}
