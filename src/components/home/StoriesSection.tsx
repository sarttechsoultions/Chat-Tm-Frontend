"use client";
import { useEffect, useState } from "react";
import StoryActions from "../stories/StoryActions";
import { StoryVideo, StoryAudio } from "../stories/StoryTools";
import { imageStyle } from "../stories/StoryImage";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, Trash2, Pause, Play, Eye } from "lucide-react";
import { listStories, getStoryViewers, viewStory, deleteStory, type Story } from "../../lib/api/stories";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { UserAvatar } from "../ui/UserAvatar";
export default function StoriesSection() {
  const [actionsBusy, setActionsBusy] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewers, setViewers] = useState<Awaited<ReturnType<typeof getStoryViewers>>["items"]>([]);
  const [viewerError, setViewerError] = useState("");
  const [viewersLoading, setViewersLoading] = useState(false);
  const [stories, setStories] = useState<Story[]>([]); const [active, setActive] = useState<string | null>(null); const [error, setError] = useState(""); const [paused, setPaused] = useState(false); const [progress, setProgress] = useState(0); const me = useCurrentUser();
  useEffect(() => { const load = () => listStories().then(data => { setStories(data.items); }).catch(() => setError("Unable to load stories.")); void load(); const timer = setInterval(() => void load(), 60000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (!stories.length) return; const requested = new URLSearchParams(window.location.search).get("story"); if (!requested) return; const found = stories.find(item=>item.id===requested); if (found) setActive(found.id); else setError("Story expired or unavailable for your audience."); const url = new URL(window.location.href); url.searchParams.delete("story"); window.history.replaceState(null,"",url); }, [stories]);
  const available = stories.filter(story => new Date(story.expiresAt).getTime() > Date.now());
  const index = available.findIndex(story => story.id === active); const story = available[index]; const video = !!story && /\/video\/|\.(mp4|webm|mov)(\?|$)/i.test(story.mediaUrl);
  function move(direction: number) { setActive(available[index + direction]?.id || null); setPaused(false); }
  useEffect(() => { setProgress(0); if (!active) return; void viewStory(active).then(() => setStories(items => items.map(item => item.id === active ? { ...item, viewed: true } : item))).catch(() => setError("Story unavailable.")); }, [active]);
  useEffect(() => { if (!story || paused || video || viewersOpen || actionsBusy) return; const timer = setInterval(() => setProgress(value => Math.min(100, value + 2)), 100); return () => clearInterval(timer); }, [story?.id, paused, video, viewersOpen, actionsBusy]);
  useEffect(() => { if (progress >= 100) move(1); }, [progress]);
  useEffect(() => { if (!active) return; const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); if (e.key === "ArrowRight") move(1); if (e.key === "ArrowLeft") move(-1); }; document.addEventListener("keydown", handler); return () => document.removeEventListener("keydown", handler); }, [active, index, stories]);
  useEffect(() => { setViewersOpen(false); }, [active]);
  useEffect(() => {
    if (!viewersOpen || !active) return;
    let cancelled = false;
    const refresh = () => getStoryViewers(active).then(data => { if (!cancelled) { setViewers(data.items); setStories(items=>items.map(item=>item.id===active?{...item,viewsCount:data.count}:item)); setViewerError(""); } }).catch(()=>{ if (!cancelled) setViewerError("Unable to load viewers."); }).finally(()=>{if (!cancelled) setViewersLoading(false);});
    setViewersLoading(true); setViewers([]); void refresh(); const timer=setInterval(()=>void refresh(),10000);
    return ()=>{cancelled=true;clearInterval(timer);};
  }, [viewersOpen, active]);
  return <section className="relative rounded-2xl bg-white p-4 shadow-sm"><h2 className="mb-3 font-bold text-[#0B1C30]">Stories</h2>{error && <p role="status" className="mb-2 text-xs text-red-600">{error}</p>}<div className="no-scrollbar flex gap-3 overflow-x-auto">
    <Link href="/create-story" className="flex h-40 w-28 shrink-0 flex-col items-center justify-center gap-3 rounded-xl bg-[#e7f3f3] text-center text-xs font-semibold text-[#00696F]"><span className="flex size-10 items-center justify-center rounded-full bg-[#00696F] text-2xl text-white">+</span>Create story</Link>
    {available.map(item => <button key={item.id} onClick={() => { setActive(item.id); setPaused(false); }} className="relative h-40 w-28 shrink-0 overflow-hidden rounded-xl bg-[#101820] text-left">{/\/video\/|\.(mp4|webm|mov)(\?|$)/i.test(item.mediaUrl) ? <video src={item.mediaUrl} muted preload="metadata" className="size-full object-cover" /> : <img src={item.mediaUrl} alt="" className="size-full object-cover" />}<div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" /><div className={`absolute left-2 top-2 rounded-full ring-2 ${item.viewed ? "ring-gray-300" : "ring-[#16b4b8]"}`}><UserAvatar avatarUrl={item.author.avatar} name={item.author.firstName} size={30} /></div><span className="absolute inset-x-2 bottom-2 truncate text-xs font-semibold text-white">{item.authorId === me?.id ? "Your story" : item.author.firstName}</span></button>)}
  </div>
  {story && <div role="dialog" aria-modal="true" aria-label="Story viewer" className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080e14]/95 p-3"><button autoFocus aria-label="Close story" onClick={() => setActive(null)} className="absolute right-4 top-4 z-20 rounded-full bg-white/15 p-3 text-white"><X /></button><div className="relative flex aspect-[9/16] max-h-[90dvh] w-full max-w-[420px] items-center justify-center overflow-hidden rounded-2xl bg-black text-white">
    {video ? <StoryVideo forcePause={actionsBusy || viewersOpen} key={story.id} src={story.mediaUrl} muted={!!story.presentation?.musicUrl} onEnded={() => move(1)} onProgress={setProgress} onPlaying={playing => setPaused(!playing)} /> : <img src={story.mediaUrl} alt="Story" className="size-full object-contain" style={story.presentation?.imageTransform ? imageStyle(story.presentation.imageTransform) : undefined} />}
    {story.presentation?.musicUrl && <StoryAudio key={story.id} src={story.presentation.musicUrl} paused={paused} />}

    <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent p-3"><div className="mb-3 h-1 overflow-hidden rounded-full bg-white/30"><div className="h-full bg-white" style={{ width: `${progress}%` }} /></div><div className="flex items-center gap-2"><UserAvatar avatarUrl={story.author.avatar} name={story.author.firstName} size={32} /><span className="flex-1 text-sm font-semibold">{story.author.firstName}</span>{!video && <button aria-label={paused ? "Resume story" : "Pause story"} onClick={() => setPaused(!paused)}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>}{story.authorId === me?.id && <button aria-label="Delete story" onClick={async () => { try { await deleteStory(story.id); setStories(items => items.filter(item => item.id !== story.id)); setActive(null); } catch { setError("Unable to delete story."); } }}><Trash2 size={18} /></button>}</div></div>
    {story.presentation?.texts?.map(layer=><p key={layer.id} className="pointer-events-none absolute max-w-[90%] whitespace-pre-wrap break-words p-2 drop-shadow-md" style={{left:layer.position.x+"%",top:layer.position.y+"%",transform:"translate(-50%,-50%)",fontFamily:layer.fontFamily,fontSize:layer.size,color:layer.color,fontWeight:layer.bold?700:400,fontStyle:layer.italic?"italic":"normal",textAlign:layer.align}}>{layer.text}</p>)}
    {story.caption && <p className="pointer-events-none absolute max-w-[90%] whitespace-pre-wrap break-words text-center font-bold drop-shadow-md" style={{ left: (story.presentation?.textPosition?.x ?? 50) + "%", top: (story.presentation?.textPosition?.y ?? 80) + "%", transform: "translate(-50%, -50%)", color: story.presentation?.textColor || "#ffffff", fontFamily: story.presentation?.fontFamily || "inherit", fontWeight: story.presentation?.bold === false ? 400 : 700, fontStyle: story.presentation?.italic ? "italic" : "normal", textAlign: story.presentation?.align || "center", fontSize: story.presentation?.textSize || 24 }}>{story.caption}</p>}
    {story.presentation?.time && <span className="pointer-events-none absolute rounded-xl bg-white/90 px-4 py-2 text-lg font-semibold text-[#0B1C30]" style={{ left: (story.presentation.timePosition?.x ?? 50) + "%", top: (story.presentation.timePosition?.y ?? 20) + "%", transform: "translate(-50%,-50%)" }}>{story.presentation.time}</span>}

    {story.authorId === me?.id && <button onClick={()=>setViewersOpen(true)} className="absolute bottom-5 left-4 z-30 flex items-center gap-2 rounded-full bg-black/75 px-4 py-2 text-sm font-semibold text-white shadow-lg"><Eye size={18}/>{story.viewsCount || 0} views<span className="ml-1 text-white/70">⌃</span></button>}
    {index > 0 && <button aria-label="Previous story" onClick={() => move(-1)} className="absolute left-2 top-1/2 rounded-full bg-black/50 p-2"><ChevronLeft /></button>}<button aria-label="Next story" onClick={() => move(1)} className="absolute right-2 top-1/2 rounded-full bg-black/50 p-2"><ChevronRight /></button>
    <StoryActions key={story.id} story={story} own={story.authorId===me?.id} onBusy={setActionsBusy}/>
    {viewersOpen && story.authorId===me?.id && <section aria-label="Story viewers" className="absolute inset-x-0 bottom-0 z-30 max-h-[65%] overflow-y-auto rounded-t-2xl bg-white p-5 text-[#0B1C30] shadow-xl"><div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 font-semibold"><Eye size={18}/>{story.viewsCount || 0} views</h3><button aria-label="Close viewers" onClick={()=>setViewersOpen(false)} className="rounded-full bg-gray-100 p-2"><X size={16}/></button></div>{viewersLoading?<p className="text-sm text-gray-500">Loading viewers…</p>:viewerError?<p role="alert" className="text-sm text-red-600">{viewerError}</p>:!viewers.length?<p className="py-6 text-center text-sm text-gray-500">No views yet. People who see your story will appear here.</p>:viewers.map(view=><div key={view.user.id} className="flex items-center gap-3 py-3"><UserAvatar avatarUrl={view.user.avatar} name={view.user.firstName} size={36}/><div className="min-w-0"><p className="truncate text-sm font-semibold">{view.user.firstName} {view.user.lastName}</p><p className="text-xs text-gray-500">{new Date(view.viewedAt).toLocaleString()}</p></div></div>)}</section>}
  </div></div>}
  </section>;
}
