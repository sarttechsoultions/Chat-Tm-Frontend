"use client";

import { useEffect, useId, useState } from "react";
import { Check, Globe2, MapPin, Search, X } from "lucide-react";
import { adsRequest } from "../../lib/api/ads";

type Location = { id: string; name: string; type: string; label: string };
type Selection = { allLocations?: boolean; locations?: string[]; location?: string };

export default function LocationSelector({ value, onChange }: { value: Selection; onChange: (next: { allLocations: boolean; locations: string[]; location: string }) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Location[]>([]);
  const [known, setKnown] = useState<Record<string, Location>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const hintId = useId();
  const selected = value.locations || [];
  const all = value.allLocations ?? (!selected.length && (!value.location || value.location.toLowerCase() === "all users"));
  const selectedKey = selected.join(",");

  useEffect(() => {
    if (!selectedKey) return;
    let current = true;
    void adsRequest(`/locations?ids=${encodeURIComponent(selectedKey)}`).then((data) => {
      if (current) setKnown((old) => ({ ...old, ...Object.fromEntries(data.items.map((location: Location) => [location.id, location])) }));
    }).catch(() => {});
    return () => { current = false; };
  }, [selectedKey]);

  useEffect(() => {
    if (!open || all) return;
    let current = true;
    const timer = setTimeout(() => {
      void adsRequest(`/locations?q=${encodeURIComponent(query)}`).then((data) => {
        if (!current) return;
        setItems(data.items);
        setKnown((old) => ({ ...old, ...Object.fromEntries(data.items.map((location: Location) => [location.id, location])) }));
        setError("");
      }).catch((requestError) => {
        if (current) setError(requestError instanceof Error ? requestError.message : "Unable to search locations");
      }).finally(() => { if (current) setLoading(false); });
    }, 200);
    return () => { current = false; clearTimeout(timer); };
  }, [all, open, query]);

  function selectLocation(location: Location) {
    if (selected.includes(location.id) || selected.length >= 20) return;
    onChange({ allLocations: false, locations: [...selected, location.id], location: "All users" });
    setQuery(""); setOpen(false); setActive(-1);
  }

  function selectCoverage(nextAll: boolean) {
    onChange({ allLocations: nextAll, locations: nextAll ? [] : selected, location: "All users" });
    setOpen(!nextAll); setLoading(!nextAll); setActive(-1);
  }

  return (
    <fieldset className="space-y-4">
      <div>
        <legend className="text-sm font-semibold text-slate-800">Location</legend>
        <p className="mt-1 text-xs leading-5 text-slate-500">Choose who can see your campaign based on their profile location.</p>
      </div>

      <div className="grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Location coverage">
        <button type="button" aria-pressed={all} onClick={() => selectCoverage(true)} className={`group relative flex min-h-20 items-start gap-3 rounded-xl border p-3.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00696F] ${all ? "border-[#007b80] bg-[#effafa] text-[#00696F] shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-slate-50"}`}>
          <span className={`grid size-9 shrink-0 place-items-center rounded-full ${all ? "bg-[#007b80] text-white" : "bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-[#00696F]"}`}><Globe2 className="size-4.5" /></span>
          <span className="pr-5"><span className="block text-sm font-semibold">All locations</span><span className="mt-0.5 block text-xs leading-4 text-slate-500">Reach everyone eligible for this campaign.</span></span>
          {all && <Check className="absolute right-3 top-3 size-4 text-[#00696F]" aria-label="Selected" />}
        </button>
        <button type="button" aria-pressed={!all} onClick={() => selectCoverage(false)} className={`group relative flex min-h-20 items-start gap-3 rounded-xl border p-3.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00696F] ${!all ? "border-[#007b80] bg-[#effafa] text-[#00696F] shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-slate-50"}`}>
          <span className={`grid size-9 shrink-0 place-items-center rounded-full ${!all ? "bg-[#007b80] text-white" : "bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-[#00696F]"}`}><MapPin className="size-4.5" /></span>
          <span className="pr-5"><span className="block text-sm font-semibold">Choose locations</span><span className="mt-0.5 block text-xs leading-4 text-slate-500">Target selected states, territories or cities.</span></span>
          {!all && <Check className="absolute right-3 top-3 size-4 text-[#00696F]" aria-label="Selected" />}
        </button>
      </div>

      {all ? <div className="flex max-w-xl items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600"><Globe2 className="mt-0.5 size-4 shrink-0 text-[#00696F]" />Your ad can be shown to eligible people in any supported location, subject to your age and delivery settings.</div> : <>
        <div className="relative max-w-xl" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) { setOpen(false); setActive(-1); } }}>
          <label className="mb-1.5 block text-xs font-medium text-slate-600" htmlFor={`${listId}-search`}>Search locations</label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 shadow-sm transition focus-within:border-[#007b80] focus-within:ring-2 focus-within:ring-teal-100"><Search className="size-4 shrink-0 text-slate-400" /><input id={`${listId}-search`} role="combobox" aria-label="Search locations" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined} aria-describedby={hintId} autoComplete="off" value={query} maxLength={100} placeholder="Search a state, territory or city" className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" onFocus={() => { setOpen(true); setLoading(true); }} onChange={(event) => { setQuery(event.target.value); setItems([]); setOpen(true); setLoading(true); setActive(-1); }} onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); setActive(-1); } if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActive((index) => Math.min(index + 1, items.length - 1)); } if (event.key === "ArrowUp") { event.preventDefault(); setActive((index) => Math.max(0, index - 1)); } if (event.key === "Enter" && open && items[active]) { event.preventDefault(); selectLocation(items[active]); } }} /></div>
          {open && <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"><div id={listId} role="listbox" aria-label="Location suggestions">{items.map((location, index) => { const isSelected = selected.includes(location.id); return <button type="button" role="option" id={`${listId}-${index}`} aria-selected={isSelected} aria-disabled={isSelected || selected.length >= 20} key={location.id} onMouseDown={(event) => event.preventDefault()} onClick={() => selectLocation(location)} className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition ${active === index ? "bg-teal-50" : "hover:bg-slate-50"} ${isSelected ? "cursor-default opacity-50" : ""}`}><MapPin className="size-4 shrink-0 text-slate-400" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-slate-700">{location.name}</span><span className="block text-xs text-slate-500">{location.label} · {location.type}</span></span>{isSelected && <span className="text-xs font-medium text-[#00696F]">Added</span>}</button>; })}</div>{loading && <p role="status" className="p-3 text-xs text-slate-500">Searching locations…</p>}{!loading && !items.length && !error && <p role="status" className="p-3 text-sm text-slate-500">No supported locations found. Try another name.</p>}{error && <p role="alert" className="p-3 text-sm text-red-600">{error}</p>}</div>}
        </div>
        {selected.length > 0 && <div className="flex max-w-xl flex-wrap gap-2">{selected.map((id) => <span key={id} className="inline-flex max-w-full items-center gap-2 rounded-full border border-teal-100 bg-teal-50 py-1.5 pl-3 pr-1.5 text-sm text-[#00696F]"><MapPin className="size-3.5 shrink-0" /><span className="truncate">{known[id]?.label || id}</span><button type="button" aria-label={`Remove ${known[id]?.label || id}`} onClick={() => onChange({ allLocations: false, locations: selected.filter((item) => item !== id), location: "All users" })} className="rounded-full p-1 transition hover:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00696F]"><X className="size-3.5" /></button></span>)}</div>}
        {!selected.length && <p className="text-xs font-medium text-amber-700">Select at least one location to continue.</p>}
        <p id={hintId} className="max-w-xl text-xs leading-5 text-slate-500">Search India’s states, union territories and supported cities. You can select up to 20 locations.</p>
      </>}
    </fieldset>
  );
}
