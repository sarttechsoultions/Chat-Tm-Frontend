import { apiUrl } from "../apiUrl";
import { getSessionToken } from "../auth";
export type Call = { id:string;callerId:string;calleeId:string;type:"AUDIO"|"VIDEO";status:"RINGING"|"ACTIVE"|"ENDED"|"MISSED";startedAt:string;endedAt?:string|null;caller:{id:string;firstName:string;lastName:string;avatar:string};callee:{id:string;firstName:string;lastName:string;avatar:string} };
export async function callApi<T>(path:string,body?:unknown):Promise<T>{const token=getSessionToken();const res=await fetch(apiUrl('/calls'+path),{method:body?'POST':'GET',credentials:'include',headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});const json=await res.json();if(!res.ok)throw Error(json.message||'Call request failed');return json.data;}
export function startCall(calleeId:string,type:"AUDIO"|"VIDEO"){window.dispatchEvent(new CustomEvent('chattm:start-call',{detail:{calleeId,type}}));}
