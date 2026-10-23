"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {ArrowLeft,Search,X} from "lucide-react";
import {useSocket} from "../hooks/useSocket";
import {searchPeople,visibleSearchHistory} from "../../lib/api/profile";
import {getStoredUser} from "../../lib/auth";
import type {PostAuthor} from "../../lib/api/posts";
import {UserAvatar} from "../ui/UserAvatar";
export default function SearchPanel({onClose,externalQuery,onQueryChange,hideInput=false}:{onClose?:()=>void;externalQuery?:string;onQueryChange?:(value:string)=>void;hideInput?:boolean}){
 const router=useRouter();
 const socket=useSocket();
 const [revision,setRevision]=useState(0);
 const [localQuery,setLocalQuery]=useState(""),[results,setResults]=useState<PostAuthor[]>([]),[history,setHistory]=useState<PostAuthor[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState("");
 const query=externalQuery??localQuery;
 const setQuery=(value:string)=>{if(onQueryChange)onQueryChange(value);else setLocalQuery(value);};
 const key=()=>"chattm:search-profiles:"+(getStoredUser()?.id||"anonymous");
 useEffect(()=>{
   let cancelled=false;
   try {
     const stored=JSON.parse(localStorage.getItem(key())||"[]");
     const ids=Array.isArray(stored)?stored.filter(item=>item && typeof item.id==="string").slice(0,15).map(item=>item.id):[];
     if(ids.length) void visibleSearchHistory(ids).then(items=>{if(!cancelled){const byId=new Map(items.map(item=>[item.id,item]));const next=ids.flatMap(id=>byId.has(id)?[byId.get(id)!]:[]);setHistory(next);localStorage.setItem(key(),JSON.stringify(next));}}).catch(()=>{if(!cancelled)setHistory([]);});
   }catch{}
   return()=>{cancelled=true;};
 },[revision]);
 useEffect(()=>{const refresh=()=>{setHistory([]);setResults([]);setRevision(value=>value+1);};socket?.on("friend_requests_changed",refresh);window.addEventListener("chattm:friends-changed",refresh);return()=>{socket?.off("friend_requests_changed",refresh);window.removeEventListener("chattm:friends-changed",refresh);};},[socket]);
 const save=(items:PostAuthor[])=>{setHistory(items);try{localStorage.setItem(key(),JSON.stringify(items));}catch{}};
 const remember=(user:PostAuthor)=>{save([user,...history.filter(item=>item.id!==user.id)].slice(0,15));};
 useEffect(()=>{
 let cancelled=false;
 const timer=setTimeout(()=>{
   if(!query.trim()){setResults([]);setLoading(false);setError("");return;}
   setLoading(true);setError("");
   searchPeople(query.trim()).then(items=>{if(!cancelled)setResults(items);}).catch(()=>{if(!cancelled)setError("Could not load results. Please try again.");}).finally(()=>{if(!cancelled)setLoading(false);});
 },query.trim()?250:0);
 return()=>{cancelled=true;clearTimeout(timer);};
 },[query,revision]);

 return <section className="mx-auto min-h-full w-full bg-white px-3 py-2 sm:p-4">
 {!hideInput&&<form autoComplete="off" onSubmit={e=>{e.preventDefault();}} className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white pb-3">
 <button type="button" aria-label="Back" onClick={()=>onClose?onClose():router.back()} className="p-2 text-[#00696F]"><ArrowLeft/></button>
 <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-[#F0F3F6] px-4"><Search size={18} className="text-gray-500"/><input autoFocus type="text" autoComplete="off" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search people by name or username" aria-label="Search people" className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none"/>{query&&<button type="button" aria-label="Clear search" onClick={()=>setQuery("")}><X size={18}/></button>}</div>
 </form>}
 {!query.trim()?<div className="pt-5"><div className="mb-4 flex justify-between"><h1 className="text-lg font-semibold">Recent searches</h1>{history.length>0&&<button onClick={()=>save([])} className="text-sm text-[#00696F]">Clear all</button>}</div>{!history.length&&<p className="py-8 text-center text-sm text-gray-500">No recent searches</p>}{history.map(item=><div key={item.id} className="flex items-center gap-3 border-b border-gray-100 py-3"><Link href={"/profile/"+encodeURIComponent(item.username)} onClick={()=>{remember(item);onClose?.();}} className="flex min-w-0 flex-1 items-center gap-3"><UserAvatar avatarUrl={item.avatar} name={item.firstName} size={44}/><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.firstName} {item.lastName}</p><p className="truncate text-xs text-gray-500">@{item.username}</p></div></Link><button aria-label={"Remove "+item.firstName+" from history"} onClick={()=>save(history.filter(q=>q.id!==item.id))}><X size={18}/></button></div>)}</div>:<div className="pt-4">{loading?<div role="status" aria-label="Searching" className="space-y-4">{[0,1,2].map(i=><div key={i} className="flex animate-pulse items-center gap-3"><div className="size-12 rounded-full bg-gray-100"/><div className="h-4 w-40 rounded bg-gray-100"/></div>)}</div>:error?<p role="alert" className="p-5 text-red-600">{error}</p>:results.length?results.map(user=><Link key={user.id} href={"/profile/"+encodeURIComponent(user.username)} onClick={()=>{remember(user);onClose?.();}} className="flex items-center gap-3 rounded-xl p-3 hover:bg-gray-50"><UserAvatar avatarUrl={user.avatar} name={user.firstName} size={48}/><div className="min-w-0"><p className="truncate font-semibold">{user.firstName} {user.lastName}</p><p className="truncate text-sm text-gray-500">@{user.username}</p></div></Link>):<p className="py-10 text-center text-gray-500">No people found</p>}</div>}
 </section>;
}
