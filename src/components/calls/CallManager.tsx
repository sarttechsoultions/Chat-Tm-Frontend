"use client";
import { useEffect, useRef, useState } from "react";
import type { IAgoraRTCClient, ILocalAudioTrack, ILocalVideoTrack } from "agora-rtc-sdk-ng";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone } from "lucide-react";
import { callApi, type Call } from "../../lib/api/calls";
import { useSocket } from "../hooks/useSocket";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { checkCallDevices, unlockCallAudio, useCallTone } from "./callDevices";
import LocalCameraVideo from "./LocalCameraVideo";
import CameraPreview from "./CameraPreview";
import { UserAvatar } from "../ui/UserAvatar";
function LiveCall({call,onEnd}:{call:Call;onEnd:()=>void}) {
 const [localTrack,setLocalTrack]=useState<ILocalVideoTrack|null>(null);const remote=useRef<HTMLDivElement>(null);const mic=useRef<ILocalAudioTrack|null>(null);const camera=useRef<ILocalVideoTrack|null>(null);const client=useRef<IAgoraRTCClient|null>(null);
 const [micAvailable,setMicAvailable]=useState(true);
 const [retry,setRetry]=useState(0);
 const [muted,setMuted]=useState(false);const [off,setOff]=useState(false);const [error,setError]=useState("");const [connected,setConnected]=useState(false);const [seconds,setSeconds]=useState(0);
 useEffect(()=>{let disposed=false;let rtc:IAgoraRTCClient|undefined;const tracks:(ILocalAudioTrack|ILocalVideoTrack)[]=[];
 const cleanup=async()=>{tracks.forEach(t=>{t.stop();t.close();});rtc?.removeAllListeners();await rtc?.leave();};
 void(async()=>{try{setError("");setConnected(false);const devices=await checkCallDevices(call.type==="VIDEO");if(disposed)return;setMicAvailable(devices.microphone);setMuted(!devices.microphone);const Agora=(await import('agora-rtc-sdk-ng')).default;if(disposed)return;rtc=Agora.createClient({mode:'rtc',codec:'vp8'});client.current=rtc;
 rtc.on('user-published',async(user,kind)=>{try{await rtc!.subscribe(user,kind);if(disposed)return;if(kind==='video'&&remote.current)user.videoTrack?.play(remote.current, { fit: "contain" });if(kind==='audio')user.audioTrack?.play();setConnected(true);}catch{if(!disposed)setError('Unable to receive remote media');}});
 rtc.on('token-privilege-will-expire',()=>{void callApi<{token:string}>('/'+call.id+'/token',{}).then(t=>rtc?.renewToken(t.token)).catch(()=>setError('Unable to renew call access. End and call again.'));});
 const auth=await callApi<{appId:string;channel:string;uid:number;token:string}>('/'+call.id+'/token',{});if(disposed)return;await rtc.join(auth.appId,auth.channel,auth.token,auth.uid);if(disposed){await cleanup();return;}
 mic.current=null;
 if(devices.microphone){try{const audio=await Agora.createMicrophoneAudioTrack();tracks.push(audio);if(disposed){await cleanup();return;}mic.current=audio;}catch(e){if(call.type!=='VIDEO')throw e;if(!disposed){setMicAvailable(false);setMuted(true);}}}

 if(call.type==='VIDEO'){const video=await Agora.createCameraVideoTrack();tracks.push(video);if(disposed){await cleanup();return;}camera.current=video;setLocalTrack(video);}
 await rtc.publish(tracks);if(disposed){await cleanup();return;}setConnected(true);
 }catch(e){if(!disposed){setConnected(false);setError(e instanceof Error?e.message:'Camera or microphone permission failed');await cleanup();}}})();return()=>{disposed=true;void cleanup();};},[call.id,call.type,retry]);
 useEffect(()=>{const timer=setInterval(()=>setSeconds(Math.max(0,Math.floor((Date.now()-new Date(call.startedAt).getTime())/1000))),1000);return()=>clearInterval(timer);},[call.startedAt]);
 return <><p className="relative z-20 mt-1 shrink-0 rounded-full bg-black/30 px-3 py-1 text-xs tabular-nums text-white/80">{connected?`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`:error?'Device setup needed':'Connecting…'}</p>{call.type==='VIDEO'&&!error&&<div className="absolute inset-0 z-0 overflow-hidden bg-black [&_video]:object-contain md:relative md:inset-auto md:my-3 md:min-h-0 md:w-full md:flex-1 md:rounded-2xl"><div ref={remote} className="size-full"/><div className="pointer-events-none absolute inset-x-0 bottom-28 top-28 md:bottom-0 md:top-0 [&>div]:pointer-events-auto"><CameraPreview><LocalCameraVideo track={localTrack} off={off}/></CameraPreview></div></div>}{error&&<div role="alert" className="relative z-20 my-auto max-h-[40dvh] max-w-lg overflow-y-auto px-4 py-5 text-sm text-red-300"><p>{error}</p><button onClick={()=>setRetry(value=>value+1)} className="mt-3 rounded-full bg-white/15 px-5 py-2 text-white">Retry devices</button></div>}{!micAvailable&&<p role="status" className="absolute bottom-24 left-1/2 z-20 mb-2 w-max max-w-[95%] -translate-x-1/2 rounded-full bg-black/40 px-3 py-1.5 text-[11px] text-white/80">Camera-only · Your microphone is unavailable.</p>}<div className="relative z-20 mt-auto flex shrink-0 items-center justify-center gap-5 rounded-full border border-white/15 bg-black/50 px-5 py-3 shadow-lg backdrop-blur-md sm:gap-6"><button disabled={!connected || !!error || !micAvailable} title={!micAvailable ? "Microphone unavailable" : undefined} aria-label={muted?'Unmute':'Mute'} onClick={async()=>{try{await mic.current?.setEnabled(muted);setMuted(!muted);}catch{setError('Unable to change microphone');}}} className="flex size-12 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-40 sm:size-14">{muted?<MicOff/>:<Mic/>}</button>{call.type==='VIDEO'&&<button disabled={!connected || !!error} aria-label={off?'Turn camera on':'Turn camera off'} onClick={async()=>{try{await camera.current?.setEnabled(off);setOff(!off);}catch{setError('Unable to change camera');}}} className="rounded-full bg-white/15 p-4">{off?<VideoOff/>:<Video/>}</button>}<button aria-label="End call" onClick={onEnd} className="flex size-12 items-center justify-center rounded-full bg-red-500 shadow-[0_4px_18px_rgba(239,68,68,.25)] transition hover:bg-red-600 sm:size-14"><PhoneOff/></button></div></>;
}
export default function CallManager(){const me=useCurrentUser();const socket=useSocket();const [call,setCall]=useState<Call|null>(null);const [error,setError]=useState("");const [busy,setBusy]=useState(false);const guard=useRef(false);
 useEffect(()=>{
 if(!me)return;
 let cancelled=false;let syncing=false;let timer:ReturnType<typeof setTimeout>|undefined;
 const sync=async()=>{
  if(cancelled||syncing)return;
  syncing=true;
  try { const data=await callApi<{items:Call[]}>(''); if(!cancelled)setCall(data.items.find(c=>c.status==='RINGING'||c.status==='ACTIVE')||null); }
  catch { /* Keep existing call state during temporary network failures. */ }
  finally { syncing=false; }
 };
 const poll=async()=>{await sync();if(!cancelled)timer=setTimeout(()=>void poll(),12000);};
 const update=(item:Call)=>{if(cancelled)return;if(item.callerId!==me.id&&item.calleeId!==me.id)return;setCall(item.status==='RINGING'||item.status==='ACTIVE'?item:null);};
 const reconnect=()=>{void sync();};
 void poll();socket?.on('call_updated',update);socket?.on('connect',reconnect);
 const start=async(e:Event)=>{if(guard.current)return;guard.current=true;setError('');unlockCallAudio();try{await checkCallDevices((e as CustomEvent).detail.type==='VIDEO');setCall(await callApi<Call>('',(e as CustomEvent).detail));}catch(e){setError(e instanceof Error?e.message:'Unable to start call');}finally{guard.current=false;}};
 window.addEventListener('chattm:start-call',start);
 return()=>{cancelled=true;clearTimeout(timer);socket?.off('call_updated',update);socket?.off('connect',reconnect);window.removeEventListener('chattm:start-call',start);};
 },[me?.id,socket]);

 async function action(value:string){if(!call||busy)return;setBusy(true);unlockCallAudio();try{if(value==='accept')await checkCallDevices(call.type==='VIDEO');const next=await callApi<Call>('/'+call.id+'/action',{action:value});setCall(next.status==='ACTIVE'?next:null);}catch(e){setError(e instanceof Error?e.message:'Call action failed');}finally{setBusy(false);}}
 const soundBlocked=useCallTone(call?.status==='RINGING'?(call.calleeId===me?.id?'incoming':'outgoing'):null);
 const other=call?(call.callerId===me?.id?call.callee:call.caller):null;
 return <>{error&&<div role="alert" className="fixed right-4 top-20 z-[210] max-w-sm rounded-xl bg-red-50 p-4 text-sm text-red-700 shadow-lg">{error}<button aria-label="Dismiss error" onClick={()=>setError('')} className="ml-3">✕</button></div>}{call&&other&&<div role="dialog" aria-modal="true" aria-label="Call" className="fixed inset-0 z-[200] flex h-[100dvh] items-center justify-center overflow-hidden bg-[#09191f] md:bg-[#07191f]/95 md:px-8 md:py-6 px-0 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(.75rem+env(safe-area-inset-top))] text-white"><div className={"relative flex w-full flex-col items-center text-center " + (call.status==='ACTIVE' ? "h-full min-h-0 md:h-[min(680px,88dvh)] md:max-w-[800px] md:overflow-hidden md:rounded-3xl md:border md:border-white/10 md:bg-[#09191f] md:p-5 md:shadow-2xl" : "max-h-full overflow-y-auto py-6")}><div className="relative z-20 shrink-0 rounded-full border border-white/20 bg-black/30 p-1"><UserAvatar avatarUrl={other.avatar} name={other.firstName} size={44}/></div><h1 className="relative z-20 mt-2 shrink-0 rounded-full bg-black/30 px-4 py-1 text-lg font-semibold sm:text-xl">{other.firstName} {other.lastName}</h1>{call.status==='ACTIVE'?<LiveCall key={call.id} call={call} onEnd={()=>void action('end')}/>:<><p className="mt-3 text-sm text-white/70">{call.calleeId===me?.id?'Incoming':'Calling…'} {call.type==='VIDEO'?'video':'audio'} call</p>{soundBlocked&&<button onClick={unlockCallAudio} className="mt-3 rounded-full bg-white/15 px-4 py-2 text-sm">Enable ringtone sound</button>}<div className="mt-8 flex gap-5">{call.calleeId===me?.id&&<button disabled={busy} onClick={()=>void action('accept')} className="rounded-full bg-[#008b82] p-5" aria-label="Accept call"><Phone/></button>}<button disabled={busy} onClick={()=>void action(call.calleeId===me?.id?'decline':'end')} className="rounded-full bg-red-600 p-5" aria-label="Decline or cancel call"><PhoneOff/></button></div></>}</div></div>}</>;
}
