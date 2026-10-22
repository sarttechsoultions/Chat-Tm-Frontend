"use client";
import {useEffect,useState} from "react";
import {listReceivedFriendRequests} from "../../lib/auth";
import {useSocket} from "./useSocket";
export default function useFriendRequestCount(){
 const [count,setCount]=useState(0);const socket=useSocket();
 useEffect(()=>{let cancelled=false;let running=false;
 const refresh=async()=>{if(running)return;running=true;try{const data=await listReceivedFriendRequests();if(!cancelled)setCount(data.items.length);}catch{}finally{running=false;}};
 void refresh();const timer=setInterval(()=>{if(!document.hidden)void refresh();},15000);
 const update=()=>void refresh();
 socket?.on("friend_requests_changed",update);socket?.on("connect",update);
 window.addEventListener("focus",update);window.addEventListener("chattm:friends-changed",update);
 return()=>{cancelled=true;clearInterval(timer);socket?.off("friend_requests_changed",update);socket?.off("connect",update);window.removeEventListener("focus",update);window.removeEventListener("chattm:friends-changed",update);};
 },[socket]);return count;
}
