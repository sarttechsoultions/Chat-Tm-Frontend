"use client";
import { useEffect, useRef, useState } from "react";
export function StoryVideo({ src, onEnded, onProgress, onPlaying, forcePause = false, muted = false }: { src: string; forcePause?: boolean; onEnded?: () => void; onProgress?: (n: number) => void; onPlaying?: (v: boolean) => void; muted?: boolean }) {
const ref=useRef<HTMLVideoElement>(null); const [paused,setPaused]=useState(false);
useEffect(()=>{const v=ref.current;if(!v)return;if(forcePause)v.pause();else void v.play().catch(()=>{});},[forcePause]);
return <button aria-label={paused ? "Resume video" : "Pause video"} className="relative size-full" onClick={()=>{const v=ref.current;if(v?.paused) void v.play().catch(()=>{});else v?.pause();}}><video ref={ref} src={src} autoPlay playsInline muted={muted} className="size-full object-contain" onPlay={()=>{setPaused(false);onPlaying?.(true);}} onPause={()=>{setPaused(true);onPlaying?.(false);}} onEnded={onEnded} onTimeUpdate={e=>{if(e.currentTarget.duration)onProgress?.(e.currentTarget.currentTime/e.currentTarget.duration*100);}} />{paused && <span className="pointer-events-none absolute left-1/2 top-1/2 rounded-full bg-black/50 p-3 text-white">▶</span>}</button>;
}

export function StoryAudio({src,paused}:{src:string;paused:boolean}) {
 const ref=useRef<HTMLAudioElement>(null); const [blocked,setBlocked]=useState(false);
 useEffect(()=>{const a=ref.current;if(!a)return;if(paused)a.pause();else void a.play().catch(()=>setBlocked(true));return ()=>a.pause();},[paused,src]);
 return <><audio ref={ref} src={src} loop />{blocked && <button className="absolute bottom-12 left-3 z-20 rounded-full bg-black/60 px-3 py-2 text-xs text-white" onClick={()=>{void ref.current?.play().then(()=>setBlocked(false)).catch(()=>{});}}>♫ Play music</button>}</>;
}
