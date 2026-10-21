"use client";
import { useEffect, useState } from "react";
let context: AudioContext | null = null;
export function unlockCallAudio() { try { context ??= new AudioContext(); void context.resume().catch(()=>{}); } catch {} }
export function useCallTone(mode: "incoming" | "outgoing" | null) {
 const [blocked,setBlocked]=useState(false);
 useEffect(()=>{if(!mode){setBlocked(false);return;}let stopped=false;const voices=new Set<OscillatorNode>();
 const ring=()=>{try{context ??= new AudioContext();if(context.state!=='running'){setBlocked(true);return;}setBlocked(false);const now=context.currentTime;const offsets=mode==='incoming'?[0,.35,.7]:[0];for(const offset of offsets){const gain=context.createGain();gain.connect(context.destination);gain.gain.setValueAtTime(0,now+offset);gain.gain.linearRampToValueAtTime(.07,now+offset+.03);gain.gain.setValueAtTime(.07,now+offset+.2);gain.gain.linearRampToValueAtTime(0,now+offset+.3);for(const hz of mode==='incoming'?[660,880]:[440,480]){const osc=context.createOscillator();osc.frequency.value=hz;osc.connect(gain);voices.add(osc);osc.onended=()=>{voices.delete(osc);osc.disconnect();};osc.start(now+offset);osc.stop(now+offset+.32);}}}catch{if(!stopped)setBlocked(true);}};
 const unlock=()=>{unlockCallAudio();};document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);ring();const timer=setInterval(ring,mode==='incoming'?2500:3000);
 return()=>{stopped=true;clearInterval(timer);document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);voices.forEach(voice=>{try{voice.stop();}catch{}voice.disconnect();});};},[mode]);
 return blocked;
}
export async function checkCallDevices(video:boolean): Promise<{ microphone: boolean }> {
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia)throw Error('Calls require HTTPS or localhost.');
 const check=async(constraints:MediaStreamConstraints)=>{const stream=await navigator.mediaDevices.getUserMedia(constraints);stream.getTracks().forEach(track=>track.stop());};
 try {
  if(video){await check({video:true,audio:false});try{await check({audio:true,video:false});return {microphone:true};}catch{return {microphone:false};}}
  await check({audio:true,video:false});return {microphone:true};
 }catch(e){const name=(e as DOMException).name;if(name==='NotFoundError')throw Error(video?'Camera not found. Connect or enable your camera, then retry.':'Microphone not found. Connect or enable a microphone, then retry.');if(name==='NotAllowedError')throw Error('Allow '+(video?'camera':'microphone')+' in browser site permissions, then retry.');if(name==='NotReadableError')throw Error('Your device is busy. Close other apps using it, then retry.');throw e;}
}
