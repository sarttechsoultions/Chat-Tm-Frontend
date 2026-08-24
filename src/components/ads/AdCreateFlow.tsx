"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ExternalLink,
  Heart,
  MapPin,
  MessageCircle,
  Rocket,
  Search,
  Target,
  ThumbsUp,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import FigmaIcon from "../home/FigmaIcon";
import { readBalance } from "../wallet/walletStorage";
import {
  AD_OFFICE_IMAGE,
  audienceLabel,
  campaignCopy,
  campaignImage,
  defaultCta,
  durationDays,
  EMPTY_DRAFT,
  endDateLabel,
  formatCount,
  goalLabel,
  interestsLabel,
  locationLabel,
  readAds,
  readDraft,
  readStep,
  resetDraft,
  startDateLabel,
  totalBudget,
  writeAds,
  writeDraft,
  writeStep,
  type AdCampaign,
  type AdDraft,
  type CreateStep,
  type DurationOption,
} from "./adStorage";

const STEPS: CreateStep[] = ["goal", "refine", "audience", "location", "budget", "review"];

const ENGAGEMENT_CTAS = ["Visit Profile", "Follow", "Learn More", "Sign Up"];
const WEBSITE_CTAS = ["Learn More", "Shop Now", "Sign Up", "Contact Us", "Book Now", "Apply Now"];
const INTEREST_SUGGESTIONS = [
  "Social Media",
  "Small Business",
  "E-commerce",
  "Digital Marketing",
  "Fashion",
  "Shopping",
  "Lifestyle",
  "Technology",
];
const CITY_SUGGESTIONS = [
  "San Francisco, CA",
  "New York, NY",
  "Bangalore, India",
  "Mumbai, India",
  "Delhi, India",
];

function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`h-11 px-5 rounded-[12px] bg-[#00696F] text-white text-[14px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#00585D] disabled:opacity-50 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

function WizardFooter({
  onBack,
  onNext,
  nextLabel = "Next",
  nextIcon = true,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextIcon?: boolean;
}) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="h-11 px-2 text-[14px] font-semibold text-[#171C26] inline-flex items-center gap-2 hover:text-[#00696F]"
      >
        <ArrowLeft className="size-4" />
        Cancel
      </button>
      <PrimaryButton onClick={onNext}>
        {nextLabel}
        {nextIcon ? <ArrowRight className="size-4" /> : null}
      </PrimaryButton>
    </div>
  );
}

function AdPreview({
  draft,
  caption,
  image,
  headline,
  url,
}: {
  draft: AdDraft;
  caption: string;
  image: string;
  headline?: string;
  url?: string;
}) {
  return (
    <aside className="w-full xl:w-[280px] shrink-0">
      <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#707786] mb-3">
        Ad Preview
      </p>
      <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-[0px_8px_24px_rgba(15,23,42,0.08)] overflow-hidden">
        <div className="px-3 pt-3 flex items-center gap-2">
          <span className="relative size-8 rounded-full overflow-hidden shrink-0">
            <Image src="/figma/photos/logo.png" alt="" fill sizes="32px" className="object-cover" />
          </span>
          <div>
            <p className="text-[13px] font-bold leading-4 text-[#171C26]">ChatTm Official</p>
            <p className="text-[11px] leading-4 text-[#707786]">Sponsored</p>
          </div>
        </div>
        <p className="px-3 pt-2 pb-2 text-[13px] leading-5 text-[#404754]">{caption}</p>
        <div className="relative h-[148px] bg-[#F3F4F6]">
          <Image src={image} alt="" fill sizes="280px" className="object-cover" />
        </div>
        {headline || url ? (
          <div className="px-3 py-2.5 border-b border-[#EEF2F6] flex items-center justify-between gap-2">
            <div className="min-w-0">
              {url ? (
                <p className="text-[10px] font-semibold tracking-[0.4px] uppercase text-[#707786] truncate">
                  {url.replace(/^https?:\/\//, "").toUpperCase()}
                </p>
              ) : null}
              {headline ? (
                <p className="text-[13px] font-bold text-[#171C26] truncate">{headline}</p>
              ) : null}
            </div>
            <span className="h-8 px-3 rounded-[8px] bg-[#00696F] text-white text-[11px] font-semibold inline-flex items-center shrink-0">
              {draft.cta}
            </span>
          </div>
        ) : null}
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[#707786]">
            <FigmaIcon src="/figma/icons/like.svg" alt="" width={16} height={14} />
            <FigmaIcon src="/figma/icons/comment.svg" alt="" width={16} height={16} />
            <FigmaIcon src="/figma/icons/share.svg" alt="" width={16} height={14} />
          </div>
          {!headline ? (
            <span className="h-8 px-3 rounded-[8px] bg-[#00696F] text-white text-[11px] font-semibold inline-flex items-center">
              {draft.cta}
            </span>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function ChoiceCard({
  selected,
  icon,
  title,
  description,
  onClick,
  check,
}: {
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  check?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-[14px] border p-4 transition-colors ${
        selected
          ? "border-[#00696F] bg-[rgba(0,105,111,0.06)]"
          : "border-[#E5E7EB] bg-white hover:border-[#C5DADC]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="size-10 rounded-[10px] bg-[rgba(0,105,111,0.12)] text-[#00696F] flex items-center justify-center shrink-0">
          {icon}
        </span>
        {check && selected ? (
          <span className="size-5 rounded-full bg-[#00696F] text-white flex items-center justify-center">
            <Check className="size-3" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-[15px] font-bold leading-5 text-[#171C26]">{title}</p>
      <p className="mt-1 text-[13px] leading-5 text-[#707786]">{description}</p>
    </button>
  );
}

function RadioRow({
  selected,
  icon,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-start gap-3 rounded-[14px] border px-4 py-4 text-left transition-colors ${
        selected ? "border-[#00696F] bg-[rgba(0,105,111,0.06)]" : "border-[#E5E7EB] bg-white"
      }`}
    >
      <span
        className={`mt-1 size-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
          selected ? "border-[#00696F]" : "border-[#D1D5DB]"
        }`}
      >
        {selected ? <span className="size-2 rounded-full bg-[#00696F]" /> : null}
      </span>
      <span className="size-9 rounded-[10px] bg-[rgba(0,105,111,0.12)] text-[#00696F] flex items-center justify-center shrink-0">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-bold text-[#171C26]">{title}</span>
        <span className="block text-[13px] leading-5 text-[#707786]">{description}</span>
      </span>
    </button>
  );
}

function TagInput({
  values,
  placeholder,
  suggestions,
  onAdd,
  onRemove,
}: {
  values: string[];
  placeholder: string;
  suggestions: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const matches = suggestions.filter(
    (item) =>
      !values.includes(item) && item.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div>
      <div className="h-11 rounded-[10px] border border-[#E5E7EB] bg-white px-3 flex items-center gap-2">
        <Search className="size-4 text-[#9CA3AF]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              const next = query.trim();
              if (!next) return;
              onAdd(next);
              setQuery("");
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[14px] text-[#171C26] placeholder:text-[#9CA3AF] focus:outline-none"
        />
      </div>
      {query && matches.length ? (
        <div className="mt-1 rounded-[10px] border border-[#E5E7EB] bg-white overflow-hidden">
          {matches.slice(0, 5).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                onAdd(item);
                setQuery("");
              }}
              className="w-full text-left px-3 py-2 text-[13px] text-[#171C26] hover:bg-[#F3F4F6]"
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="h-8 px-3 rounded-full bg-[rgba(0,105,111,0.12)] text-[#00696F] text-[13px] font-medium inline-flex items-center gap-1.5"
          >
            {value}
            <button type="button" onClick={() => onRemove(value)} aria-label={`Remove ${value}`}>
              <X className="size-3.5" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdCreateFlow() {
  const router = useRouter();
  const [step, setStep] = useState<CreateStep>("goal");
  const [draft, setDraft] = useState<AdDraft>(EMPTY_DRAFT);
  const [walletBalance, setWalletBalance] = useState(3200);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDraft(readDraft());
    setStep(readStep());
    try {
      setWalletBalance(readBalance());
    } catch {
      setWalletBalance(3200);
    }
    setReady(true);
  }, []);

  const patch = (next: Partial<AdDraft>) => {
    setDraft((current) => {
      const merged = { ...current, ...next };
      writeDraft(merged);
      return merged;
    });
  };

  const go = (next: CreateStep) => {
    setStep(next);
    writeStep(next);
  };

  const back = () => {
    const index = STEPS.indexOf(step);
    if (index <= 0) {
      router.push("/ads");
      return;
    }
    go(STEPS[index - 1]);
  };

  const next = () => {
    const index = STEPS.indexOf(step);
    go(STEPS[Math.min(index + 1, STEPS.length - 1)]);
  };

  const copy = campaignCopy(draft);
  const previewImage = campaignImage(draft);
  const days = durationDays(draft);
  const budget = totalBudget(draft);
  const sufficient = walletBalance >= budget;
  const estimatedReach = useMemo(() => {
    const low = Math.round((draft.dailyBudget / 1500) * 12000);
    const high = Math.round((draft.dailyBudget / 1500) * 35000);
    return `${formatCount(low)} - ${formatCount(high)} people per day`;
  }, [draft.dailyBudget]);

  if (!ready) {
    return <div className="w-full min-h-[400px]" />;
  }

  const cardClass =
    "w-full max-w-[920px] mx-auto bg-white rounded-[16px] border border-[#E5E7EB] shadow-[0px_8px_24px_rgba(15,23,42,0.06)] p-6 sm:p-8";

  return (
    <div className="w-full pt-2 pb-12">
      {step === "goal" ? (
        <div className={cardClass}>
          <h1 className="text-[28px] font-bold leading-9 text-[#3C494A]">What is your goal?</h1>
          <p className="mt-2 text-[14px] leading-5 text-[#707786]">
            Select the primary outcome you want from this boosted post.
          </p>
          <div className="mt-8 flex flex-col xl:flex-row gap-8">
            <div className="flex-1 grid gap-3">
              <ChoiceCard
                selected={draft.goal === "engagement"}
                check
                icon={<MessageCircle className="size-5" />}
                title="Get More Engagement"
                description="Increase likes, comments, and shares on your post to build community interaction."
                onClick={() => patch({ goal: "engagement", cta: defaultCta("engagement") })}
              />
              <ChoiceCard
                selected={draft.goal === "profile"}
                check
                icon={<UserPlus className="size-5" />}
                title="Get More Profile Visits"
                description="Drive traffic to your profile to gain followers and showcase your brand identity."
                onClick={() => patch({ goal: "profile", cta: defaultCta("profile") })}
              />
              <ChoiceCard
                selected={draft.goal === "website"}
                check
                icon={<ExternalLink className="size-5" />}
                title="Get More Website Visitors"
                description="Direct people to your website, online store, or a specific landing page."
                onClick={() => patch({ goal: "website", cta: defaultCta("website") })}
              />
            </div>
            <AdPreview
              draft={draft}
              caption="Elevate your team's workflow with our new integrated features. #ChatTm #Productivity"
              image={AD_OFFICE_IMAGE}
            />
          </div>
          <WizardFooter onBack={back} onNext={next} />
        </div>
      ) : null}

      {step === "refine" && draft.goal === "engagement" ? (
        <div className={`${cardClass} max-w-[760px]`}>
          <h1 className="text-[28px] font-bold leading-9 text-[#171C26]">
            Refine your engagement goal
          </h1>
          <p className="mt-2 text-[14px] leading-5 text-[#707786]">
            Choose the primary way you want people to interact with your post.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <RadioRow
              selected={draft.engagementRefine === "post"}
              icon={<Heart className="size-5" />}
              title="Post Engagement"
              description="Get more likes, shares, and comments."
              onClick={() => patch({ engagementRefine: "post" })}
            />
            <RadioRow
              selected={draft.engagementRefine === "page"}
              icon={<ThumbsUp className="size-5" />}
              title="Page Likes"
              description="Get more people to like and follow your Page."
              onClick={() => patch({ engagementRefine: "page" })}
            />
            <RadioRow
              selected={draft.engagementRefine === "event"}
              icon={<CalendarDays className="size-5" />}
              title="Event Responses"
              description="Get more people to see and respond to your event."
              onClick={() => patch({ engagementRefine: "event" })}
            />
          </div>
          <WizardFooter onBack={back} onNext={next} />
        </div>
      ) : null}

      {step === "refine" && draft.goal === "profile" ? (
        <div className={cardClass}>
          <div className="flex flex-col xl:flex-row gap-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-[28px] font-bold leading-9 text-[#171C26]">
                Refine your profile visit goal
              </h1>
              <p className="mt-2 text-[14px] leading-5 text-[#707786]">
                Where do you want to send people when they engage with your boosted post?
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <RadioRow
                  selected={draft.profileDest === "profile"}
                  icon={<UserPlus className="size-5" />}
                  title="Visit My Profile"
                  description="Direct people to your main profile page to see your recent posts, highlights, and follow you."
                  onClick={() => patch({ profileDest: "profile" })}
                />
                <RadioRow
                  selected={draft.profileDest === "page"}
                  icon={<FigmaIcon src="/figma/icons/pages.svg" alt="" width={18} height={18} />}
                  title="Visit Business Page"
                  description="Send people to your official business directory page to see your services, reviews, and contact info."
                  onClick={() => patch({ profileDest: "page" })}
                />
              </div>
              <p className="mt-8 text-[14px] font-semibold text-[#171C26]">
                Choose the button text that will appear on your ad. This sets clear expectations for
                your audience.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {ENGAGEMENT_CTAS.map((cta) => {
                  const selected = draft.cta === cta;
                  return (
                    <button
                      key={cta}
                      type="button"
                      onClick={() => patch({ cta })}
                      className={`h-12 rounded-[12px] border text-[14px] font-semibold ${
                        selected
                          ? "border-[#00696F] text-[#00696F] bg-[rgba(0,105,111,0.06)]"
                          : "border-[#E5E7EB] text-[#171C26]"
                      }`}
                    >
                      {cta}
                    </button>
                  );
                })}
              </div>
              <WizardFooter onBack={back} onNext={next} />
            </div>
            <AdPreview draft={draft} caption={copy.body} image={previewImage} />
          </div>
        </div>
      ) : null}

      {step === "refine" && draft.goal === "website" ? (
        <div className={cardClass}>
          <div className="flex flex-col xl:flex-row gap-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-[28px] font-bold leading-9 text-[#171C26]">
                Refine your website visitor goal
              </h1>
              <p className="mt-2 text-[14px] leading-5 text-[#707786]">
                Where do you want to send people when they engage with your boosted post?
              </p>
              <label className="mt-6 block text-[13px] font-semibold text-[#171C26] mb-2">
                Website URL
              </label>
              <div className="h-12 rounded-[10px] border border-[#E5E7EB] px-3 flex items-center gap-2">
                <FigmaIcon src="/figma/icons/globe.svg" alt="" width={16} height={16} />
                <input
                  value={draft.websiteUrl}
                  onChange={(event) => patch({ websiteUrl: event.target.value })}
                  className="flex-1 bg-transparent text-[14px] text-[#171C26] focus:outline-none"
                />
              </div>
              <p className="mt-2 text-[12px] text-[#707786]">
                Ensure this link is active and relevant to your ad content.
              </p>
              <p className="mt-6 text-[14px] font-semibold text-[#171C26]">Call to Action Button</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {WEBSITE_CTAS.map((cta) => {
                  const selected = draft.cta === cta;
                  return (
                    <button
                      key={cta}
                      type="button"
                      onClick={() => patch({ cta })}
                      className={`h-12 rounded-[12px] border text-[14px] font-semibold ${
                        selected
                          ? "border-[#00696F] text-[#00696F] bg-[rgba(0,105,111,0.06)]"
                          : "border-[#E5E7EB] text-[#171C26]"
                      }`}
                    >
                      {cta}
                    </button>
                  );
                })}
              </div>
              <WizardFooter onBack={back} onNext={next} />
            </div>
            <AdPreview
              draft={draft}
              caption={copy.body}
              image={previewImage}
              headline={copy.title}
              url={draft.websiteUrl}
            />
          </div>
        </div>
      ) : null}

      {step === "audience" ? (
        <div className={`${cardClass} max-w-[760px]`}>
          <h1 className="text-[28px] font-bold leading-9 text-[#171C26]">Define Your Audience</h1>
          <p className="mt-2 text-[14px] leading-5 text-[#707786]">
            Who should see your promoted content? Select the demographics and interests that match
            your ideal customer.
          </p>
          <div className="mt-8">
            <p className="text-[13px] font-semibold text-[#171C26] mb-2">Gender</p>
            <div className="inline-flex rounded-[10px] border border-[#E5E7EB] overflow-hidden">
              {(["male", "female", "all"] as const).map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => patch({ gender })}
                  className={`h-10 px-5 text-[13px] font-semibold capitalize ${
                    draft.gender === gender
                      ? "bg-[#00696F] text-white"
                      : "bg-white text-[#171C26] hover:bg-[#F9FAFB]"
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold text-[#171C26]">Age range</p>
              <span className="text-[13px] font-bold text-[#00696F]">
                {draft.ageMin} – {draft.ageMax}
              </span>
            </div>
            <div className="relative h-8">
              <div className="absolute left-0 right-0 top-3 h-1.5 rounded-full bg-[#E5E7EB]" />
              <div
                className="absolute top-3 h-1.5 rounded-full bg-[#00696F]"
                style={{
                  left: `${((draft.ageMin - 13) / 52) * 100}%`,
                  right: `${((65 - draft.ageMax) / 52) * 100}%`,
                }}
              />
              <input
                type="range"
                min={13}
                max={65}
                value={draft.ageMin}
                onChange={(event) =>
                  patch({ ageMin: Math.min(Number(event.target.value), draft.ageMax - 1) })
                }
                className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00696F]"
              />
              <input
                type="range"
                min={13}
                max={65}
                value={draft.ageMax}
                onChange={(event) =>
                  patch({ ageMax: Math.max(Number(event.target.value), draft.ageMin + 1) })
                }
                className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00696F]"
              />
            </div>
            <div className="flex justify-between text-[12px] text-[#707786]">
              <span>13</span>
              <span>65+</span>
            </div>
          </div>
          <div className="mt-8">
            <p className="text-[13px] font-semibold text-[#171C26] mb-2">Interests & Behaviors</p>
            <TagInput
              values={draft.interests}
              placeholder="Search interests (e.g. Digital Marketing)."
              suggestions={INTEREST_SUGGESTIONS}
              onAdd={(value) =>
                patch({ interests: draft.interests.includes(value) ? draft.interests : [...draft.interests, value] })
              }
              onRemove={(value) =>
                patch({ interests: draft.interests.filter((item) => item !== value) })
              }
            />
          </div>
          <WizardFooter onBack={back} onNext={next} />
        </div>
      ) : null}

      {step === "location" ? (
        <div className={`${cardClass} max-w-[820px]`}>
          <h1 className="text-[28px] font-bold leading-9 text-[#171C26]">
            Where do you want to show your ad?
          </h1>
          <p className="mt-2 text-[14px] leading-5 text-[#707786]">
            Reach people in specific locations or within a radius of your business.
          </p>
          <div className="mt-6">
            <TagInput
              values={draft.locations}
              placeholder="Add a city, region, or country..."
              suggestions={CITY_SUGGESTIONS}
              onAdd={(value) =>
                patch({
                  locations: draft.locations.includes(value)
                    ? draft.locations
                    : [...draft.locations, value],
                })
              }
              onRemove={(value) =>
                patch({ locations: draft.locations.filter((item) => item !== value) })
              }
            />
          </div>
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold text-[#171C26]">
                Radius around selected locations.
              </p>
              <span className="h-7 px-2 rounded-full bg-[#00696F] text-white text-[12px] font-bold inline-flex items-center">
                {draft.radiusKm} km
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={draft.radiusKm}
              onChange={(event) => patch({ radiusKm: Number(event.target.value) })}
              className="w-full accent-[#00696F]"
            />
            <div className="flex justify-between text-[12px] text-[#707786]">
              <span>1 km</span>
              <span>100 km</span>
            </div>
          </div>
          <div className="mt-6 relative h-[260px] rounded-[14px] overflow-hidden border border-[#E5E7EB] bg-[#E8EEF4]">
            <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_30%_40%,rgba(0,105,111,0.28),transparent_28%),radial-gradient(circle_at_68%_48%,rgba(0,105,111,0.24),transparent_26%),linear-gradient(180deg,#d7e3ea,#c9d7e1)]" />
            <div className="absolute left-4 top-4 w-[220px] rounded-[12px] bg-white/95 shadow-sm p-3">
              <p className="text-[12px] font-bold text-[#171C26] mb-2">Boost Campaign Details</p>
              <dl className="text-[11px] leading-4 text-[#707786] flex flex-col gap-1">
                <div className="flex justify-between gap-2">
                  <dt>Goal</dt>
                  <dd className="text-[#171C26] font-medium">{goalLabel(draft)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Radius</dt>
                  <dd className="text-[#171C26] font-medium">{draft.radiusKm} km</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Audience</dt>
                  <dd className="text-[#171C26] font-medium">{audienceLabel(draft)}</dd>
                </div>
              </dl>
            </div>
            <div className="absolute left-4 right-4 bottom-4 rounded-[10px] bg-white/95 px-3 py-2">
              <p className="text-[12px] font-semibold text-[#171C26]">
                Estimated reach: 2.4M - 3.1M
              </p>
              <div className="mt-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#F59E0B] via-[#22C55E] to-[#EF4444]" />
            </div>
            <MapPin className="absolute left-[29%] top-[38%] size-6 text-[#00696F]" />
            <MapPin className="absolute left-[66%] top-[46%] size-6 text-[#00696F]" />
          </div>
          <WizardFooter onBack={back} onNext={next} />
        </div>
      ) : null}

      {step === "budget" ? (
        <div className={`${cardClass} max-w-[760px]`}>
          <div className="rounded-[12px] border border-[#E5E7EB] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Wallet className="size-5 text-[#00696F]" />
                <h2 className="text-[16px] font-bold text-[#171C26]">Daily Budget</h2>
              </div>
              <div className="h-10 rounded-[10px] border border-[#E5E7EB] px-3 flex items-center gap-2">
                <span className="text-[12px] text-[#707786]">INR (₹)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={draft.dailyBudget}
                  onChange={(event) => {
                    const digits = Number(event.target.value.replace(/\D/g, "").slice(0, 6));
                    patch({ dailyBudget: Math.min(10000, Math.max(200, digits || 200)) });
                  }}
                  className="w-16 text-right text-[14px] font-semibold text-[#171C26] focus:outline-none"
                />
              </div>
            </div>
            <input
              type="range"
              min={200}
              max={10000}
              step={50}
              value={draft.dailyBudget}
              onChange={(event) => patch({ dailyBudget: Number(event.target.value) })}
              className="mt-5 w-full accent-[#00696F]"
            />
            <div className="flex justify-between text-[12px] text-[#707786]">
              <span>₹200</span>
              <span>₹10,000+</span>
            </div>
            <div className="mt-4 rounded-[10px] bg-[#FFFBEB] px-3 py-2 text-[13px] text-[#92400E]">
              Higher budgets generally reach more people and learn faster.
            </div>
          </div>

          <div className="mt-4 rounded-[12px] border border-[#E5E7EB] p-5">
            <div className="flex items-center gap-2 mb-4">
              <FigmaIcon src="/figma/icons/clock.svg" alt="" width={16} height={16} />
              <h2 className="text-[16px] font-bold text-[#171C26]">Duration</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([3, 7, 14, "custom"] as DurationOption[]).map((option) => {
                const selected = draft.duration === option;
                const label = option === "custom" ? "Custom" : `${option} Days`;
                return (
                  <button
                    key={String(option)}
                    type="button"
                    onClick={() => patch({ duration: option })}
                    className={`h-12 rounded-[12px] border text-[14px] font-semibold ${
                      selected
                        ? "border-[#00696F] bg-[rgba(0,105,111,0.08)] text-[#00696F]"
                        : "border-[#E5E7EB] text-[#171C26]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {draft.duration === "custom" ? (
              <input
                type="number"
                min={1}
                max={90}
                value={draft.customDays}
                onChange={(event) => patch({ customDays: Number(event.target.value) || 1 })}
                className="mt-3 h-11 w-32 rounded-[10px] border border-[#E5E7EB] px-3 text-[14px]"
              />
            ) : null}
            <p className="mt-4 text-right text-[14px] font-bold text-[#171C26]">
              Total Budget: ₹{formatCount(budget)}
            </p>
          </div>

          <div className="mt-4 rounded-[12px] bg-[#EFF6FF] border border-[#DBEAFE] p-4 flex items-start gap-3">
            <Target className="size-5 text-[#2563EB] mt-0.5" />
            <div>
              <p className="text-[14px] font-bold text-[#171C26]">Estimated Audience Size</p>
              <p className="text-[16px] font-bold text-[#00696F]">1.2M - 3.5M people</p>
              <p className="text-[13px] text-[#707786]">
                Your audience selection is broad enough to be effective.
              </p>
            </div>
          </div>
          <WizardFooter onBack={back} onNext={next} />
        </div>
      ) : null}

      {step === "review" ? (
        <div className={`${cardClass} max-w-[760px]`}>
          <h1 className="text-[28px] font-bold leading-9 text-[#171C26]">Review & Pay</h1>
          <p className="mt-2 text-[14px] leading-5 text-[#707786]">
            Review your campaign details and complete the payment to start boosting your post.
          </p>

          <section className="mt-6">
            <h2 className="text-[14px] font-bold text-[#171C26] mb-3">Campaign Summary</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ["Goal", goalLabel(draft)],
                ["Audience", `${interestsLabel(draft).split(",")[0]} (${draft.ageMin}-${draft.ageMax})`],
                ["Location", locationLabel(draft)],
                ["Duration", `${days} Days (Ends ${endDateLabel(days)})`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[12px] border border-[#E5E7EB] p-4">
                  <p className="text-[12px] text-[#707786]">{label}</p>
                  <p className="mt-1 text-[14px] font-semibold text-[#171C26]">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="text-[14px] font-bold text-[#171C26] mb-3">Payment Details</h2>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[12px] text-[#707786]">Total Budget</p>
                <p className="text-[28px] font-bold text-[#171C26]">₹{formatCount(budget)}</p>
                <p className="text-[13px] text-[#707786]">
                  Estimated Daily: ₹{formatCount(draft.dailyBudget)}/day
                </p>
              </div>
              <div className="rounded-[12px] bg-[#EFF6FF] px-4 py-3 text-right">
                <p className="text-[12px] text-[#707786]">Estimated Reach</p>
                <p className="text-[14px] font-bold text-[#171C26]">{estimatedReach}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-[14px] text-[#171C26]">
                Wallet Balance: <span className="font-bold">₹{formatCount(walletBalance)}</span>
              </p>
              <Link href="/wallet" className="text-[13px] font-semibold text-[#00696F]">
                + Add Funds to Wallet
              </Link>
            </div>
            <div
              className={`mt-3 rounded-[10px] px-3 py-2.5 text-[13px] ${
                sufficient
                  ? "bg-[#EFF6FF] text-[#1D4ED8]"
                  : "bg-[#FEF2F2] text-[#B91C1C]"
              }`}
            >
              {sufficient
                ? "Your current balance is sufficient for this campaign. The amount will be deducted upon confirmation."
                : "Your wallet balance is not enough for this campaign. Add funds to continue."}
            </div>
          </section>

          <button
            type="button"
            disabled={!sufficient}
            onClick={() => {
              const ads = readAds();
              const copyNow = campaignCopy(draft);
              const campaign: AdCampaign = {
                id: draft.editingId || `ad-${Date.now()}`,
                title: copyNow.title,
                body: copyNow.body.replace(/#ChatTm #Productivity/, "Limited time offer. Shop now and grab the best deals!"),
                image: campaignImage(draft),
                status: "active",
                startDate: startDateLabel(),
                endDate: `${endDateLabel(days)} ${new Date().getFullYear()}`,
                goal: draft.goal,
                audienceLabel: audienceLabel(draft),
                locationLabel: locationLabel(draft),
                interestsLabel: interestsLabel(draft),
                metrics: {
                  likes: 0,
                  comments: 0,
                  shares: 0,
                  leads: 0,
                  reach: 0,
                  spend: 0,
                  impressions: 0,
                  ctr: 0,
                  cpc: 0,
                  frequency: 0,
                },
              };
              const nextAds = draft.editingId
                ? ads.map((ad) => (ad.id === draft.editingId ? { ...ad, ...campaign } : ad))
                : [campaign, ...ads];
              writeAds(nextAds);
              resetDraft();
              writeStep("goal");
              router.push("/ads");
            }}
            className="mt-6 w-full h-12 rounded-[12px] bg-[#00696F] text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#00585D] disabled:opacity-50"
          >
            <Rocket className="size-4" />
            Boost Post Now
          </button>
          <p className="mt-3 text-center text-[12px] text-[#707786]">
            By clicking &quot;Boost Post Now&quot;, you agree to Chattm&apos;s Advertising Policies.
          </p>
          <div className="mt-2">
            <button
              type="button"
              onClick={back}
              className="text-[14px] font-semibold text-[#171C26] inline-flex items-center gap-2"
            >
              <ArrowLeft className="size-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
