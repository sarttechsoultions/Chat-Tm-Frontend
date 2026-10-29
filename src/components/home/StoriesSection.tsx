"use client";
import { useEffect, useRef, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import StoryActions from "../stories/StoryActions";
import { StoryVideo, StoryAudio } from "../stories/StoryTools";
import { imageStyle } from "../stories/StoryImage";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, Trash2, Pause, Play, Eye, Plus, LoaderCircle, RotateCcw, Volume2, VolumeX, Star } from "lucide-react";
import { listStories, getStoryViewers, viewStory, deleteStory, type Story } from "../../lib/api/stories";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { UserAvatar } from "../ui/UserAvatar";
export default function StoriesSection() {
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const [muted, setMuted] = useState(false);
  const [holding, setHolding] = useState(false);
  const [mediaErrorId, setMediaErrorId] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const socket = useSocket();
  const [readyId, setReadyId] = useState<string | null>(null); const [hidden, setHidden] = useState(false);
  const [loadingStories, setLoadingStories] = useState(true);
  const [actionsBusy, setActionsBusy] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewers, setViewers] = useState<Awaited<ReturnType<typeof getStoryViewers>>["items"]>([]);
  const [viewerError, setViewerError] = useState("");
  const [viewersLoading, setViewersLoading] = useState(false);
  const [stories, setStories] = useState<Story[]>([]); const [active, setActive] = useState<string | null>(null); const [error, setError] = useState(""); const [paused, setPaused] = useState(false); const [progress, setProgress] = useState(0); const me = useCurrentUser();
  useEffect(() => { const load = () => listStories().then(data => { setStories(data.items); }).catch(() => setError("Unable to load stories.")).finally(()=>setLoadingStories(false)); void load(); const timer = setInterval(() => void load(), 60000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (!stories.length) return; const requested = new URLSearchParams(window.location.search).get("story"); if (!requested) return; const found = stories.find(item=>item.id===requested); if (found) setActive(found.id); else setError("Story expired or unavailable for your audience."); const url = new URL(window.location.href); url.searchParams.delete("story"); window.history.replaceState(null,"",url); }, [stories]);
  const groups = Array.from(stories.filter(story => new Date(story.expiresAt).getTime() > Date.now()).reduce((map, item) => { const group = map.get(item.authorId) || []; group.push(item); map.set(item.authorId, group); return map; }, new Map<string, Story[]>()).values()).map(items => items.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))); const available = groups.flat();
  const index = available.findIndex(story => story.id === active); const story = available[index]; const video = !!story && /\/video\/|resource_type=video|\.(mp4|webm|mov)(\?|$)/i.test(story.mediaUrl);
  const nextMediaUrl = available[index + 1]?.mediaUrl;
  useEffect(() => {
    if (!active || !nextMediaUrl || /\/video\/|resource_type=video|\.(mp4|webm|mov)(\?|$)/i.test(nextMediaUrl)) return;
    const image = new Image();
    image.src = nextMediaUrl;
  }, [active, nextMediaUrl]);
  function move(direction: number) { setProgress(0); setReadyId(null); setActive(available[index + direction]?.id || null); setPaused(false); }
  useEffect(() => { setProgress(0); }, [active]);
  useEffect(() => { const update = () => setHidden(document.hidden); update(); document.addEventListener("visibilitychange", update); return () => document.removeEventListener("visibilitychange", update); }, []);
  useEffect(() => { if (!active || readyId !== active || hidden) return; void viewStory(active).then(() => setStories(items => items.map(item => item.id === active ? { ...item, viewed: true } : item))).catch(() => setError("Story unavailable.")); }, [active, readyId, hidden]);
  useEffect(() => { if (!story || readyId !== story.id || hidden || holding || paused || video || viewersOpen || actionsBusy) return; const timer = setInterval(() => setProgress(value => Math.min(100, value + 2)), 100); return () => clearInterval(timer); }, [story?.id, readyId, hidden, holding, paused, video, viewersOpen, actionsBusy]);
  useEffect(() => { if (!video && progress >= 100) move(1); }, [progress]);
  useEffect(() => { if (!active) return; const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); if (e.key === "ArrowRight") move(1); if (e.key === "ArrowLeft") move(-1); }; document.addEventListener("keydown", handler); return () => document.removeEventListener("keydown", handler); }, [active, index, stories]);
  useEffect(() => { setViewersOpen(false); }, [active]);
  useEffect(() => {
    if (!viewersOpen || !active) return;
    let cancelled = false;
    const refresh = () => getStoryViewers(active).then(data => { if (!cancelled) { setViewers(data.items); setStories(items=>items.map(item=>item.id===active?{...item,viewsCount:data.count}:item)); setViewerError(""); } }).catch(()=>{ if (!cancelled) setViewerError("Unable to load viewers."); }).finally(()=>{if (!cancelled) setViewersLoading(false);});
    setViewersLoading(true); setViewers([]); void refresh(); const timer=setInterval(()=>void refresh(),10000);
    return ()=>{cancelled=true;clearInterval(timer);};
  }, [viewersOpen, active]);
  useEffect(() => {
    if (!socket) return;
    const refresh = (event: { storyId: string; count: number }) => {
      setStories(items => items.map(item => item.id === event.storyId ? { ...item, viewsCount: Math.max(item.viewsCount || 0, event.count) } : item));
      if (viewersOpen && active === event.storyId) {
        void getStoryViewers(event.storyId).then(data => setViewers(data.items)).catch(() => setViewerError("Unable to refresh viewers."));
      }
    };
    const reconcile = () => { void listStories().then(data => setStories(data.items)).catch(() => {}); };
    socket.on("story_views_updated", refresh);
    socket.on("connect", reconcile);
    return () => { socket.off("story_views_updated", refresh); socket.off("connect", reconcile); };
  }, [socket, active, viewersOpen]);
  return <section className="relative rounded-2xl bg-white p-4 shadow-sm"><h2 className="mb-3 font-bold text-[#0B1C30]">Stories</h2>{error && <p role="status" className="mb-2 text-xs text-red-600">{error}</p>}<div className="no-scrollbar flex gap-3 overflow-x-auto">
    <Link href="/create-story" className="group flex h-40 w-28 shrink-0 flex-col items-center justify-center gap-3 rounded-xl border border-[#d8ebeb] bg-gradient-to-b from-[#eff8f8] to-[#e1f0f0] text-center text-xs font-semibold text-[#00696F] transition hover:border-[#9bcaca] hover:shadow-sm focus-visible:outline-2 focus-visible:outline-[#00696F]"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#00696F] text-white shadow-[0_4px_12px_rgba(0,105,111,0.2)] transition-transform group-hover:scale-105"><Plus aria-hidden="true" size={24} strokeWidth={2.5}/></span>Create story</Link>
    {loadingStories && <div role="status" aria-label="Loading stories" className="flex shrink-0 gap-3"><span className="sr-only">Loading stories</span>{[0,1,2,3].map(i=><div key={i} aria-hidden="true" className="relative h-40 w-28 shrink-0 overflow-hidden rounded-xl bg-[#edf2f5] motion-safe:animate-pulse"><div className="absolute left-2 top-2 size-8 rounded-full bg-[#dce6ed]"/><div className="absolute bottom-3 left-2 h-2.5 w-16 rounded-full bg-[#dce6ed]"/></div>)}</div>}
    {groups.map(items => { const item = items.find(entry => !entry.viewed) || items[0]; return <button key={item.authorId} onClick={() => { setActive(item.id); setPaused(false); }} className="relative h-40 w-28 shrink-0 overflow-hidden rounded-xl bg-[#101820] text-left">{/\/video\/|resource_type=video|\.(mp4|webm|mov)(\?|$)/i.test(item.mediaUrl) ? <video src={item.mediaUrl} muted preload="metadata" className="size-full object-cover" /> : <img decoding="async" src={item.mediaUrl} alt="" className="size-full object-cover" />}<div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" /><div className={`absolute left-2 top-2 rounded-full ring-2 ${items.every(entry => entry.viewed) ? "ring-gray-300" : "ring-[#16b4b8]"}`}><UserAvatar avatarUrl={item.author.avatar} name={item.author.firstName} size={30} /></div><span className="absolute inset-x-2 bottom-2 truncate text-xs font-semibold text-white">{item.authorId === me?.id ? "Your story" : item.author.firstName}</span></button>; })}
  </div>
  {story && <div role="dialog" aria-modal="true" aria-label="Story viewer" className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080e14]/95 p-3"><button autoFocus aria-label="Close story" onClick={() => setActive(null)} className="absolute right-4 top-4 z-20 rounded-full bg-white/15 p-3 text-white"><X /></button><div key={story.id} onPointerDown={e => {
      if (e.pointerType !== "touch" || (e.target as HTMLElement).closest("button:not([data-story-media]), a, input, textarea, [aria-label=\"Story viewers\"]")) return;
      gesture.current = { x: e.clientX, y: e.clientY }; setHolding(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }} onPointerUp={e => {
      const start = gesture.current; gesture.current = null; setHolding(false);
      if (!start) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
      else if (dy < -55 && story.authorId === me?.id) setViewersOpen(true);
    }} onPointerCancel={() => { gesture.current = null; setHolding(false); }} onLostPointerCapture={() => { gesture.current = null; setHolding(false); }} style={{ touchAction: "none" }} className="relative flex aspect-[9/16] w-[min(420px,calc(90dvh*9/16),calc(100vw-24px))] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-black text-white">
    {video ? <StoryVideo touchGestures forcePause={actionsBusy || viewersOpen || hidden || holding} onReady={() => { setMediaErrorId(null); setReadyId(story.id); }} onError={() => { setReadyId(null); setMediaErrorId(story.id); }} key={`${story.id}-${retry}`} src={story.mediaUrl} muted={muted || !!story.presentation?.musicUrl} onEnded={() => move(1)} onProgress={setProgress} onPlaying={playing => setPaused(!playing)} /> : <img fetchPriority="high" decoding="async" key={`${story.id}-${retry}`} onLoad={() => { setMediaErrorId(null); setReadyId(story.id); }} onError={() => { setReadyId(null); setMediaErrorId(story.id); }} src={story.mediaUrl} alt="Story" className="absolute inset-0 size-full object-contain" style={story.presentation?.imageTransform ? imageStyle(story.presentation.imageTransform) : undefined} />}
    {readyId !== story.id && <div role="status" className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/60 text-white">{mediaErrorId === story.id ? <><p className="text-sm">Unable to load story</p><button onClick={() => { setMediaErrorId(null); setReadyId(null); setRetry(value => value + 1); }} className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm"><RotateCcw size={16}/>Retry</button></> : <><LoaderCircle aria-hidden="true" className="animate-spin" size={28}/><span className="text-sm">Loading story…</span></>}</div>}
    {story.presentation?.musicUrl && <StoryAudio key={story.id} src={story.presentation.musicUrl} muted={muted} paused={paused || holding || hidden || actionsBusy || viewersOpen || readyId !== story.id} />}

    <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent p-3"><div className="mb-3 flex gap-1">{(groups.find(items => items[0].authorId === story.authorId) || []).map(item => <div key={item.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"><div className="h-full bg-white" style={{ width: `${item.id === story.id ? progress : Date.parse(item.createdAt) < Date.parse(story.createdAt) ? 100 : 0}%` }} /></div>)}</div><div className="flex items-center gap-2"><UserAvatar avatarUrl={story.author.avatar} name={story.author.firstName} size={32} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{story.author.firstName}</p><p className="mt-0.5 text-[11px] text-white/70">{Math.max(1, Math.floor((Date.now() - Date.parse(story.createdAt)) / 60000)) < 60 ? `${Math.max(1, Math.floor((Date.now() - Date.parse(story.createdAt)) / 60000))}m ago` : `${Math.floor((Date.now() - Date.parse(story.createdAt)) / 3600000)}h ago`}</p>{story.presentation?.audience === "CLOSE_FRIENDS" && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-600 px-2 py-0.5 text-[10px]"><Star size={10}/>Close friends</span>}</div>{(video || story.presentation?.musicUrl) && <button aria-label={muted ? "Unmute story" : "Mute story"} onClick={() => setMuted(value => !value)}>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button>}{!video && <button aria-label={paused ? "Resume story" : "Pause story"} onClick={() => setPaused(!paused)}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>}{story.authorId === me?.id && <button aria-label="Delete story" onClick={async () => { if (!window.confirm("Delete this story? This cannot be undone.")) return; try { await deleteStory(story.id); setStories(items => items.filter(item => item.id !== story.id)); setActive(null); } catch { setError("Unable to delete story."); } }}><Trash2 size={18} /></button>}</div></div>
    {story.presentation?.texts?.map(layer=><p key={layer.id} className="pointer-events-none absolute max-w-[90%] whitespace-pre-wrap break-words p-2 drop-shadow-md" style={{left:layer.position.x+"%",top:layer.position.y+"%",transform:"translate(-50%,-50%)",fontFamily:layer.fontFamily,fontSize:layer.size,color:layer.color,fontWeight:layer.bold?700:400,fontStyle:layer.italic?"italic":"normal",textAlign:layer.align}}>{layer.text}</p>)}
    {story.caption && <p className="pointer-events-none absolute max-w-[90%] whitespace-pre-wrap break-words text-center font-bold drop-shadow-md" style={{ left: (story.presentation?.textPosition?.x ?? 50) + "%", top: (story.presentation?.textPosition?.y ?? 80) + "%", transform: "translate(-50%, -50%)", color: story.presentation?.textColor || "#ffffff", fontFamily: story.presentation?.fontFamily || "inherit", fontWeight: story.presentation?.bold === false ? 400 : 700, fontStyle: story.presentation?.italic ? "italic" : "normal", textAlign: story.presentation?.align || "center", fontSize: story.presentation?.textSize || 24 }}>{story.caption}</p>}
    {story.presentation?.time && <span className="pointer-events-none absolute w-max max-w-[90%] whitespace-nowrap rounded-xl bg-white/90 px-4 py-2 text-lg font-semibold text-[#0B1C30]" style={{ left: `clamp(72px, ${story.presentation.timePosition?.x ?? 50}%, calc(100% - 72px))`, top: `clamp(28px, ${story.presentation.timePosition?.y ?? 20}%, calc(100% - 28px))`, transform: "translate(-50%,-50%)" }}>{story.presentation.time}</span>}

    {story.authorId === me?.id && <button onClick={()=>setViewersOpen(true)} className="absolute bottom-5 left-4 z-30 flex items-center gap-2 rounded-full bg-black/75 px-4 py-2 text-sm font-semibold text-white shadow-lg"><Eye size={18}/>{story.viewsCount || 0} views<span className="ml-1 text-white/70">⌃</span></button>}
    {index > 0 && <button aria-label="Previous story" onClick={() => move(-1)} className="absolute left-2 top-1/2 rounded-full bg-black/50 p-2"><ChevronLeft /></button>}<button aria-label="Next story" onClick={() => move(1)} className="absolute right-2 top-1/2 rounded-full bg-black/50 p-2"><ChevronRight /></button>
    {me && story.authorId !== me.id && <StoryActions key={story.id} story={story} own={false} onBusy={setActionsBusy}/>}
    {viewersOpen && story.authorId===me?.id && <section aria-label="Story viewers" className="absolute inset-x-0 bottom-0 z-30 max-h-[65%] overflow-y-auto rounded-t-2xl bg-white p-5 text-[#0B1C30] shadow-xl"><div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 font-semibold"><Eye size={18}/>{story.viewsCount || 0} views</h3><button aria-label="Close viewers" onClick={()=>setViewersOpen(false)} className="rounded-full bg-gray-100 p-2"><X size={16}/></button></div>{viewersLoading?<p className="text-sm text-gray-500">Loading viewers…</p>:viewerError?<p role="alert" className="text-sm text-red-600">{viewerError}</p>:!viewers.length?<p className="py-6 text-center text-sm text-gray-500">No views yet. People who see your story will appear here.</p>:viewers.map(view=><div key={view.user.id} className="flex items-center gap-3 py-3"><UserAvatar avatarUrl={view.user.avatar} name={view.user.firstName} size={36}/><div className="min-w-0"><p className="truncate text-sm font-semibold">{view.user.firstName} {view.user.lastName}</p><p className="text-xs text-gray-500">{new Date(view.viewedAt).toLocaleString()}</p></div></div>)}</section>}
  </div></div>}
  </section>;
}
