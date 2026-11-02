const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const effects=[],requests=[],updates=[];
let tick,intervalMs,cleared=false;
const listeners={};
const document={hidden:false,addEventListener:(name,fn)=>listeners[name]=fn,removeEventListener:(name,fn)=>{if(listeners[name]===fn)delete listeners[name];}};
const react={useState:initial=>[typeof initial==='function'?initial():initial,value=>updates.push(value)],useEffect:fn=>effects.push(fn)};
const api={adsRequest:(url,body,options)=>new Promise((resolve,reject)=>requests.push({url,options,resolve,reject}))};
const source=fs.readFileSync(path.join(__dirname,'../src/components/ads/AdAnalytics.tsx'),'utf8');
const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const componentExports={};
vm.runInNewContext(output,{exports:componentExports,require:name=>name==='react'?react:name==='react/jsx-runtime'?{jsx:()=>null,jsxs:()=>null}:api,URLSearchParams,AbortController,Date,setTimeout,document,window:{setInterval:(fn,ms)=>{tick=fn;intervalMs=ms;return 42;},clearInterval:id=>{assert.equal(id,42);cleared=true;}}});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 componentExports.default({campaignId:'campaign-1'});
 const cleanup=effects[1]();assert.equal(requests.length,1);assert.equal(intervalMs,30000);
 tick();assert.equal(requests.length,1,'No overlapping requests');
 requests[0].resolve({generatedAt:new Date().toISOString()});await flush();tick();assert.equal(requests.length,2);
 document.hidden=true;listeners.visibilitychange();tick();assert.equal(requests.length,2,'Hidden tab must not poll');
 requests[1].resolve({generatedAt:new Date().toISOString()});await flush();document.hidden=false;listeners.visibilitychange();assert.equal(requests.length,3,'Returning to tab refreshes immediately');
 updates.length=0;requests[2].reject(new Error('Offline'));await flush();assert.ok(!updates.includes(null),'Background failure preserves the last report');
 cleanup();assert.equal(cleared,true);assert.ok(requests[2].options.signal.aborted);assert.equal(listeners.visibilitychange,undefined);tick();assert.equal(requests.length,3,'Unmounted component must not poll');
 console.log('PASS: 30-second polling, no overlap, hidden-tab pause, return refresh, stale-data preservation and cleanup');
})().catch(error=>{console.error(error);process.exitCode=1;});

