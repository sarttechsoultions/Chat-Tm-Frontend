"use client";
import { useEffect, useState } from "react";
import { listStories, type Story } from "../../lib/api/stories";
import { imageStyle } from "../stories/StoryImage";
let pending: Promise<Story[]> | null = null;
function load() {
  if (!pending) {
    pending = listStories().then(data => data.items).catch(error => { pending = null; throw error; });
    setTimeout(() => { pending = null; }, 30000);
  }
  return pending;
}
export default function StoryReplyPreview({ id, mine }: { id: string; mine: boolean }) {
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setFailed(false); setStory(null);
    void load().then(items => { if (!cancelled) setStory(items.find(item => item.id === id) || null); }).catch(() => { if (!cancelled) setFailed(true); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);
  const available = story && Date.parse(story.expiresAt) > Date.now();
  const video = story && /\/video\/|resource_type=video|\.(mp4|webm|mov)(\?|$)/i.test(story.mediaUrl);
  return <div className="mb-2"><p className="mb-2 text-[11px] opacity-75">{mine ? "You replied to a story" : "Replied to your story"}</p>{loading ? <div role="status" className="h-60 w-36 animate-pulse rounded-xl bg-black/15"><span className="sr-only">Loading story preview</span></div> : available && !failed ? <a href={`/?story=${encodeURIComponent(id)}`} aria-label="Open story" className="relative block aspect-[9/16] w-36 overflow-hidden rounded-lg bg-black">{video ? <video src={story.mediaUrl} muted playsInline preload="metadata" onError={() => setFailed(true)} className="absolute inset-0 size-full object-contain"/> : <img loading="lazy" decoding="async" src={story.mediaUrl} alt="Story preview" onError={() => setFailed(true)} className="absolute inset-0 size-full object-contain" style={story.presentation?.imageTransform ? imageStyle(story.presentation.imageTransform) : undefined}/>}<div className="pointer-events-none absolute inset-0" style={{containerType:"inline-size"}}>{story.presentation?.texts?.map(layer => <span key={layer.id} className="absolute max-w-[90%] whitespace-pre-wrap break-words" style={{left:`${layer.position.x}%`,top:`${layer.position.y}%`,transform:"translate(-50%,-50%)",fontSize:`${layer.size / 3.8}cqw`,color:layer.color,fontFamily:layer.fontFamily,fontWeight:layer.bold?700:400,fontStyle:layer.italic?"italic":"normal",textAlign:layer.align}}>{layer.text}</span>)}</div>{video && <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">Video</span>}</a> : <p className="rounded-lg bg-black/10 px-3 py-3 text-xs opacity-75">{failed ? "Story preview unavailable" : "Story expired or unavailable"}</p>}</div>;
}
