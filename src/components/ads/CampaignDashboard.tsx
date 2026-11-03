"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Copy, Eye, Pause, Pencil, Play, XCircle } from "lucide-react";
import { adsRequest } from "../../lib/api/ads";
import { walletRequest } from "../../lib/api/wallet";

type Campaign = {
  id: string;
  title: string;
  goal: string;
  status: string;
  budget: number;
  spent: number;
  startDate: string | null;
  endDate: string | null;
  details?: {
    review?: string;
    reserved?: string;
    impressions?: number;
    clicks?: number;
  };
};

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
const count = (value: number) => value.toLocaleString("en-IN");
const button = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";
const label = (value: string) => value.toLowerCase().replaceAll("_", " ");

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

function statusClass(status: string) {
  if (status === "ACTIVE") return "bg-emerald-50 text-emerald-700";
  if (status === "REJECTED") return "bg-red-50 text-red-700";
  if (status === "PAUSED") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export default function CampaignDashboard() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [balance, setBalance] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [tab, setTab] = useState("campaigns");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adsRequest();
      setItems(data.items);
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load campaigns");
    } finally {
      setLoading(false);
    }
    try {
      const data = await walletRequest();
      const value = Number(data.wallet?.balance ?? data.balance);
      setBalance(Number.isFinite(value) ? value : null);
    } catch {
      setBalance(null);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) setConfirmId(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [busy]);

  const visible = useMemo(() => {
    const rows = items.filter((ad) => (filter === "all" || delivery(ad) === filter) && `${ad.title} ${ad.goal} ${ad.id}`.toLowerCase().includes(query.toLowerCase()));
    if (sort === "name") return rows.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "spend") return rows.sort((a, b) => Number(b.spent) - Number(a.spent));
    if (sort === "clicks") return rows.sort((a, b) => (b.details?.clicks || 0) - (a.details?.clicks || 0));
    return rows;
  }, [filter, items, query, sort]);

  const pageCount = Math.max(1, Math.ceil(visible.length / 10));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visible.slice((currentPage - 1) * 10, currentPage * 10);
  const pageNumbers = Array.from({ length: Math.min(5, pageCount) }, (_, index) => Math.max(1, Math.min(currentPage - 2, pageCount - 4)) + index);
  const totals = visible.reduce((sum, ad) => ({ spent: sum.spent + Number(ad.spent), impressions: sum.impressions + (ad.details?.impressions || 0), clicks: sum.clicks + (ad.details?.clicks || 0) }), { spent: 0, impressions: 0, clicks: 0 });

  const can = (ad: Campaign, action: "pause" | "resume" | "cancel") => {
    if (action === "cancel") return ad.status !== "COMPLETED";
    return ad.details?.review === "APPROVED" && ad.status === (action === "pause" ? "ACTIVE" : "PAUSED");
  };

  async function act(id: string, action: "pause" | "resume" | "duplicate" | "cancel") {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await adsRequest(`/${id}/action`, { action });
      await load();
      setNotice(`Campaign ${label(action)} completed.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Campaign action failed");
    } finally {
      setBusy(false);
      setConfirmId(null);
    }
  }

  function exportCsv() {
    const escape = (value: unknown) => `"${String(value ?? "").replace(/^[\s]*[=+@-]/, "'$&").replaceAll('"', '""')}"`;
    const rows = [["Campaign", "ID", "Objective", "Delivery", "Budget INR", "Spent INR", "Impressions", "Clicks", "CTR %", "CPC INR", "Start", "End"], ...visible.map((ad) => [ad.title, ad.id, ad.goal, delivery(ad), ad.budget, ad.spent, ad.details?.impressions || 0, ad.details?.clicks || 0, ad.details?.impressions ? ((ad.details.clicks || 0) / ad.details.impressions * 100).toFixed(2) : "0", ad.details?.clicks ? (Number(ad.spent) / ad.details.clicks).toFixed(2) : "", ad.startDate, ad.endDate])];
    const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map((row) => row.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "campaign-performance.csv";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] p-4 text-slate-800 md:p-7">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#00696F]">Business tools</p>
          <h1 className="mt-1 text-3xl font-bold">Ads Manager</h1>
          <p className="mt-2 text-sm text-slate-500">Create campaigns, manage delivery and understand your results.</p>
        </div>
        <Link href="/ads/create" className="rounded-lg bg-[#00696F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#005b60]">+ Create campaign</Link>
      </header>

      <nav aria-label="Ads workspace" className="mb-6 flex gap-2 border-b border-slate-200">
        {["campaigns", "billing"].map((value) => <button key={value} type="button" onClick={() => setTab(value)} aria-current={tab === value ? "page" : undefined} className={`border-b-2 px-5 py-3 text-sm font-semibold capitalize ${tab === value ? "border-[#00696F] text-[#00696F]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>{value}</button>)}
      </nav>

      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl bg-teal-50 p-4 text-sm text-teal-800">{notice}</p>}

      {tab === "billing" ? (
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Budget & billing</h2>
          <p>Available wallet balance: <strong>{balance === null ? "Unavailable" : money(balance)}</strong></p>
          <p>Reserved funds remaining: <strong>{money(items.reduce((sum, ad) => sum + Math.max(0, Number(ad.details?.reserved || 0) - Number(ad.spent)), 0))}</strong></p>
          <p>Total recorded spend: <strong>{money(items.reduce((sum, ad) => sum + Number(ad.spent), 0))}</strong></p>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">Submitting a campaign reserves its full budget. Impressions cost ₹0.01 each, with at most one billable impression per viewer per campaign per UTC day. Unspent funds return to your wallet when a campaign is cancelled, rejected or expires.</p>
          <Link href="/wallet/dashboard" className="inline-block rounded-lg bg-[#00696F] px-4 py-3 text-sm font-semibold text-white">Open wallet & transactions</Link>
        </section>
      ) : <>
        <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[["Amount spent", money(totals.spent)], ["Impressions", count(totals.impressions)], ["Link clicks", count(totals.clicks)], ["CTR", `${totals.impressions ? (totals.clicks / totals.impressions * 100).toFixed(2) : "0.00"}%`]].map(([title, value]) => <div key={title} className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs text-slate-500">{title}</p><p className="mt-3 text-2xl font-semibold">{loading ? "…" : value}</p></div>)}
        </section>

        <section className="overflow-visible rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
            <input aria-label="Search campaigns" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search campaigns, objectives or IDs" className="min-w-48 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-[#00696F]" />
            <select aria-label="Delivery filter" value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }} className={button}><option value="all">All delivery statuses</option>{Array.from(new Set(items.map(delivery))).sort().map((status) => <option key={status} value={status}>{label(status)}</option>)}</select>
            <select aria-label="Sort campaigns" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className={button}><option value="newest">Newest first</option><option value="name">Campaign name</option><option value="spend">Highest spend</option><option value="clicks">Most clicks</option></select>
            <button type="button" onClick={() => void load()} disabled={loading || busy} className={button}>Refresh</button>
            <button type="button" onClick={exportCsv} disabled={loading || !visible.length} className={button}>Export CSV</button>
          </div>
          <div className="border-b border-slate-100 px-4 py-3"><p className="text-xs text-slate-500">{visible.length} campaigns · Lifetime results · Totals reflect filters</p></div>

          {loading ? <p role="status" className="p-12 text-center text-sm text-slate-500">Loading campaigns…</p> : !visible.length ? <div className="p-12 text-center"><h2 className="text-lg font-semibold">{items.length ? "No matching campaigns" : "Your first campaign starts here"}</h2><p className="mt-2 text-sm text-slate-500">{items.length ? "Change your search or delivery filter." : "Choose your objective, set a budget and submit your ad for review."}</p></div> : <>
            <div className="relative min-h-[660px] overflow-visible">
              <table className="w-full min-w-[880px] border-collapse whitespace-nowrap text-left text-[13px]">
                <thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Sr. No.", "Campaign", "Delivery", "Budget", "Spent", "Impressions", "Clicks", "CTR", "CPC", "Actions"].map((name) => <th scope="col" key={name} className={`px-3 py-3.5 font-semibold ${name === "Actions" ? "sticky right-0 z-10 w-40 border-l border-slate-200 bg-slate-50 text-center" : name === "Sr. No." ? "w-14 text-center" : ["Campaign", "Delivery"].includes(name) ? "text-left" : "text-right"}`}>{name}</th>)}</tr></thead>
                <tbody>{pageItems.map((ad, index) => {
                  const currentDelivery = delivery(ad);
                  const ctr = ad.details?.impressions ? ((ad.details.clicks || 0) / ad.details.impressions * 100).toFixed(2) : "0.00";
                  return <tr key={ad.id} className="group border-t border-slate-100 even:bg-slate-50/40 hover:bg-teal-50/40">
                    <td className="px-3 py-4 text-center tabular-nums text-slate-500">{(currentPage - 1) * 10 + index + 1}</td>
                    <td className="px-3 py-4"><Link title={ad.title} className="block max-w-44 truncate text-left font-semibold text-[#00696F]" href={`/ads/${ad.id}`}>{ad.title}</Link><p className="mt-1 text-xs capitalize text-slate-500">{ad.goal}</p></td>
                    <td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs capitalize ${statusClass(currentDelivery)}`}>{label(currentDelivery)}</span></td>
                    <td className="px-3 py-4 text-right tabular-nums">{money(Number(ad.budget))}</td>
                    <td className="px-3 py-4 text-right tabular-nums">{money(Number(ad.spent))}</td>
                    <td className="px-3 py-4 text-right tabular-nums">{count(ad.details?.impressions || 0)}</td>
                    <td className="px-3 py-4 text-right tabular-nums">{count(ad.details?.clicks || 0)}</td>
                    <td className="px-3 py-4 text-right tabular-nums">{ctr}%</td>
                    <td className="px-3 py-4 text-right tabular-nums">{ad.details?.clicks ? money(Number(ad.spent) / ad.details.clicks) : "—"}</td>
                    <td className="sticky right-0 z-20 border-l border-slate-100 bg-white px-3 py-4 text-center group-hover:bg-teal-50/40 has-[details[open]]:z-30">
                      <details className="group/menu relative inline-block text-left">
                        <summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#00696F] hover:bg-teal-50 [&::-webkit-details-marker]:hidden">Actions <ChevronDown className="size-3.5 transition group-open/menu:rotate-180" /></summary>
                        <div className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl shadow-slate-900/15">
                          <Link href={`/ads/${ad.id}`} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[#00696F] hover:bg-teal-50"><Eye className="size-4" />View details</Link>
                          {["DRAFT", "REJECTED"].includes(ad.details?.review || "") && <Link href={`/ads/create?edit=${ad.id}`} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"><Pencil className="size-4" />Edit draft</Link>}
                          {can(ad, "pause") && <button type="button" disabled={busy} onClick={() => void act(ad.id, "pause")} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40"><Pause className="size-4" />Pause campaign</button>}
                          {can(ad, "resume") && <button type="button" disabled={busy} onClick={() => void act(ad.id, "resume")} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40"><Play className="size-4" />Resume campaign</button>}
                          <button type="button" disabled={busy} onClick={() => void act(ad.id, "duplicate")} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40"><Copy className="size-4" />Duplicate</button>
                          {can(ad, "cancel") && <><div className="my-1 border-t border-slate-100" /><button type="button" disabled={busy} onClick={() => setConfirmId(ad.id)} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"><XCircle className="size-4" />Cancel campaign</button></>}
                        </div>
                      </details>
                    </td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
            <nav aria-label="Campaign pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3"><p className="text-xs text-slate-500">Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, visible.length)} of {visible.length} campaigns · 10 per page</p><div className="flex flex-wrap items-center gap-1"><button type="button" disabled={currentPage === 1 || busy} className={button} onClick={() => setPage(currentPage - 1)}>Previous</button>{pageNumbers.map((number) => <button type="button" key={number} disabled={busy} aria-label={`Page ${number}`} aria-current={currentPage === number ? "page" : undefined} className={currentPage === number ? "rounded-lg border border-[#00696F] bg-[#00696F] px-3 py-2 text-sm font-semibold text-white" : button} onClick={() => setPage(number)}>{number}</button>)}<button type="button" disabled={currentPage === pageCount || busy} className={button} onClick={() => setPage(currentPage + 1)}>Next</button><span className="ml-2 text-xs text-slate-500">Page {currentPage} of {pageCount}</span></div></nav>
          </>}
        </section>
      </>}

      {confirmId && <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 p-4"><section role="dialog" aria-modal="true" aria-labelledby="cancel-campaign" className="max-w-md rounded-2xl bg-white p-6 shadow-xl"><h2 id="cancel-campaign" className="text-xl font-bold">Cancel campaign?</h2><p className="mt-3 text-sm leading-6 text-slate-500">Delivery will stop and any unspent reserved funds will return to your wallet. You can duplicate this campaign later if you need a new draft.</p><div className="mt-6 flex justify-end gap-3"><button type="button" disabled={busy} className={button} onClick={() => setConfirmId(null)}>Keep campaign</button><button type="button" disabled={busy} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" onClick={() => void act(confirmId, "cancel")}>{busy ? "Cancelling…" : "Cancel & return funds"}</button></div></section></div>}
    </main>
  );
}
