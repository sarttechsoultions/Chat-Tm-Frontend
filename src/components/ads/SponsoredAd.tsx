"use client";

import { ExternalLink, MoreHorizontal, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { adsRequest } from "../../lib/api/ads";
import { UserAvatar } from "../ui/UserAvatar";

type Ad = { id: string; advertiser: { firstName: string; username: string; avatar?: string | null }; headline: string; body: string; image: string; destination: string; cta: string };

function safeDomain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return "Visit website"; }
}

export default function SponsoredAd({ compact = false }: { compact?: boolean }) {
  const [ad, setAd] = useState<Ad | null>(null);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    void adsRequest("/delivery/feed").then((data) => { if (!cancelled) setAd(data.ad); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ad || !ref.current) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let recorded = false;
    const observer = new IntersectionObserver((entries) => {
      clearTimeout(timer);
      if (entries[0].isIntersecting && entries[0].intersectionRatio >= 0.5 && !recorded) {
        timer = setTimeout(() => {
          if (document.hidden) return;
          recorded = true;
          void adsRequest(`/${ad.id}/event`, { type: "impression" }).catch(() => { recorded = false; });
        }, 1000);
      }
    }, { threshold: [0, 0.5] });
    observer.observe(ref.current);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [ad]);

  if (!ad) return null;
  const advertiserName = ad.advertiser.firstName || ad.advertiser.username;
  const visit = () => { void adsRequest(`/${ad.id}/event`, { type: "click" }).catch(() => {}); };

  if (compact) return <section ref={ref} aria-label={`Sponsored by ${advertiserName}`} className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
    <div className="mb-3 flex items-center justify-between"><h3 className="text-base font-bold text-[#111827]">Sponsored</h3><ShieldCheck aria-hidden className="size-4 text-slate-400" /></div>
    <div className="flex items-start gap-3"><img src={ad.image} alt="" className="size-20 shrink-0 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#111827]">{advertiserName}</p><p className="mt-0.5 line-clamp-2 text-xs leading-4 text-slate-600">{ad.headline}</p><a href={ad.destination} target="_blank" rel="noopener noreferrer sponsored" onClick={visit} className="mt-2 flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-[#E9F4F4] px-3 text-xs font-bold text-[#00696F] transition-colors hover:bg-[#D8ECEC]">{ad.cta}<ExternalLink aria-hidden className="size-3" /></a></div></div>
  </section>;

  return <section ref={ref} aria-label={`Sponsored by ${advertiserName}`} className="w-full overflow-hidden rounded-[16px] bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
    <div className="flex items-start justify-between px-4 pb-2 pt-4"><div className="flex min-w-0 items-center gap-3"><UserAvatar avatarUrl={ad.advertiser.avatar || ""} name={advertiserName} size={40} /><div className="min-w-0"><p className="truncate text-[16px] font-bold leading-5 text-[#111827]">{advertiserName}</p><p className="mt-0.5 text-[12px] leading-4 text-[#6B7280]">Sponsored</p></div></div><button type="button" aria-label="Ad options" title="Sponsored content" className="rounded-full p-2 text-[#6B7280] hover:bg-slate-100"><MoreHorizontal className="size-5" /></button></div>
    {ad.body ? <p className="px-4 pb-3 text-[14px] leading-5 text-[#1F2937]">{ad.body}</p> : null}
    <img src={ad.image} alt={ad.headline} className="block aspect-[4/3] w-full bg-slate-100 object-cover" />
    <div className="flex items-center gap-3 border-b border-[#F3F4F6] bg-[#F8FAFC] px-4 py-3"><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium uppercase tracking-wide text-[#6B7280]">{safeDomain(ad.destination)}</p><h3 className="mt-0.5 truncate text-[15px] font-bold text-[#111827]">{ad.headline}</h3></div><a href={ad.destination} target="_blank" rel="noopener noreferrer sponsored" onClick={visit} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg bg-[#006F75] px-3 text-[13px] font-bold text-white transition-colors hover:bg-[#005A5F]">{ad.cta}<ExternalLink aria-hidden className="size-3.5" /></a></div>
    <div className="flex items-center justify-between px-4 py-2.5 text-[12px] text-[#6B7280]"><span>Paid partnership</span><span>Only the button opens this ad</span></div>
  </section>;
}
