import {apiUrl} from "../apiUrl";
import {getSessionToken} from "../auth";
export async function adsRequest(path="",body?:unknown){const token=getSessionToken();const response=await fetch(apiUrl(`/ads${path}`),{method:body?"POST":"GET",credentials:"include",headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});const result=await response.json();if(!response.ok)throw new Error(result.message||"Ad request failed");return result.data;}
