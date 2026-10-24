"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw } from "lucide-react";

type VideoPlayerProps = { src: string; reel?: boolean; onOpenReel?: () => void };
let activeVideo: HTMLVideoElement | null = null;

export default function VideoPlayer(props: VideoPlayerProps) {
  return <VideoPlayback key={`${props.src}:${Boolean(props.reel)}`} {...props} />;
}

function VideoPlayback({ src, reel = false, onOpenReel }: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const manuallyPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const [showControls, setShowControls] = useState(reel);
  const isFeedPreview = Boolean(onOpenReel) && !reel;
  const toggle = async () => {
    const video = ref.current;
    if (!video) return;
    if (!video.paused) { manuallyPaused.current = true; video.pause(); }
    else try { manuallyPaused.current = false; await video.play(); } catch { /* browser blocked playback */ }
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
  const skip = (seconds: number) => {
    const video = ref.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
  };
  const toggleMuted = async () => {
    const video = ref.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setMuted(nextMuted);
    if (!nextMuted && video.paused) {
      manuallyPaused.current = false;
      await video.play().catch(() => {});
    }
  };
  return <div className={`relative isolate w-full overflow-hidden bg-[#101820] text-white ${reel ? "h-full min-h-[360px]" : "h-full"}`} onPointerMove={() => reel && setShowControls(true)} onPointerLeave={() => reel && setShowControls(false)}>
    <video ref={ref} src={src} muted={muted} loop={reel || isFeedPreview} playsInline preload="none" className="absolute inset-0 size-full object-contain" onPlay={e => { const current = e.currentTarget; if (activeVideo && activeVideo !== current) activeVideo.pause(); activeVideo = current; setPlaying(true); }} onPause={e => { if (activeVideo === e.currentTarget) activeVideo = null; setPlaying(false); }} onEnded={() => setPlaying(false)} onTimeUpdate={e => setTime(e.currentTarget.currentTime)} onLoadedMetadata={e => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)} onError={() => setError(true)} />
    {isFeedPreview ? <button type="button" aria-label="Open reel" onClick={onOpenReel} className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-white"><span className="sr-only">Open video in Watch</span></button> : <button type="button" onClick={() => { setShowControls(value => !value); void toggle(); }} aria-label={playing ? "Pause video" : "Play video"} className="absolute inset-0 z-10 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-white">{!playing && !error && <span className="flex size-16 items-center justify-center rounded-full bg-black/50 shadow-lg backdrop-blur-sm"><Play fill="currentColor" className="ml-1 size-8" /></span>}</button>}
    {error && <p role="status" className="absolute inset-x-4 top-1/2 z-20 text-center text-sm">This video could not be loaded.</p>}
    {isFeedPreview ? <button type="button" aria-label={muted ? "Turn sound on" : "Mute video"} onClick={event => { event.stopPropagation(); void toggleMuted(); }} className="absolute bottom-3 right-3 z-20 flex size-9 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/70">{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button> : <><button type="button" aria-label={muted ? "Turn sound on" : "Mute reel"} onClick={e => { e.stopPropagation(); void toggleMuted(); }} className="absolute right-3 top-3 z-50 flex size-10 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/85">{muted ? <VolumeX size={19} /> : <Volume2 size={19} />}</button><div className={`absolute inset-0 z-30 flex flex-col justify-end transition-opacity duration-200 ${showControls ? "opacity-100" : "pointer-events-none opacity-0"}`}><div className="pointer-events-auto absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-4"><button type="button" aria-label="Rewind 5 seconds" onClick={e => { e.stopPropagation(); skip(-5); }} className="relative flex size-12 items-center justify-center rounded-full border border-white/25 bg-black/65 text-white shadow-lg backdrop-blur-sm"><RotateCcw size={26} /><span className="absolute text-[11px] font-extrabold">5</span></button><button type="button" aria-label={playing ? "Pause" : "Play"} onClick={e => { e.stopPropagation(); void toggle(); }} className="flex size-14 items-center justify-center rounded-full border border-white/25 bg-black/70 text-white shadow-lg backdrop-blur-sm">{playing ? <Pause size={29} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />}</button><button type="button" aria-label="Forward 5 seconds" onClick={e => { e.stopPropagation(); skip(5); }} className="relative flex size-12 items-center justify-center rounded-full border border-white/25 bg-black/65 text-white shadow-lg backdrop-blur-sm"><RotateCw size={26} /><span className="absolute text-[11px] font-extrabold">5</span></button></div><div className="pointer-events-auto absolute bottom-4 left-3 right-3 flex items-center gap-2 text-white"><span className="text-[11px] font-semibold tabular-nums drop-shadow">{clock(time)}</span><input aria-label="Video progress" type="range" min={0} max={duration || 1} step={0.1} value={time} onChange={e => { if (ref.current) ref.current.currentTime = Number(e.target.value); }} className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/60 [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-white/60 [&::-webkit-slider-thumb]:mt-[-3px] [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white" /><span className="text-[11px] font-semibold tabular-nums drop-shadow">{clock(duration)}</span></div></div></>}
  </div>;
}
