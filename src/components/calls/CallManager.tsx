"use client";
import { useEffect, useRef, useState } from "react";
import type { IAgoraRTCClient, ILocalAudioTrack, ICameraVideoTrack, ILocalVideoTrack } from "agora-rtc-sdk-ng";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone, Volume2, SwitchCamera } from "lucide-react";
import { callApi, type Call } from "../../lib/api/calls";
import { useSocket } from "../hooks/useSocket";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { checkCallDevices, unlockCallAudio, useCallTone } from "./callDevices";
import LocalCameraVideo from "./LocalCameraVideo";
import CameraPreview from "./CameraPreview";
import { UserAvatar } from "../ui/UserAvatar";
function LiveCall({call,onEnd}:{call:Call;onEnd:()=>void}) {
 const [localTrack,setLocalTrack]=useState<ILocalVideoTrack|null>(null);const remote=useRef<HTMLDivElement>(null);const mic=useRef<ILocalAudioTrack|null>(null);const camera=useRef<ICameraVideoTrack|null>(null);const client=useRef<IAgoraRTCClient|null>(null);
 const [remoteVideo,setRemoteVideo]=useState(false);
 const [micAvailable,setMicAvailable]=useState(true);
 const [outputNotice,setOutputNotice]=useState("");
 const chooseOutput=async()=>{
   const devices=navigator.mediaDevices as MediaDevices & {selectAudioOutput?:()=>Promise<MediaDeviceInfo>};
   if(!devices?.selectAudioOutput){setOutputNotice("Use your phone’s audio output controls to switch speaker, earpiece or Bluetooth.");return;}
   try{const output=await devices.selectAudioOutput();await Promise.all((client.current?.remoteUsers||[]).map(user=>user.audioTrack?.setPlaybackDevice(output.deviceId)));setOutputNotice("Audio output: "+(output.label||"Selected device"));}
   catch{setOutputNotice("Audio output was not changed.");}
 };
 const [previewVersion,setPreviewVersion]=useState(0);
 const [flipping,setFlipping]=useState(false);
 const flipGuard=useRef(false);
 const [cameraNotice,setCameraNotice]=useState("");
 const flipCamera=async()=>{
   const track=camera.current;
   if(!track||flipGuard.current)return;
   flipGuard.current=true;setFlipping(true);setCameraNotice("");
   try{
     const mode=track.getMediaStreamTrack().getSettings().facingMode;
     await track.setDevice({facingMode:mode==="environment"?"user":"environment"});
     setPreviewVersion(value=>value+1);
   }catch{setCameraNotice("Could not switch camera. Check that your phone has another available camera.");}
   finally{flipGuard.current=false;setFlipping(false);}
 };
 const [retry,setRetry]=useState(0);
 const [muted,setMuted]=useState(false);const [off,setOff]=useState(false);const [error,setError]=useState("");const [connected,setConnected]=useState(false);const [seconds,setSeconds]=useState(0);
 useEffect(()=>{let disposed=false;let rtc:IAgoraRTCClient|undefined;const tracks:(ILocalAudioTrack|ILocalVideoTrack)[]=[];
 const cleanup=async()=>{tracks.forEach(t=>{t.stop();t.close();});rtc?.removeAllListeners();await rtc?.leave();};
 void(async()=>{try{setError("");setConnected(false);const devices=await checkCallDevices(call.type==="VIDEO");if(disposed)return;setMicAvailable(devices.microphone);setMuted(!devices.microphone);const Agora=(await import('agora-rtc-sdk-ng')).default;if(disposed)return;rtc=Agora.createClient({mode:'rtc',codec:'vp8'});client.current=rtc;
 rtc.on('user-published',async(user,kind)=>{try{await rtc!.subscribe(user,kind);if(disposed)return;if(kind==='video'&&remote.current){user.videoTrack?.play(remote.current, { fit: "cover" });setRemoteVideo(true);}if(kind==='audio')user.audioTrack?.play();setConnected(true);}catch{if(!disposed)setError('Unable to receive remote media');}});
 rtc.on('user-unpublished',(_user,kind)=>{if(kind==='video')setRemoteVideo(false);});
 rtc.on('user-left',()=>setRemoteVideo(false));
 rtc.on('token-privilege-will-expire',()=>{void callApi<{token:string}>('/'+call.id+'/token',{}).then(t=>rtc?.renewToken(t.token)).catch(()=>setError('Unable to renew call access. End and call again.'));});
 const auth=await callApi<{appId:string;channel:string;uid:number;token:string}>('/'+call.id+'/token',{});if(disposed)return;await rtc.join(auth.appId,auth.channel,auth.token,auth.uid);if(disposed){await cleanup();return;}
 mic.current=null;
 if(devices.microphone){try{const audio=await Agora.createMicrophoneAudioTrack();tracks.push(audio);if(disposed){await cleanup();return;}mic.current=audio;}catch(e){if(call.type!=='VIDEO')throw e;if(!disposed){setMicAvailable(false);setMuted(true);}}}

 if(call.type==='VIDEO'){const video=await Agora.createCameraVideoTrack({facingMode:"user"});tracks.push(video);if(disposed){await cleanup();return;}camera.current=video;setLocalTrack(video);}
 await rtc.publish(tracks);if(disposed){await cleanup();return;}setConnected(true);
 }catch(e){if(!disposed){setConnected(false);setError(e instanceof Error?e.message:'Camera or microphone permission failed');await cleanup();}}})();return()=>{disposed=true;void cleanup();};},[call.id,call.type,retry]);
 useEffect(()=>{const timer=setInterval(()=>setSeconds(Math.max(0,Math.floor((Date.now()-new Date(call.startedAt).getTime())/1000))),1000);return()=>clearInterval(timer);},[call.startedAt]);
 return <><p className="relative z-20 mt-1 shrink-0 rounded-full bg-black/30 px-3 py-1 text-xs tabular-nums text-white/80">{connected?`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`:error?'Device setup needed':'Connecting…'}</p>{call.type==='VIDEO'&&!error&&<div className="absolute inset-0 z-0 overflow-hidden bg-[#0b141a] [&_video]:object-cover"><div ref={remote} className="size-full"/>{!remoteVideo&&<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#174b50] via-[#102c33] to-[#0b141a]"><img src="/ChatTmLogo.png" alt="ChatTm" className="w-28 object-contain"/><p className="text-sm text-white/60">Waiting for camera</p></div>}<div className="pointer-events-none absolute inset-x-2 bottom-36 top-3 sm:inset-x-5 sm:top-5 sm:bottom-36 [&>div]:pointer-events-auto"><CameraPreview><LocalCameraVideo track={localTrack} off={off} revision={previewVersion}/></CameraPreview></div></div>}{error&&<div role="alert" className="relative z-20 my-auto max-h-[40dvh] max-w-lg overflow-y-auto px-4 py-5 text-sm text-red-300"><p>{error}</p><button onClick={()=>setRetry(value=>value+1)} className="mt-3 rounded-full bg-white/15 px-5 py-2 text-white">Retry devices</button></div>}{!micAvailable&&<p role="status" className="absolute bottom-32 left-1/2 z-20 mb-2 w-max max-w-[95%] -translate-x-1/2 rounded-full bg-black/40 px-3 py-1.5 text-[11px] text-white/80">Camera-only · Your microphone is unavailable.</p>}<div className="relative z-20 mt-auto mb-6 flex shrink-0 items-center justify-center gap-7 rounded-full bg-gradient-to-t from-black/30 to-transparent px-5 py-4 sm:gap-8"><button style={{order:3}} disabled={!connected || !!error || !micAvailable} title={!micAvailable ? "Microphone unavailable" : undefined} aria-label={muted?'Unmute':'Mute'} onClick={async()=>{try{await mic.current?.setEnabled(muted);setMuted(!muted);}catch{setError('Unable to change microphone');}}} className="flex size-12 items-center justify-center rounded-full bg-white text-[#111b21] shadow-lg transition hover:bg-white/80 disabled:opacity-40 sm:size-14">{muted?<MicOff/>:<Mic/>}</button>{call.type==='VIDEO'&&<button disabled={!connected || !!error} aria-label={off?'Turn camera on':'Turn camera off'} onClick={async()=>{try{await camera.current?.setEnabled(off);setOff(!off);}catch{setError('Unable to change camera');}}} style={{order:1}} className="flex size-14 items-center justify-center rounded-full bg-white text-[#111b21] shadow-lg">{off?<VideoOff/>:<Video/>}</button>}<button style={{order:2}} aria-label="End call" onClick={onEnd} className="flex size-12 items-center justify-center rounded-full bg-red-500 shadow-[0_4px_18px_rgba(239,68,68,.25)] transition hover:bg-red-600 sm:size-14"><PhoneOff/></button>{call.type==="AUDIO"&&<button style={{order:1}} aria-label="Choose audio output" onClick={()=>void chooseOutput()} className="flex size-14 items-center justify-center rounded-full bg-white text-[#111b21]"><Volume2/></button>}</div><div className="absolute bottom-28 left-4 right-4 z-20 text-center">{call.type==="VIDEO"&&<button disabled={!connected || off || flipping || !!error} onClick={()=>void flipCamera()} aria-label="Switch front and back camera" title="Flip camera" className="mr-2 inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-2 text-xs text-white disabled:opacity-40"><SwitchCamera size={18}/>{flipping?"Switching…":"Flip camera"}</button>}{cameraNotice&&<p role="status" className="mb-2 rounded-xl bg-black/70 p-2 text-xs">{cameraNotice}</p>}{call.type==="VIDEO"&&<button onClick={()=>void chooseOutput()} className="rounded-full bg-black/40 px-3 py-1 text-xs text-white/80" aria-label="Choose speaker or audio output"><Volume2 size={20}/></button>}{outputNotice&&<p role="status" className="mt-2 rounded-xl bg-black/70 p-2 text-xs">{outputNotice}</p>}</div></>;
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
 return <>{error&&<div role="alert" className="fixed right-4 top-20 z-[210] max-w-sm rounded-xl bg-red-50 p-4 text-sm text-red-700 shadow-lg">{error}<button aria-label="Dismiss error" onClick={()=>setError('')} className="ml-3">✕</button></div>}{call&&other&&<div role="dialog" aria-modal="true" aria-label="Call" className="fixed inset-0 z-[200] flex h-[100dvh] items-center justify-center overflow-hidden bg-[#0b141a] md:bg-[#0b141a]/95 md:px-6 md:py-3 px-0 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-white"><div className={"relative flex w-full flex-col items-center text-center " + (call.status==='ACTIVE' ? "h-full min-h-0 overflow-hidden bg-gradient-to-b from-[#1b343b] via-[#102329] to-[#0b141a] pt-5 md:h-[min(800px,94dvh)] md:max-w-[1100px] md:rounded-2xl md:border md:border-white/10 md:shadow-2xl" : "max-h-full overflow-y-auto py-6")}><div className={(call.type==="AUDIO"?"mt-[12dvh] mb-5 rounded-full border border-white/10 bg-white/5 p-3 shadow-[0_0_80px_rgba(0,168,132,0.14)] ":call.status==="ACTIVE"?"hidden rounded-full border border-white/20 bg-black/30 p-1 md:block ":"rounded-full border border-white/20 bg-black/30 p-1 ")+"relative z-20 shrink-0"}><UserAvatar avatarUrl={other.avatar} name={other.firstName} size={call.type==="AUDIO"?132:44}/></div><h1 className={call.type==="AUDIO"?"relative z-20 max-w-[90%] shrink-0 px-4 text-2xl font-semibold tracking-tight sm:text-3xl":call.status==="ACTIVE"?"hidden":"relative z-20 mt-4 max-w-[90%] shrink-0 px-4 text-2xl font-semibold"}>{other.firstName} {other.lastName}</h1>{call.status==='ACTIVE'?<LiveCall key={call.id} call={call} onEnd={()=>void action('end')}/>:<><p className="mt-3 text-sm text-white/70">{call.calleeId===me?.id?'Incoming':'Calling…'} {call.type==='VIDEO'?'video':'audio'} call</p>{soundBlocked&&<button onClick={unlockCallAudio} className="mt-3 rounded-full bg-white/15 px-4 py-2 text-sm">Enable ringtone sound</button>}<div className="mt-8 flex gap-5">{call.calleeId===me?.id&&<button disabled={busy} onClick={()=>void action('accept')} className="rounded-full bg-[#008b82] p-5" aria-label="Accept call"><Phone/></button>}<button disabled={busy} onClick={()=>void action(call.calleeId===me?.id?'decline':'end')} className="rounded-full bg-red-600 p-5" aria-label="Decline or cancel call"><PhoneOff/></button></div></>}</div></div>}</>;
}
