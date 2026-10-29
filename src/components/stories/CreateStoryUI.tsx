"use client";
import { useEffect, useRef, useState } from "react";
import StoryAudience from "./StoryAudience";
import StoryImage, { initialImageTransform } from "./StoryImage";
import { StoryVideo } from "./StoryTools";
import Link from "next/link";
import { Clock, Music } from "lucide-react";
import { useRouter } from "next/navigation";
import { createStory, type StoryTextLayer } from "../../lib/api/stories";
const colors = ["#00696F", "#284b8b", "#923b76", "#b35232", "#243746"];
export default function CreateStoryUI() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audience, setAudience] = useState("FRIENDS");
  const [imageTransform, setImageTransform] = useState(initialImageTransform);
  const [imageOpen, setImageOpen] = useState(false);
  const [layers, setLayers] = useState<StoryTextLayer[]>([]);
  const [selectedId, setSelectedId] = useState("initial");
  const [textOpen, setTextOpen] = useState(false);
  const [fontFamily, setFontFamily] = useState<"inherit" | "serif" | "monospace" | "cursive">("inherit");
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const [align, setAlign] = useState<"left" | "center" | "right">("center");
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [timePosition, setTimePosition] = useState({ x: 50, y: 20 });
  const timeDrag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [time, setTime] = useState("");
  const [music, setMusic] = useState<File | null>(null);
  const [musicUrl, setMusicUrl] = useState("");
  const [size, setSize] = useState(24);
  const [ink, setInk] = useState("#ffffff");
  const musicInput = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!music) { setMusicUrl(""); return; } const url = URL.createObjectURL(music); setMusicUrl(url); return () => URL.revokeObjectURL(url); }, [music]);
  const router = useRouter(); const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null); const [url, setUrl] = useState(""); const [text, setText] = useState(""); const [mode, setMode] = useState("photo"); const [color, setColor] = useState(colors[0]); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { if (!file) { setUrl(""); return; } const value = URL.createObjectURL(file); setUrl(value); return () => URL.revokeObjectURL(value); }, [file]);
  function choose(value?: File) { if (!value) return; if (!["image/jpeg", "image/png", "image/webp", "video/mp4"].includes(value.type) || value.size > 50 * 1024 * 1024) { setError("Choose JPG, PNG, WEBP or MP4 up to 50MB."); return; } setError(""); setImageTransform(initialImageTransform); setFile(value); }
  function currentLayer(): StoryTextLayer { return { id: selectedId, text, position, fontFamily, bold, italic, align, size, color: ink }; }
  function allLayers() { return [...layers.filter(layer => layer.id !== selectedId), currentLayer()].filter(layer => layer.text.trim()); }
  function selectLayer(layer: StoryTextLayer) {
    setImageOpen(false);
    setLayers(allLayers()); setSelectedId(layer.id); setText(layer.text); setPosition(layer.position); setFontFamily(layer.fontFamily); setBold(layer.bold); setItalic(layer.italic); setAlign(layer.align); setSize(layer.size); setInk(layer.color); setTextOpen(true);
  }
  function addText() {
    setImageOpen(false);
    if (allLayers().length >= 10) { setError("You can add up to 10 text blocks."); return; }
    setLayers(allLayers()); setSelectedId(crypto.randomUUID()); setText(""); setPosition({ x: 50, y: Math.min(80, 40 + allLayers().length * 8) }); setTextOpen(true);
  }
  async function share() {
    if (busy) return; setUploadProgress(0); setBusy(true); setError("");
    try {
      let media = file;
      if (mode === "text") {
        if (!allLayers().length) throw new Error("Write something for your story.");
        const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1920; const ctx = canvas.getContext("2d")!; ctx.fillStyle = color; ctx.fillRect(0, 0, 1080, 1920);         const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png")); if (!blob) throw new Error("Unable to prepare story"); media = new File([blob], "story.png", { type: "image/png" });
      }
      if (!media) throw new Error("Choose a photo or video."); await createStory(media, "", { imageTransform: mode === "photo" && file?.type.startsWith("image/") ? imageTransform : undefined, texts: allLayers(), fontFamily, bold, italic, align, textPosition: position, timePosition, time, textSize: size, textColor: ink }, music, audience, setUploadProgress); router.push("/"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to share story"); } finally { setBusy(false); }
  }
  return <div className="fixed inset-0 z-[60] flex flex-col bg-black md:static md:z-auto md:mx-auto md:grid md:w-full md:max-w-[1360px] md:grid-cols-[260px_1fr] md:gap-6 md:bg-transparent md:p-3 md:pb-24">
    <section className="hidden h-fit rounded-2xl bg-white p-5 md:block"><Link href="/" className="text-sm text-[#00696F]">← Back to home</Link><h1 className="mt-4 text-2xl font-bold">Create story</h1><p className="mt-2 text-sm text-gray-500">Share a moment. Visible for 24 hours.</p>
      <div className="mt-4"><StoryAudience value={audience} onChange={setAudience}/></div>
      <div className="my-5 flex gap-2">{["photo", "text"].map(item => <button key={item} onClick={() => { setMode(item); if (item === "text") setTextOpen(true); }} className={`rounded-lg px-4 py-2 text-sm ${mode === item ? "bg-[#00696F] text-white" : "bg-gray-100"}`}>{item === "photo" ? "Photo / video" : "Text"}</button>)}</div>
      {mode === "photo" ? <><input ref={input} type="file" accept="image/jpeg,image/png,image/webp,video/mp4" className="hidden" onChange={e => choose(e.target.files?.[0])} /><button onClick={() => input.current?.click()} className="w-full rounded-xl border border-dashed border-[#00696F] p-4 text-sm text-[#00696F]">{file ? "Change media" : "Choose photo or video"}</button><p className="mt-2 text-xs text-gray-500">Up to 50MB · Videos over 30 seconds use only the first 30 seconds.</p></> : <div className="flex gap-3">{colors.map(value => <button key={value} aria-label={`Background ${value}`} onClick={() => setColor(value)} style={{ background: value }} className={`size-8 rounded-full ${color === value ? "ring-2 ring-[#00696F] ring-offset-2" : ""}`} />)}</div>}
      {mode === "photo" && file?.type.startsWith("image/") && <button onClick={()=>{setImageOpen(!imageOpen);setTextOpen(false);}} className="mt-4 w-full rounded-xl bg-[#edf5f5] p-3 text-left text-sm font-semibold text-[#00696F]">⤢ Edit image</button>}
      <div className="mt-5 space-y-2 border-t border-[#e5eeee] pt-4">
<button aria-expanded={textOpen} onClick={()=>{setImageOpen(false);setTextOpen(!textOpen);}} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#0B1C30] hover:bg-[#edf5f5]"><span className="flex size-9 items-center justify-center rounded-full bg-[#e5f0f0] text-lg text-[#00696F]">Aa</span>{text ? "Edit selected text" : "Add text"}<span className="ml-auto text-gray-400">›</span></button>
<button onClick={addText} className="w-full rounded-xl border border-[#cce4e4] p-3 text-left text-sm font-semibold text-[#00696F]">＋ Add another text</button>
{layers.filter(layer=>layer.id!==selectedId).map(layer=><button key={layer.id} onClick={()=>selectLayer(layer)} className="block w-full truncate rounded-lg bg-gray-50 px-3 py-2 text-left text-xs">Aa · {layer.text}</button>)}
      <button onClick={()=>setTime(time ? "" : new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}))} className="w-full rounded-xl bg-[#edf5f5] p-3 text-left text-sm text-[#00696F]"><Clock aria-hidden="true" size={16} className="inline-block align-middle" /> {time ? "Remove time" : "Add time"}</button>
      <input ref={musicInput} type="file" accept="audio/mpeg,audio/wav,audio/mp4,audio/ogg" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f && f.type.startsWith("audio/") && f.size<=10485760)setMusic(f);else if(f)setError("Choose audio up to 10MB.");}} />
      <button onClick={()=>musicInput.current?.click()} className="w-full rounded-xl bg-[#edf5f5] p-3 text-left text-sm text-[#00696F]"><Music aria-hidden="true" size={16} className="inline-block align-middle" /> {music?.name || "Add music"}</button>
      {musicUrl && <><audio src={musicUrl} controls className="w-full"/><button onClick={()=>setMusic(null)} className="text-xs text-red-600">Remove music</button></>}
      </div>
      {error && <p role="alert" className="my-3 text-sm text-red-600">{error}</p>}
      <button disabled={busy || (mode === "text" ? !allLayers().length : !file)} onClick={() => void share()} className="mt-4 w-full rounded-xl bg-[#00696F] py-3 font-semibold text-white disabled:opacity-40">{busy ? (uploadProgress >= 100 ? "Processing…" : `Uploading ${uploadProgress}%`) : "Share to story"}</button>
    </section>
    <section className="relative min-h-0 flex-1 overflow-hidden bg-black md:overflow-visible md:rounded-2xl md:bg-white md:p-3"><h2 className="mb-3 hidden text-sm font-semibold md:block">Preview</h2><div className={textOpen || imageOpen ? "grid h-full items-start gap-4 md:h-auto lg:grid-cols-[minmax(0,1fr)_264px]" : "grid h-full md:h-auto"}>{imageOpen && mode === "photo" && file?.type.startsWith("image/") && <div className="fixed inset-x-0 bottom-0 z-[80] max-h-[65dvh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg md:static md:mb-4 md:rounded-2xl md:border md:border-[#dce8e8] lg:col-start-2 lg:row-start-1 lg:w-[264px]">
<h3 className="mb-3 text-sm font-semibold">Edit image</h3><p className="mb-4 text-xs text-gray-500">Drag to move. Pinch with two fingers to zoom and rotate.</p>
<label className="mb-4 block text-sm">Zoom · {Math.round(imageTransform.zoom*100)}%<input aria-label="Image zoom" className="mt-2 w-full accent-[#00696F]" type="range" min="0.25" max="5" step="0.01" value={imageTransform.zoom} onChange={e=>setImageTransform(v=>({...v,zoom:Number(e.target.value)}))}/></label>
<label className="mb-4 block text-sm">Rotate · {Math.round(imageTransform.rotation)}°<input aria-label="Image rotation" className="mt-2 w-full accent-[#00696F]" type="range" min="-180" max="180" value={imageTransform.rotation} onChange={e=>setImageTransform(v=>({...v,rotation:Number(e.target.value)}))}/></label>
<div className="grid grid-cols-2 gap-2">{(["flipX","flipY"] as const).map(key=><button key={key} aria-pressed={imageTransform[key]} onClick={()=>setImageTransform(v=>({...v,[key]:!v[key]}))} className="rounded-lg border border-[#dce8e8] p-2 text-xs">{key==="flipX"?"Flip horizontal":"Flip vertical"}</button>)}<button onClick={()=>setImageTransform(v=>({...v,rotation:((v.rotation+270)%360)-180}))} className="rounded-lg border p-2 text-xs">Rotate 90°</button><button onClick={()=>setImageTransform(initialImageTransform)} className="rounded-lg border p-2 text-xs">Reset</button></div>
<button onClick={()=>setImageOpen(false)} className="mt-4 w-full rounded-lg bg-[#00696F] py-2 text-sm font-semibold text-white">Done</button></div>}{textOpen && <div role="region" aria-label="Text editor" className="fixed inset-x-0 bottom-0 z-[80] max-h-[70dvh] overflow-y-auto rounded-t-2xl border border-[#dce8e8] bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg md:static md:mb-4 md:max-h-none md:rounded-2xl md:pb-4 lg:col-start-2 lg:row-start-1 lg:mb-0 lg:w-[264px]">
<div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-[#0B1C30]">Edit text</h3><button aria-label="Close text editor" onClick={()=>setTextOpen(false)} className="rounded-full px-2 py-1 text-gray-500 hover:bg-gray-100">✕</button></div>
      <textarea aria-label="Story text" maxLength={mode === "text" ? 250 : 500} value={text} onChange={e => setText(e.target.value)} placeholder={mode === "text" ? "Write your story…" : "Add a caption…"} autoFocus className="mt-0 min-h-20 w-full rounded-xl bg-gray-50 p-3 text-sm" />

<div className="mt-3 space-y-3">      
      <label className="block text-sm font-medium text-[#0B1C30]">Font
        <select value={fontFamily} onChange={e=>setFontFamily(e.target.value as typeof fontFamily)} className="mt-2 w-full rounded-xl border border-[#dce8e8] bg-white px-3 py-2.5 text-sm outline-[#00696F]">
          <option value="inherit">Clean · App font</option><option value="serif">Classic · Serif</option><option value="monospace">Typewriter · Mono</option><option value="cursive">Handwritten · Cursive</option>
        </select>
      </label>
      <div className="flex gap-2" aria-label="Text style">
        <button aria-label="Bold" aria-pressed={bold} onClick={()=>setBold(!bold)} className={"size-10 rounded-lg border font-bold " + (bold ? "border-[#00696F] bg-[#e0f0f0] text-[#00696F]" : "border-gray-200")}>B</button>
        <button aria-label="Italic" aria-pressed={italic} onClick={()=>setItalic(!italic)} className={"size-10 rounded-lg border italic " + (italic ? "border-[#00696F] bg-[#e0f0f0] text-[#00696F]" : "border-gray-200")}>I</button>
        {(["left","center","right"] as const).map(value=><button key={value} aria-label={value + " align"} aria-pressed={align===value} onClick={()=>setAlign(value)} className={"flex-1 rounded-lg border text-xs " + (align===value ? "border-[#00696F] bg-[#e0f0f0] text-[#00696F]" : "border-gray-200")}>{value}</button>)}
      </div>
      <label className="flex items-center gap-2 text-sm">Text size<input type="range" min="14" max="40" value={size} onChange={e=>setSize(Number(e.target.value))} className="w-24 accent-[#00696F]" /></label>
      <label className="flex items-center gap-2 text-sm">Text color <span className="text-xs text-gray-500">{ink.toUpperCase()}</span><input aria-label="Text color" className="size-9 cursor-pointer rounded border border-gray-200" type="color" value={ink} onChange={e=>setInk(e.target.value)} /></label>

<div className="flex flex-wrap gap-2">{["#ffffff","#111827","#00696f","#ef4444","#f59e0b","#3b82f6","#ec4899"].map(value=><button key={value} aria-label={"Text color " + value} onClick={()=>setInk(value)} style={{background:value}} className={"size-6 rounded-full border border-gray-200 " + (ink===value ? "ring-2 ring-[#00696F] ring-offset-2" : "")} />)}</div>
<button onClick={()=>setTextOpen(false)} className="w-full rounded-lg bg-[#00696F] py-2 text-sm font-semibold text-white">Done</button>
</div></div>}<div className="relative col-start-1 row-start-1 mx-auto h-full w-full overflow-hidden rounded-b-3xl bg-[#101820] text-white md:aspect-[9/16] md:h-auto md:max-w-[min(380px,calc((100dvh-180px)*0.5625))] md:rounded-xl" style={mode === "text" ? {background:color} : {}}>
    {mode !== "text" && (url ? file?.type.startsWith("video/") ? <StoryVideo src={url} muted={!!music}/> : <StoryImage src={url} value={imageTransform} onChange={setImageTransform}/> : <p className="flex size-full items-center justify-center text-sm text-white/60">Choose media to preview</p>)}
    {layers.filter(layer=>layer.id!==selectedId).map(layer=><button key={layer.id} onClick={()=>selectLayer(layer)} style={{left:layer.position.x+"%",top:layer.position.y+"%",transform:"translate(-50%,-50%)",fontFamily:layer.fontFamily,fontSize:layer.size,color:layer.color,fontWeight:layer.bold?700:400,fontStyle:layer.italic?"italic":"normal",textAlign:layer.align}} className="absolute max-w-[90%] whitespace-pre-wrap break-words p-2 drop-shadow-md">{layer.text}</button>)}
    {!!text && <div role="button" tabIndex={0} aria-label="Move text using drag or arrow keys" onDoubleClick={()=>setTextOpen(true)} onKeyDown={e=>{const dx=e.key==="ArrowLeft"?-1:e.key==="ArrowRight"?1:0;const dy=e.key==="ArrowUp"?-1:e.key==="ArrowDown"?1:0;if(dx||dy){e.preventDefault();setPosition(p=>({x:Math.max(5,Math.min(95,p.x+dx)),y:Math.max(5,Math.min(95,p.y+dy))}));}}} onPointerDown={e=>e.currentTarget.setPointerCapture(e.pointerId)} onPointerMove={e=>{if(!e.currentTarget.hasPointerCapture(e.pointerId))return;const b=e.currentTarget.parentElement!.getBoundingClientRect();setPosition({x:Math.max(5,Math.min(95,(e.clientX-b.left)/b.width*100)),y:Math.max(5,Math.min(95,(e.clientY-b.top)/b.height*100))});}} style={{left:position.x+"%",top:position.y+"%",transform:"translate(-50%,-50%)",fontFamily,fontWeight:bold ? 700 : 400,fontStyle:italic ? "italic" : "normal",textAlign:align,fontSize:size,color:ink,touchAction:"none"}} className="absolute max-w-[90%] cursor-move select-none whitespace-pre-wrap break-words rounded-lg border border-dashed border-white/40 p-2 text-center font-bold drop-shadow-md">{text}</div>}
    {!!time && <span role="button" tabIndex={0} aria-label="Move time sticker using drag or arrow keys" onKeyDown={e=>{ const dx=e.key==="ArrowLeft"?-1:e.key==="ArrowRight"?1:0; const dy=e.key==="ArrowUp"?-1:e.key==="ArrowDown"?1:0; if(dx||dy){e.preventDefault();setTimePosition(p=>({x:Math.max(5,Math.min(95,p.x+dx)),y:Math.max(5,Math.min(95,p.y+dy))}));} }} onPointerDown={e=>{e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);timeDrag.current={x:e.clientX,y:e.clientY,px:timePosition.x,py:timePosition.y};}} onPointerMove={e=>{if(!timeDrag.current)return; const box=e.currentTarget.parentElement!.getBoundingClientRect(); const sticker=e.currentTarget.getBoundingClientRect();const marginX=Math.max(5,Math.min(49,sticker.width/box.width*50));const marginY=Math.max(5,Math.min(49,sticker.height/box.height*50));setTimePosition({x:Math.max(marginX,Math.min(100-marginX,timeDrag.current.px+(e.clientX-timeDrag.current.x)/box.width*100)),y:Math.max(marginY,Math.min(100-marginY,timeDrag.current.py+(e.clientY-timeDrag.current.y)/box.height*100))});}} onPointerUp={()=>{timeDrag.current=null;}} onPointerCancel={()=>{timeDrag.current=null;}} onLostPointerCapture={()=>{timeDrag.current=null;}} style={{left:timePosition.x+"%",top:timePosition.y+"%",transform:"translate(-50%,-50%)",touchAction:"none"}} className="absolute z-10 cursor-move select-none whitespace-nowrap rounded-xl bg-white/90 px-4 py-2 text-lg font-semibold text-[#0B1C30] focus:outline-2 focus:outline-[#00696F]">{time}</span>}
    </div></div></section>
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent px-4 pb-8 pt-[calc(1rem+env(safe-area-inset-top))] text-white md:hidden">
      <Link href="/" aria-label="Close story editor" className="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-black/30 text-xl">←</Link>
      <button onClick={()=>musicInput.current?.click()} className="pointer-events-auto max-w-[65%] truncate rounded-full bg-black/40 px-5 py-2 text-sm"><Music aria-hidden="true" size={16} className="inline-block align-middle" /> {music?.name || "Add music"}</button>
      <button onClick={()=>{setMode(mode==="text"?"photo":"text");}} className="pointer-events-auto rounded-full bg-black/30 px-3 py-2 text-xs">{mode==="text"?"Photo":"Text"}</button>
    </div>
    <div className="absolute inset-x-0 bottom-[105px] z-20 flex justify-center gap-4 bg-gradient-to-t from-black/65 to-transparent px-4 pb-4 pt-8 text-white md:hidden">
      <button onClick={()=>musicInput.current?.click()} className="flex flex-col items-center gap-1 text-xs"><span className="flex size-12 items-center justify-center rounded-full bg-white/20 text-2xl"><Music aria-hidden="true" size={16} className="inline-block align-middle" /></span>Music</button>
      <button onClick={addText} className="flex flex-col items-center gap-1 text-xs"><span className="flex size-12 items-center justify-center rounded-full bg-white/20 text-xl">Aa</span>Text</button>
      <button onClick={()=>setTime(time?"":new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}))} className="flex flex-col items-center gap-1 text-xs"><span className="flex size-12 items-center justify-center rounded-full bg-white/20 text-2xl"><Clock aria-hidden="true" size={16} className="inline-block align-middle" /></span>Time</button>
      <button onClick={()=>{setMode("photo");input.current?.click();}} className="flex flex-col items-center gap-1 text-xs"><span className="flex size-12 items-center justify-center rounded-full bg-white/20 text-xl">＋</span>Media</button>
      {mode==="photo" && file?.type.startsWith("image/") && <button onClick={()=>{setImageOpen(true);setTextOpen(false);}} className="flex flex-col items-center gap-1 text-xs"><span className="flex size-12 items-center justify-center rounded-full bg-white/20 text-xl">⤢</span>Adjust</button>}
      {mode==="text" && <button onClick={()=>setColor(colors[(colors.indexOf(color)+1)%colors.length])} className="flex flex-col items-center gap-1 text-xs"><span className="flex size-12 items-center justify-center rounded-full border-2 border-white/40" style={{background:color}}>●</span>Background</button>}
    </div>
    {busy && <div role="status" className="fixed inset-x-4 bottom-28 z-[95] rounded-xl bg-white p-3 text-sm text-[#00696F] shadow-lg md:inset-x-auto md:bottom-6 md:left-1/2 md:w-80 md:-translate-x-1/2"><p className="mb-2">{uploadProgress >= 100 ? "Upload complete. Preparing your story…" : `Uploading story · ${uploadProgress}%`}</p><progress aria-label="Story upload progress" max={100} value={uploadProgress} className="h-2 w-full accent-[#00696F]"/></div>}
    {file?.type.startsWith("video/") && !busy && <p className="absolute inset-x-4 bottom-[190px] z-20 rounded-lg bg-black/60 px-3 py-2 text-center text-xs text-white md:hidden">Maximum 30 seconds. Longer videos use the first 30 seconds.</p>}
    {music && <button onClick={() => setMusic(null)} className="absolute right-4 top-20 z-30 rounded-full bg-black/60 px-3 py-2 text-xs text-white md:hidden">Remove music</button>}
    <footer className="z-20 flex h-[105px] shrink-0 items-center justify-between gap-4 bg-black px-5 pb-[env(safe-area-inset-bottom)] text-white md:hidden"><StoryAudience value={audience} onChange={setAudience}/><button disabled={busy||(mode==="text"?!allLayers().length:!file)} onClick={()=>void share()} className="rounded-2xl bg-[#00696F] px-8 py-3 text-base font-semibold disabled:opacity-40">{busy ? (uploadProgress >= 100 ? "Processing…" : `Uploading ${uploadProgress}%`) : "Share"}</button></footer>
    {error && <p role="alert" className="absolute inset-x-3 top-20 z-[90] rounded-xl bg-white p-3 text-sm text-red-600 md:hidden">{error}</p>}
  </div>;
}

