"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import { adsRequest } from "../../lib/api/ads";
import { walletRequest } from "../../lib/api/wallet";

type Campaign = {
  id: string; title: string; goal: string; status: string; budget: number; spent: number;
  startDate: string | null; endDate: string | null;
  details?: { review?: string; reviewReason?: string; image?: string; headline?: string; body?: string;
    destination?: string; cta?: string; reserved?: string; impressions?: number; clicks?: number };
};
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
const count = (value: number) => value.toLocaleString("en-IN");
function delivery(ad: Campaign) {
  const review = ad.details?.review;
  if (review !== "APPROVED") return review || ad.status;
  if (ad.status === "COMPLETED") return "COMPLETED";
  if (ad.endDate && new Date(ad.endDate).getTime() <= Date.now()) return "ENDED";
  if (Number(ad.spent) >= Number(ad.budget)) return "BUDGET_EXHAUSTED";
  if (ad.status === "PAUSED") return "PAUSED";
  if (ad.startDate && new Date(ad.startDate).getTime() > Date.now()) return "SCHEDULED";
  return ad.status;
}
const label = (value: string) => value.toLowerCase().replaceAll("_", " ");
const button = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-40";

export default function CampaignDashboard() {
  const router=useRouter();
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page,setPage]=useState(1);
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [confirmIds, setConfirmIds] = useState<string[]>([]);
  const [tab, setTab] = useState("campaigns");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adsRequest();
      setItems(data.items);
      setSelected(ids => ids.filter(id => data.items.some((ad: Campaign) => ad.id === id)));
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load campaigns"); }
    finally { setLoading(false); }
    try { const data = await walletRequest(); const value = Number(data.wallet?.balance ?? data.balance); setBalance(Number.isFinite(value) ? value : null); } catch { setBalance(null); }
  }, []);
  useEffect(() => {
    let active = true;
    void adsRequest().then(data => { if(active) { setItems(data.items); setError(""); } }).catch(e => { if(active) setError(e instanceof Error ? e.message : "Unable to load campaigns"); }).finally(() => { if(active) setLoading(false); });
    void walletRequest().then(data => { const value=Number(data.balance); if(active) setBalance(Number.isFinite(value)?value:null); }).catch(() => {});
    return () => { active=false; };
  }, []);
  useEffect(() => {
    if (!confirmIds.length) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) { setConfirmIds([]); } };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [confirmIds.length, busy]);
  const visible = useMemo(() => {
    const rows = items.filter(ad => (filter === "all" || delivery(ad) === filter) && `${ad.title} ${ad.goal} ${ad.id}`.toLowerCase().includes(query.toLowerCase()));
    return sort === "newest" ? rows : rows.sort((a, b) => sort === "name" ? a.title.localeCompare(b.title) : sort === "spend" ? Number(b.spent) - Number(a.spent) : (b.details?.clicks || 0) - (a.details?.clicks || 0));
  }, [items, query, filter, sort]);
  const pageCount=Math.max(1,Math.ceil(visible.length/10));
  const currentPage=Math.min(page,pageCount);
  const pageItems=visible.slice((currentPage-1)*10,currentPage*10);
  const pageNumbers=Array.from({length:Math.min(5,pageCount)},(_,index)=>Math.max(1,Math.min(currentPage-2,pageCount-4))+index);
  const totals = visible.reduce((n, ad) => ({ spent: n.spent + Number(ad.spent), impressions: n.impressions + (ad.details?.impressions || 0), clicks: n.clicks + (ad.details?.clicks || 0) }), { spent: 0, impressions: 0, clicks: 0 });
  const can = (ad: Campaign, action: string) => action === "duplicate" || (action === "submit" ? ["DRAFT", "REJECTED"].includes(ad.details?.review || "") : action === "cancel" ? ad.status !== "COMPLETED" : ad.details?.review === "APPROVED" && ad.status === (action === "pause" ? "ACTIVE" : "PAUSED"));
  async function act(ids: string[], action: string) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    let succeeded = 0;
    const failures: string[] = [];
    for (const id of ids) {
      try { await adsRequest(`/${id}/action`, { action }); succeeded++; }
      catch (e) { failures.push(e instanceof Error ? e.message : "Action failed"); }
    }
    await load();
    setSelected([]); setBusy(false); setConfirmIds([]);
    if (succeeded) setNotice(`${succeeded} campaign${succeeded === 1 ? "" : "s"}: ${label(action)} completed.`);
    if (failures.length) setError(`${failures.length} failed: ${Array.from(new Set(failures)).join("; ")}`);
  }
  function exportCsv() {
    const escape = (value: unknown) => `"${String(value ?? "").replace(/^[\s]*[=+@-]/, "'$&").replaceAll('"', '""')}"`;
    const rows = [["Campaign", "ID", "Objective", "Delivery", "Budget INR", "Spent INR", "Impressions", "Clicks", "CTR %", "CPC INR", "Start", "End"], ...visible.map(ad => [ad.title, ad.id, ad.goal, delivery(ad), ad.budget, ad.spent, ad.details?.impressions || 0, ad.details?.clicks || 0, ad.details?.impressions ? ((ad.details.clicks || 0) / ad.details.impressions * 100).toFixed(2) : "0", ad.details?.clicks ? (Number(ad.spent) / ad.details.clicks).toFixed(2) : "", ad.startDate, ad.endDate])];
    const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map(row => row.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "campaign-performance.csv"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <main className="mx-auto w-full max-w-[1500px] p-4 text-slate-800 md:p-7">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-[#00696F]">Business tools</p><h1 className="mt-1 text-3xl font-bold">Ads Manager</h1><p className="mt-2 text-sm text-slate-500">Create campaigns, manage delivery and understand your results.</p></div><Link href="/ads/create" className="rounded-lg bg-[#00696F] px-5 py-3 text-sm font-semibold text-white">+ Create campaign</Link></header>
    <nav aria-label="Ads workspace" className="mb-6 flex gap-2 border-b border-slate-200">{["campaigns", "billing"].map(value => <button key={value} onClick={() => setTab(value)} aria-current={tab === value ? "page" : undefined} className={`border-b-2 px-5 py-3 text-sm font-semibold capitalize ${tab === value ? "border-[#00696F] text-[#00696F]" : "border-transparent text-slate-500"}`}>{value}</button>)}</nav>
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="mb-4 rounded-xl bg-teal-50 p-4 text-sm text-teal-800">{notice}</p>}
    {tab === "billing" ? <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">Budget & billing</h2><p>Available wallet balance: <strong>{balance === null ? "Unavailable" : money(balance)}</strong></p><p>Reserved funds remaining: <strong>{money(items.reduce((sum, ad) => sum + Math.max(0, Number(ad.details?.reserved || 0) - Number(ad.spent)), 0))}</strong></p><p>Total recorded spend: <strong>{money(items.reduce((sum, ad) => sum + Number(ad.spent), 0))}</strong></p><p className="max-w-2xl text-sm leading-6 text-slate-500">Submitting a campaign reserves its full budget. Impressions cost ₹0.01 each, with at most one billable impression per viewer per campaign per UTC day. Unspent funds return to your wallet when a campaign is cancelled, rejected or expires.</p><Link href="/wallet/dashboard" className="inline-block rounded-lg bg-[#00696F] px-4 py-3 text-sm text-white">Open wallet & transactions</Link></section> : <>
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Amount spent", money(totals.spent)], ["Impressions", count(totals.impressions)], ["Link clicks", count(totals.clicks)], ["CTR", `${totals.impressions ? (totals.clicks / totals.impressions * 100).toFixed(2) : "0.00"}%`]].map(([title, value]) => <div key={title} className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs text-slate-500">{title}</p><p className="mt-3 text-2xl font-semibold">{loading ? "…" : value}</p></div>)}</div>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex flex-wrap gap-3 border-b border-slate-100 p-4"><input aria-label="Search campaigns" value={query} onChange={e => {setQuery(e.target.value);setPage(1);setSelected([]);}} placeholder="Search campaigns, objectives or IDs" className="min-w-48 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"/><select aria-label="Delivery filter" value={filter} onChange={e => {setFilter(e.target.value);setPage(1);setSelected([]);}} className={button}><option value="all">All delivery statuses</option>{Array.from(new Set(items.map(delivery))).sort().map(status => <option key={status} value={status}>{label(status)}</option>)}</select><select aria-label="Sort campaigns" value={sort} onChange={e => {setSort(e.target.value);setPage(1);setSelected([]);}} className={button}><option value="newest">Newest first</option><option value="name">Campaign name</option><option value="spend">Highest spend</option><option value="clicks">Most clicks</option></select><button onClick={() => void load()} disabled={loading || busy} className={button}>Refresh</button><button onClick={exportCsv} disabled={loading || !visible.length} className={button}>Export CSV</button></div>
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3"><p className="mr-auto text-xs text-slate-500">{visible.length} campaigns · Lifetime results · Totals reflect filters</p>{selected.length > 0 && <><span className="text-xs">{selected.length} selected</span>{["pause", "resume", "duplicate", "cancel"].map(action => <button key={action} disabled={busy || !selected.every(id => { const ad = items.find(a => a.id === id); return ad && can(ad, action); })} className={button} onClick={() => action === "cancel" ? setConfirmIds(selected) : void act(selected, action)}>{label(action)}</button>)}</>}</div>
    {loading ? <p role="status" className="p-12 text-center text-sm text-slate-500">Loading campaigns…</p> : !visible.length ? <div className="p-12 text-center"><h2 className="text-lg font-semibold">{items.length ? "No matching campaigns" : "Your first campaign starts here"}</h2><p className="mt-2 text-sm text-slate-500">{items.length ? "Change your search or delivery filter." : "Choose your objective, set a budget and submit your ad for review."}</p></div> : <div className="relative overflow-x-auto"><table className="w-full min-w-[960px] border-collapse whitespace-nowrap text-left text-[13px]"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th scope="col" className="w-10 px-3 py-3 text-center"><input type="checkbox" aria-label="Select campaigns on this page" checked={pageItems.length > 0 && pageItems.every(ad => selected.includes(ad.id))} onChange={e => setSelected(ids=>e.target.checked ? Array.from(new Set([...ids,...pageItems.map(ad=>ad.id)])) : ids.filter(id=>!pageItems.some(ad=>ad.id===id)))}/></th>{["Sr. No.","Campaign", "Delivery", "Budget", "Spent", "Impressions", "Clicks", "CTR", "CPC", "Actions"].map(name => <th scope="col" key={name} className={"px-3 py-3.5 font-semibold "+(name==="Actions"?"sticky right-0 z-10 w-28 border-l border-slate-200 bg-slate-50 text-center":name==="Sr. No."?"w-14 text-center":["Campaign","Delivery"].includes(name)?"text-left":"text-right")}>{name}</th>)}</tr></thead><tbody>{pageItems.map((ad,index) => <tr key={ad.id} className="group border-t border-slate-100 even:bg-slate-50/40 hover:bg-teal-50/40"><td className="px-3 py-4 text-center"><input type="checkbox" aria-label={`Select ${ad.title}`} checked={selected.includes(ad.id)} onChange={e => setSelected(ids => e.target.checked ? [...ids, ad.id] : ids.filter(id => id !== ad.id))}/></td><td className="px-3 py-4 text-center tabular-nums text-slate-500">{(currentPage-1)*10+index+1}</td><td className="px-3 py-4"><Link title={ad.title} className="block max-w-40 truncate text-left font-semibold text-[#00696F] hover:underline" href={`/ads/${ad.id}`}>{ad.title}</Link><p className="mt-1 text-xs capitalize text-slate-500">{ad.goal}</p></td><td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs capitalize ${delivery(ad) === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : delivery(ad) === "REJECTED" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>{label(delivery(ad))}</span></td><td className="px-3 py-4 text-right tabular-nums">{money(Number(ad.budget))}</td><td className="px-4">{money(Number(ad.spent))}</td><td className="px-4">{count(ad.details?.impressions || 0)}</td><td className="px-4">{count(ad.details?.clicks || 0)}</td><td className="px-4">{ad.details?.impressions ? ((ad.details.clicks || 0) / ad.details.impressions * 100).toFixed(2) : "0.00"}%</td><td className="px-4">{ad.details?.clicks ? money(Number(ad.spent) / ad.details.clicks) : "—"}</td><td className="sticky right-0 border-l border-slate-100 bg-white px-3 py-4 text-center group-hover:bg-teal-50"><select aria-label={"Actions for "+ad.title} disabled={busy} value="" className="w-24 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 outline-[#00696F] disabled:opacity-40" onChange={e=>{const action=e.target.value;if(action==="view")router.push(`/ads/${ad.id}`);else if(action==="edit")router.push(`/ads/create?edit=${ad.id}`);else if(action==="cancel")setConfirmIds([ad.id]);else if(action)void act([ad.id],action);}}><option value="" disabled>Actions</option><option value="view">View details</option>{["DRAFT","REJECTED"].includes(ad.details?.review||"")&&<><option value="edit">Edit draft</option><option value="view">Fund & submit</option></>}{["pause","resume"].filter(action=>can(ad,action)).map(action=><option key={action} value={action}>{action==="pause"?"Pause":"Resume"}</option>)}<option value="duplicate">Duplicate</option>{can(ad,"cancel")&&<option value="cancel">Cancel campaign</option>}</select></td></tr>)}</tbody></table></div>}{!loading&&visible.length>0&&<nav aria-label="Campaign pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3"><p className="text-xs text-slate-500">Showing {(currentPage-1)*10+1}–{Math.min(currentPage*10,visible.length)} of {visible.length} campaigns · 10 per page</p><div className="flex flex-wrap items-center gap-1"><button type="button" disabled={currentPage===1||busy} className={button} onClick={()=>setPage(currentPage-1)}>Previous</button>{pageNumbers.map(number=><button type="button" key={number} disabled={busy} aria-label={"Page "+number} aria-current={currentPage===number?"page":undefined} className={currentPage===number?"rounded-lg border border-[#00696F] bg-[#00696F] px-3 py-2 text-sm font-semibold text-white":button} onClick={()=>setPage(number)}>{number}</button>)}<button type="button" disabled={currentPage===pageCount||busy} className={button} onClick={()=>setPage(currentPage+1)}>Next</button><span className="ml-2 text-xs text-slate-500">Page {currentPage} of {pageCount}</span></div></nav>}</section></>}
    {!!confirmIds.length && <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 p-4"><section role="dialog" aria-modal="true" aria-labelledby="cancel-campaign" className="max-w-md rounded-2xl bg-white p-6 shadow-xl"><h2 id="cancel-campaign" className="text-xl font-bold">Cancel {confirmIds.length} campaign{confirmIds.length === 1 ? "" : "s"}?</h2><p className="mt-3 text-sm leading-6 text-slate-500">Delivery will stop and unspent reserved funds will return to your wallet. You can duplicate a cancelled campaign to create a new draft.</p><div className="mt-6 flex justify-end gap-3"><button autoFocus disabled={busy} className={button} onClick={() => setConfirmIds([])}>Keep campaigns</button><button disabled={busy} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-40" onClick={() => void act(confirmIds, "cancel")}>{busy ? "Cancelling…" : "Cancel & return funds"}</button></div></section></div>}
  </main>;
}
