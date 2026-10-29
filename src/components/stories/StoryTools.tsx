"use client";
import { useEffect, useRef, useState } from "react";
export function StoryVideo({ src, onReady, onError, onEnded, onProgress, onPlaying, forcePause = false, muted = false, touchGestures = false }: { src: string; onReady?: () => void; onError?: () => void; forcePause?: boolean; onEnded?: () => void; onProgress?: (n: number) => void; onPlaying?: (v: boolean) => void; muted?: boolean; touchGestures?: boolean }) {
const touchClick=useRef(false); const ended=useRef(false); const ref=useRef<HTMLVideoElement>(null); const [paused,setPaused]=useState(false);
useEffect(()=>{const v=ref.current;if(!v)return;if(forcePause)v.pause();else void v.play().catch(()=>{});},[forcePause]);
return <button data-story-media={touchGestures ? "true" : undefined} onPointerDown={e => { touchClick.current = touchGestures && e.pointerType === "touch"; }} aria-label={paused ? "Resume video" : "Pause video"} className="relative size-full" onClick={()=>{if(touchClick.current){touchClick.current=false;return;}const v=ref.current;if(v?.paused) void v.play().catch(()=>{});else v?.pause();}}><video onError={onError} ref={ref} src={src} autoPlay playsInline muted={muted} className="size-full object-contain" onPlaying={onReady} onPlay={()=>{setPaused(false);onPlaying?.(true);}} onPause={()=>{setPaused(true);onPlaying?.(false);}} onEnded={()=>{if(!ended.current){ended.current=true;onEnded?.();}}} onTimeUpdate={e=>{const v=e.currentTarget; const duration=Math.min(v.duration || 30,30); onProgress?.(Math.min(100,v.currentTime/duration*100)); if(v.currentTime>=30 && !ended.current){ended.current=true;v.pause();onEnded?.();}}} />{paused && <span className="pointer-events-none absolute left-1/2 top-1/2 rounded-full bg-black/50 p-3 text-white">▶</span>}</button>;
}

export function StoryAudio({src,paused,muted=false}:{src:string;paused:boolean;muted?:boolean}) {
 const ref=useRef<HTMLAudioElement>(null); const [blocked,setBlocked]=useState(false);
 useEffect(()=>{const a=ref.current;if(!a)return;if(paused)a.pause();else void a.play().catch(()=>setBlocked(true));return ()=>a.pause();},[paused,src]);
 return <><audio ref={ref} src={src} muted={muted} loop />{blocked && <button className="absolute bottom-12 left-3 z-20 rounded-full bg-black/60 px-3 py-2 text-xs text-white" onClick={()=>{void ref.current?.play().then(()=>setBlocked(false)).catch(()=>{});}}>♫ Play music</button>}</>;
}
