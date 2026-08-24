"use client";

import React, { useState } from "react";
import { Check, Copy, Mail, MessageCircle, MessagesSquare, Send, Trophy, UserPlus, Users } from "lucide-react";

const REFERRAL_CODE = "CHATTM123";
const REFERRAL_PATH = `/login?ref=${REFERRAL_CODE}`;

function referralLink() {
  return `${window.location.origin}${REFERRAL_PATH}`;
}

function shareMessage() {
  return `Join me on ChatTm and we both earn a wallet bonus! Use my code ${REFERRAL_CODE}: ${referralLink()}`;
}

const SHARE_CHANNELS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    color: "#16A34A",
    icon: MessageCircle,
  },
  {
    id: "messenger",
    label: "Messenger",
    color: "#2563EB",
    icon: MessagesSquare,
  },
  {
    id: "twitter",
    label: "Twitter",
    color: "#0EA5E9",
    icon: Send,
  },
  {
    id: "email",
    label: "Email",
    color: "#6B7280",
    icon: Mail,
  },
] as const;

function shareHref(id: (typeof SHARE_CHANNELS)[number]["id"]) {
  const url = referralLink();
  const text = shareMessage();
  if (id === "whatsapp") return `https://wa.me/?text=${encodeURIComponent(text)}`;
  if (id === "messenger") {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  }
  if (id === "twitter") return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  return `mailto:?subject=${encodeURIComponent("Join me on ChatTm")}&body=${encodeURIComponent(text)}`;
}

const STEPS = [
  {
    title: "1. Invite Friends",
    body: "Share your unique link or code with your network.",
    icon: UserPlus,
    iconClass: "text-[#2563EB]",
    ringClass: "bg-[#DBEAFE]",
  },
  {
    title: "2. They Sign Up",
    body: "Friends create a new account using your referral.",
    icon: Users,
    iconClass: "text-[#00696F]",
    ringClass: "bg-[rgba(0,105,111,0.12)]",
  },
  {
    title: "3. You Both Earn",
    body: "Get rewarded instantly once they complete their profile.",
    icon: Trophy,
    iconClass: "text-[#D97706]",
    ringClass: "bg-[#FEF3C7]",
  },
] as const;

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export default function ReferEarnPage() {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const markCopied = (kind: "code" | "link") => {
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const copyCode = async () => {
    if (await copyText(REFERRAL_CODE)) markCopied("code");
  };

  const shareLink = async () => {
    const url = referralLink();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ChatTm referral",
          text: shareMessage(),
          url,
        });
        return;
      } catch {
        // fall through to copy
      }
    }
    if (await copyText(url)) markCopied("link");
  };

  return (
    <div className="w-full max-w-[609px] mx-auto flex flex-col gap-6 pt-1 pb-12">
      <header>
        <h1 className="text-[32px] font-bold leading-10 tracking-[-0.32px] text-[#0B1C30]">
          Refer & Earn
        </h1>
        <p className="mt-1 text-[16px] leading-6 text-[#3C494A]">
          Invite friends and earn rewards together.
        </p>
      </header>

      <section className="rounded-[16px] bg-[#00696F] px-6 py-6 text-white shadow-[0px_8px_16px_rgba(0,105,111,0.18)]">
        <h2 className="text-[24px] font-bold leading-8">Invite friends, earn up to ₹500!</h2>
        <p className="mt-2 text-[16px] leading-6 text-white/90">
          Share the love. When a friend signs up using your link, you both get a bonus in your
          wallet.
        </p>
      </section>

      <section>
        <p className="text-[14px] font-semibold leading-5 tracking-[0.14px] text-[#0B1C30] mb-2">
          Your Referral Code
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0 h-11 rounded-[8px] border border-dashed border-[#C5DADC] bg-[#F3FAFA] px-4 flex items-center justify-between gap-3">
            <span className="text-[16px] font-bold tracking-[1px] text-[#00696F]">
              {REFERRAL_CODE}
            </span>
            <button
              type="button"
              onClick={copyCode}
              aria-label="Copy referral code"
              className="size-8 rounded-[8px] flex items-center justify-center text-[#00696F] hover:bg-white/80 transition-colors"
            >
              {copied === "code" ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={shareLink}
            className="h-11 px-6 rounded-[8px] bg-[#00696F] text-white text-[14px] font-semibold shrink-0 hover:bg-[#00585D] transition-colors"
          >
            {copied === "link" ? "Link Copied" : "Share Link"}
          </button>
        </div>
      </section>

      <section>
        <p className="text-[14px] font-semibold leading-5 tracking-[0.14px] text-[#0B1C30] mb-3">
          Share via
        </p>
        <div className="flex items-center gap-4">
          {SHARE_CHANNELS.map((channel) => {
            const Icon = channel.icon;
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => window.open(shareHref(channel.id), "_blank", "noopener,noreferrer")}
                className="flex-1 h-10 rounded-[8px] border border-[#E5E7EB] bg-white px-2 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold hover:bg-[#F9FAFB] transition-colors"
                style={{ color: channel.color }}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{channel.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[12px] bg-white border border-[#EEF2F6] shadow-[0px_1px_3px_rgba(15,23,42,0.05)] p-6">
        <h2 className="text-[16px] font-bold leading-6 text-[#0B1C30] mb-6">How it Works</h2>
        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="hidden sm:block absolute left-[16%] right-[16%] top-[22px] h-px border-t border-dashed border-[#D1D5DB]" />
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <span
                  className={`size-11 rounded-full ${step.ringClass} flex items-center justify-center relative z-10`}
                >
                  <Icon className={`size-5 ${step.iconClass}`} />
                </span>
                <p className="mt-3 text-[14px] font-bold leading-5 text-[#0B1C30]">{step.title}</p>
                <p className="mt-1 text-[13px] leading-5 text-[#707786]">{step.body}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
