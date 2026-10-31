import { apiUrl } from "../apiUrl";
import { getSessionToken } from "../auth";
export async function walletRequest(path="",body?:unknown){const token=getSessionToken();const response=await fetch(apiUrl(`/wallet${path}`),{method:body?"POST":"GET",credentials:"include",headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});const result=await response.json();if(!response.ok)throw new Error(result.message||"Wallet request failed");return result.data;}
