"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {useSocket} from "./useSocket";
import {fetchUnreadCount,UNREAD_CHANGED_EVENT} from "../../lib/api/chat";
export default function useUnreadCount(){
 const [count,setCount]=useState(0);const socket=useSocket();const pathname=usePathname();
 useEffect(()=>{let cancelled=false,running=false,again=false;
 const refresh=async()=>{if(document.hidden)return;if(running){again=true;return;}running=true;
   try{do{again=false;try{const value=await fetchUnreadCount();if(!cancelled)setCount(value);}catch{}}while(again&&!cancelled);}finally{running=false;}};
 const update=()=>{void refresh();};void refresh();
 const events=["new_message","new_message_notification","conversation_upserted","conversation_read","conversation_read_notification","connect"];
 for(const event of events)socket?.on(event,update);
 window.addEventListener(UNREAD_CHANGED_EVENT,update);window.addEventListener("focus",update);document.addEventListener("visibilitychange",update);
 return()=>{cancelled=true;for(const event of events)socket?.off(event,update);window.removeEventListener(UNREAD_CHANGED_EVENT,update);window.removeEventListener("focus",update);document.removeEventListener("visibilitychange",update);};
 },[socket,pathname]);return count;
}
