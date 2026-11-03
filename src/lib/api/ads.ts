import {apiUrl} from "../apiUrl";
import {getSessionToken} from "../auth";
export type AdValidationIssue={path:string;message:string};
export class AdsRequestError extends Error {
 constructor(message:string,public status:number,public issues:AdValidationIssue[]=[]){super(message);this.name="AdsRequestError";}
}
const labels:Record<string,string>={name:"Campaign name",goal:"Objective",budget:"Budget",start:"Start date",end:"End date",headline:"Headline",body:"Ad text",image:"Ad image",destination:"Destination link",cta:"Call to action",sourcePostId:"Source post",pacing:"Budget delivery",audience:"Audience","audience.location":"Location","audience.locations":"Selected locations","audience.minAge":"Minimum age","audience.maxAge":"Maximum age"};
export async function adsRequest(path="",body?:unknown,options?:{signal?:AbortSignal}){
 const token=getSessionToken();
 const response=await fetch(apiUrl(`/ads${path}`),{signal:options?.signal,cache:"no-store",method:body?"POST":"GET",credentials:"include",headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const result=await response.json();
 if(!response.ok){const issues:AdValidationIssue[]=Array.isArray(result.errors)?result.errors.filter((item:AdValidationIssue)=>typeof item?.path==="string"&&typeof item?.message==="string"):[];const message=issues.length?issues.map(issue=>`${labels[issue.path]||labels[issue.path.split(".").slice(0,2).join(".")]||issue.path||"Campaign"}: ${issue.message}`).join("; "):result.message||"Ad request failed";throw new AdsRequestError(message,response.status,issues);}
 return result.data;
}
