"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Eye,
  Pause,
  Pencil,
  Play,
  Trash2,
  UserRound,
} from "lucide-react";
import FigmaIcon from "../home/FigmaIcon";
import {
  DEFAULT_ADS,
  formatCount,
  formatInr,
  readAds,
  resetDraft,
  writeAds,
  writeDraft,
  writeStep,
  type AdCampaign,
} from "./adStorage";

const DATE_RANGES = ["Last 7 Days", "Last 30 Days", "Last 90 Days"] as const;

const METRICS = [
  {
    key: "likes" as const,
    label: "Likes",
    icon: "/figma/icons/like.svg",
    color: "#2563EB",
    bg: "#DBEAFE",
  },
  {
    key: "comments" as const,
    label: "Comments",
    icon: "/figma/icons/comment.svg",
    color: "#16A34A",
    bg: "#DCFCE7",
  },
  {
    key: "shares" as const,
    label: "Shares",
    icon: "/figma/icons/share.svg",
    color: "#7C3AED",
    bg: "#EDE9FE",
  },
];

function TintedIcon({
  src,
  color,
  width,
  height,
}: {
  src: string;
  color: string;
  width: number;
  height: number;
}) {
  return (
    <span
      className="inline-flex overflow-clip shrink-0"
      style={{
        width,
        height,
        backgroundColor: color,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

function ActionButton({
  label,
  icon,
  danger,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-[8px] text-[12px] font-semibold leading-4 inline-flex items-center gap-1.5 transition-colors ${
        danger
          ? "bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2]"
          : "bg-[#F3F4F6] text-[#171C26] hover:bg-[#E5E7EB]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function AdManagerDashboard() {
  const router = useRouter();
  const [ads, setAds] = useState<AdCampaign[]>(DEFAULT_ADS);
  const [selectedId, setSelectedId] = useState(DEFAULT_ADS[0].id);
  const [range, setRange] = useState<(typeof DATE_RANGES)[number]>("Last 7 Days");
  const [rangeOpen, setRangeOpen] = useState(false);

  useEffect(() => {
    const stored = readAds();
    setAds(stored);
    setSelectedId(stored[0]?.id ?? "");
  }, []);

  const selected = useMemo(
    () => ads.find((ad) => ad.id === selectedId) ?? ads[0],
    [ads, selectedId]
  );

  const persist = (next: AdCampaign[]) => {
    setAds(next);
    writeAds(next);
    if (!next.some((ad) => ad.id === selectedId)) {
      setSelectedId(next[0]?.id ?? "");
    }
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col">
      <div className="flex items-start justify-between gap-4 shrink-0 pt-1 pb-4">
        <div>
          <h1 className="text-[24px] font-bold leading-8 text-[#171C26]">Ad Manager</h1>
          <p className="mt-1 text-[14px] leading-5 text-[#707786]">
            Manage your ads and track their performance.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => setRangeOpen((open) => !open)}
              className="h-10 px-3 rounded-[10px] border border-[#E5E7EB] bg-white text-[13px] font-medium text-[#171C26] inline-flex items-center gap-2 shadow-[0px_1px_2px_rgba(0,0,0,0.04)]"
            >
              <CalendarDays className="size-4 text-[#707786]" />
              {range}
              <FigmaIcon src="/figma/icons/chevron-down.svg" alt="" width={8} height={5} />
            </button>
            {rangeOpen ? (
              <div className="absolute right-0 top-11 z-20 w-full min-w-[160px] rounded-[10px] border border-[#E5E7EB] bg-white p-1 shadow-[0px_8px_24px_rgba(15,23,42,0.12)]">
                {DATE_RANGES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setRange(option);
                      setRangeOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-[8px] text-[13px] ${
                      range === option
                        ? "bg-[rgba(0,105,111,0.12)] text-[#00696F] font-semibold"
                        : "text-[#171C26] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <Link
            href="/ads/create"
            onClick={() => {
              resetDraft();
              writeStep("goal");
            }}
            className="h-10 px-4 rounded-[10px] bg-[#00696F] text-white text-[13px] font-semibold inline-flex items-center hover:bg-[#00585D] transition-colors"
          >
            Create Ad
          </Link>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex items-stretch gap-6">
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto no-scrollbar overscroll-contain pb-10 flex flex-col gap-4">
          {ads.length === 0 ? (
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-10 text-center">
              <p className="text-[16px] font-semibold text-[#171C26]">No ads yet</p>
              <p className="mt-1 text-[14px] text-[#707786]">
                Boost a post to start tracking performance here.
              </p>
              <Link
                href="/ads/create"
                className="mt-5 inline-flex h-11 px-5 rounded-[10px] bg-[#00696F] text-white text-[14px] font-semibold items-center"
              >
                Create Ad
              </Link>
            </div>
          ) : (
            ads.map((ad) => {
              const active = selected?.id === ad.id;
              return (
                <article
                  key={ad.id}
                  onClick={() => setSelectedId(ad.id)}
                  className={`bg-white rounded-[16px] p-4 shadow-[0px_1px_3px_rgba(15,23,42,0.06)] border cursor-pointer transition-colors ${
                    active ? "border-[#00696F]" : "border-[#EEF2F6] hover:border-[#D1D5DB]"
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="relative w-[118px] h-[118px] rounded-[12px] overflow-hidden shrink-0 bg-[#F3F4F6]">
                      <Image
                        src={ad.image}
                        alt=""
                        fill
                        sizes="118px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span
                          className={`h-6 px-2 rounded-[6px] text-[11px] font-bold leading-4 inline-flex items-center ${
                            ad.status === "active"
                              ? "bg-[#DCFCE7] text-[#15803D]"
                              : "bg-[#F3F4F6] text-[#4B5563]"
                          }`}
                        >
                          {ad.status === "active" ? "Active" : "Paused"}
                        </span>
                        <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                          <ActionButton
                            label="Edit"
                            icon={<Pencil className="size-3.5" />}
                            onClick={() => {
                              resetDraft();
                              writeDraft({
                                editingId: ad.id,
                                goal: ad.goal,
                                cta: ad.goal === "profile" ? "Visit Profile" : "Learn More",
                              });
                              writeStep("goal");
                              router.push("/ads/create");
                            }}
                          />
                          <ActionButton
                            label={ad.status === "active" ? "Pause" : "Resume"}
                            icon={
                              ad.status === "active" ? (
                                <Pause className="size-3.5" />
                              ) : (
                                <Play className="size-3.5" />
                              )
                            }
                            onClick={() =>
                              persist(
                                ads.map((item) =>
                                  item.id === ad.id
                                    ? {
                                        ...item,
                                        status: item.status === "active" ? "paused" : "active",
                                      }
                                    : item
                                )
                              )
                            }
                          />
                          <ActionButton
                            label="Delete"
                            danger
                            icon={<Trash2 className="size-3.5" />}
                            onClick={() => {
                              if (!window.confirm("Delete this ad?")) return;
                              persist(ads.filter((item) => item.id !== ad.id));
                            }}
                          />
                        </div>
                      </div>
                      <h2 className="text-[20px] font-bold leading-7 text-[#171C26]">{ad.title}</h2>
                      <p className="mt-1 text-[14px] leading-5 text-[#404754]">{ad.body}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] leading-4 text-[#707786]">
                        <span className="inline-flex items-center gap-1.5">
                          <FigmaIcon src="/figma/icons/clock.svg" alt="" width={14} height={14} />
                          Start Date: {ad.startDate}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <FigmaIcon src="/figma/icons/clock.svg" alt="" width={14} height={14} />
                          End Date: {ad.endDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {selected ? (
          <aside className="hidden xl:flex w-[320px] h-full min-h-0 shrink-0 overflow-y-auto no-scrollbar overscroll-contain flex-col self-stretch bg-white rounded-[16px] border border-[#E5E7EB] shadow-[0px_1px_3px_rgba(15,23,42,0.06)] px-6 py-8">
            <h2 className="text-[16px] font-bold leading-6 text-[#171C26] mb-4">
              Performance Overview
            </h2>

            <div className="flex flex-col gap-2.5">
              {METRICS.map((metric) => (
                <div
                  key={metric.key}
                  className="rounded-[12px] bg-[#F8F9FF] border border-[#EEF2F6] px-3 py-3 flex items-center gap-3"
                >
                  <span
                    className="size-9 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ backgroundColor: metric.bg }}
                  >
                    <TintedIcon src={metric.icon} color={metric.color} width={16} height={16} />
                  </span>
                  <div>
                    <p className="text-[12px] leading-4 text-[#707786]">{metric.label}</p>
                    <p className="text-[18px] font-bold leading-7 text-[#171C26]">
                      {formatCount(selected.metrics[metric.key])}
                    </p>
                  </div>
                </div>
              ))}
              <div className="rounded-[12px] bg-[#F8F9FF] border border-[#EEF2F6] px-3 py-3 flex items-center gap-3">
                <span className="size-9 rounded-[10px] bg-[#FFEDD5] flex items-center justify-center shrink-0">
                  <UserRound className="size-4 text-[#EA580C]" />
                </span>
                <div>
                  <p className="text-[12px] leading-4 text-[#707786]">Leads (Converted)</p>
                  <p className="text-[18px] font-bold leading-7 text-[#171C26]">
                    {formatCount(selected.metrics.leads)}
                  </p>
                </div>
              </div>
              <div className="rounded-[12px] bg-[#F8F9FF] border border-[#EEF2F6] px-3 py-3 flex items-center gap-3">
                <span className="size-9 rounded-[10px] bg-[#FEE2E2] flex items-center justify-center shrink-0">
                  <Eye className="size-4 text-[#DC2626]" />
                </span>
                <div>
                  <p className="text-[12px] leading-4 text-[#707786]">Reach</p>
                  <p className="text-[18px] font-bold leading-7 text-[#171C26]">
                    {formatCount(selected.metrics.reach)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[12px] bg-[#F8F9FF] border border-[#E5E7EB] p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="size-7 rounded-full bg-[#DBEAFE] flex items-center justify-center">
                  <FigmaIcon src="/figma/icons/friends-lock.svg" alt="" width={12} height={12} />
                </span>
                <h3 className="text-[14px] font-bold leading-5 text-[#171C26]">Targeting Details</h3>
              </div>
              <dl className="flex flex-col gap-3">
                <div>
                  <dt className="text-[11px] font-semibold tracking-[0.6px] uppercase text-[#707786]">
                    Target Audience
                  </dt>
                  <dd className="text-[13px] font-medium text-[#171C26]">{selected.audienceLabel}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold tracking-[0.6px] uppercase text-[#707786]">
                    Location
                  </dt>
                  <dd className="text-[13px] font-medium text-[#171C26]">{selected.locationLabel}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold tracking-[0.6px] uppercase text-[#707786]">
                    Interests
                  </dt>
                  <dd className="text-[13px] font-medium text-[#171C26]">{selected.interestsLabel}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-4 pt-6 border-t border-[#E5E7EB] flex flex-col gap-4">
              {[
                ["Total Spend", `₹${formatInr(selected.metrics.spend)}`],
                ["Impressions", formatCount(selected.metrics.impressions)],
                ["CTR (Click Through Rate)", `${selected.metrics.ctr.toFixed(2)}%`],
                ["CPC (Cost Per Click)", `₹${selected.metrics.cpc.toFixed(2)}`],
                ["Frequency", selected.metrics.frequency.toFixed(2)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3">
                  <span className="text-[13px] leading-5 text-[#707786]">{label}</span>
                  <span className="text-[13px] font-semibold leading-5 text-[#171C26] text-right">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
