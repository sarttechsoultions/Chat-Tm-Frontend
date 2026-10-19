"use client";
import { useRef } from "react";
export type ImageTransform = { zoom: number; rotation: number; x: number; y: number; flipX: boolean; flipY: boolean };
export const initialImageTransform: ImageTransform = { zoom: 1, rotation: 0, x: 0, y: 0, flipX: false, flipY: false };
export function imageStyle(value: ImageTransform) { return { transform: `translate(${value.x}%, ${value.y}%) rotate(${value.rotation}deg) scale(${value.zoom * (value.flipX ? -1 : 1)}, ${value.zoom * (value.flipY ? -1 : 1)})` }; }
export default function StoryImage({ src, value, onChange }: { src: string; value: ImageTransform; onChange: (value: ImageTransform) => void }) {
 const points = useRef(new Map<number, {x:number;y:number}>());
 const base = useRef({ points: [] as {x:number;y:number}[], value });
 function rebase() { base.current = { points: [...points.current.values()], value }; }
 function finish(id: number) { points.current.delete(id); rebase(); }
 return <div role="img" aria-label="Story image. Drag to move, pinch to zoom and rotate." className="absolute inset-0 cursor-grab overflow-hidden active:cursor-grabbing" style={{touchAction:"none"}} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});rebase();}} onPointerMove={e=>{
 if(!points.current.has(e.pointerId))return;
 points.current.set(e.pointerId,{x:e.clientX,y:e.clientY}); const now=[...points.current.values()]; const before=base.current.points; if(!before.length)return;
 const box=e.currentTarget.getBoundingClientRect();const start=base.current.value;
 const midpoint=(p:{x:number;y:number}[])=>p.length>1?{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2}:p[0];const a=midpoint(before);const b=midpoint(now);
 let zoom=start.zoom,rotation=start.rotation;
 if(now.length>1&&before.length>1){const distance=(p:{x:number;y:number}[])=>Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y);zoom=Math.max(.25,Math.min(5,start.zoom*distance(now)/Math.max(1,distance(before))));const angle=(p:{x:number;y:number}[])=>Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x)*180/Math.PI;rotation=((start.rotation+angle(now)-angle(before)+540)%360)-180;}
 onChange({...start,zoom,rotation,x:Math.max(-100,Math.min(100,start.x+(b.x-a.x)/box.width*100)),y:Math.max(-100,Math.min(100,start.y+(b.y-a.y)/box.height*100))});
 }} onPointerUp={e=>finish(e.pointerId)} onPointerCancel={e=>finish(e.pointerId)} onLostPointerCapture={e=>finish(e.pointerId)}><img draggable={false} src={src} alt="" className="pointer-events-none size-full select-none object-contain" style={imageStyle(value)}/></div>;
}
