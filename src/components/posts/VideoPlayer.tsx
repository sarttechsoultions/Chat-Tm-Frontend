"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

export default function VideoPlayer({ src, reel = false }: { src: string; reel?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const manuallyPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const [notice, setNotice] = useState("");
  const toggle = async () => {
    const video = ref.current;
    if (!video) return;
    if (!video.paused) { manuallyPaused.current = true; video.pause(); }
    else try { manuallyPaused.current = false; await video.play(); setNotice(""); } catch { setNotice("Unable to play this video. Try again."); }
  };
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let visible = false;
    const sync = () => {
      if (!visible || document.hidden) video.pause();
      else if (!manuallyPaused.current) void video.play().catch(() => {});
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.intersectionRatio >= 0.6;
      sync();
    }, { threshold: [0, 0.6] });
    document.addEventListener("visibilitychange", sync);
    observer.observe(video);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); video.pause(); };
  }, [src]);
  const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  return <div className={`relative isolate w-full overflow-hidden bg-[#101820] text-white ${reel ? "h-[min(720px,calc(100dvh-170px))] min-h-[360px]" : "h-full"}`}>
    <video ref={ref} src={src} muted={muted} loop={reel} playsInline preload="metadata" className="absolute inset-0 size-full object-contain" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onTimeUpdate={e => setTime(e.currentTarget.currentTime)} onLoadedMetadata={e => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)} onError={() => setError(true)} />
    <button type="button" onClick={() => void toggle()} aria-label={playing ? "Pause video" : "Play video"} className="absolute inset-0 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-white">
      {!playing && !error && <span className="flex size-16 items-center justify-center rounded-full bg-black/50 shadow-lg backdrop-blur-sm"><Play fill="currentColor" className="ml-1 size-8" /></span>}
    </button>
    {(error || notice) && <p role="status" className="absolute inset-x-4 top-1/2 text-center text-sm">{error ? "This video could not be loaded." : notice}</p>}
    <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/90 to-transparent px-3 pb-3 pt-8">
      <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={() => void toggle()} className="flex size-8 shrink-0 items-center justify-center">{playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}</button>
      <span className="text-[11px] tabular-nums">{clock(time)}</span>
      <input aria-label="Video progress" type="range" min={0} max={duration || 1} step={0.1} value={time} onChange={e => { if (ref.current) ref.current.currentTime = Number(e.target.value); }} className="h-1 min-w-0 flex-1 accent-[#29b9bc]" />
      <span className="text-[11px] tabular-nums">{clock(duration)}</span>
      <button type="button" aria-label={muted ? "Unmute" : "Mute"} onClick={() => setMuted(!muted)} className="flex size-8 shrink-0 items-center justify-center">{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
    </div>
  </div>;
}
