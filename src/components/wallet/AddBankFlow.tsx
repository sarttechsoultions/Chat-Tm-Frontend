"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AtSign, Check, CircleCheck, Eye, EyeOff, Landmark, Link2, Lock, ShieldCheck } from "lucide-react";
import FigmaIcon from "../home/FigmaIcon";
import {
  addLinkedAccount,
  clearBankDraft,
  readBankDraft,
  writeBankDraft,
  writeWithdrawDest,
  type BankDraft,
} from "./walletStorage";

export type AddBankStep = "select" | "details" | "verifying" | "success";

const BANKS = [
  { id: "sbi", name: "SBI", fullName: "State Bank of India", mark: "/figma/icons/bank-sbi.png", ifsc: "SBIN0002103" },
  { id: "hdfc", name: "HDFC Bank", fullName: "HDFC Bank", mark: "/figma/icons/bank-hdfc.png", ifsc: "HDFC0001234" },
  { id: "icici", name: "ICICI Bank", fullName: "ICICI Bank", mark: "/figma/icons/bank-icici.png", ifsc: "ICIC0001234" },
  { id: "axis", name: "Axis Bank", fullName: "Axis Bank", mark: "/figma/icons/bank-axis.png", ifsc: "UTIB0001234" },
  { id: "kotak", name: "Kotak", fullName: "Kotak Mahindra Bank", mark: "/figma/icons/bank-kotak.png", ifsc: "KKBK0001234" },
  { id: "pnb", name: "PNB", fullName: "Punjab National Bank", mark: "/figma/icons/bank-pnb.png", ifsc: "PUNB0123400" },
] as const;

const POPULAR_IDS = ["sbi", "hdfc", "icici"] as const;

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

function BackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="Go back"
      className="absolute left-0 top-2.5 z-10 size-10 rounded-full flex items-center justify-center hover:bg-[#EFF4FF] transition-colors"
    >
      <FigmaIcon src="/figma/icons/back-arrow.svg" alt="" width={16} height={16} />
    </Link>
  );
}

function BankMark({ src, alt, size = 48 }: { src: string; alt: string; size?: number }) {
  return (
    <span className="inline-flex overflow-clip shrink-0 rounded-full" style={{ width: size, height: size }}>
      <img src={src} alt={alt} width={size} height={size} className="size-full object-contain" />
    </span>
  );
}

function lastFour(accountNumber: string) {
  const digits = accountNumber.replace(/\D/g, "");
  return digits.slice(-4).padStart(4, "0");
}

function SelectBankScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"bank" | "upi">("bank");
  const [query, setQuery] = useState("");
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    const draft = readBankDraft();
    setTab(draft.tab);
    setUpiId(draft.upiId);
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return BANKS;
    return BANKS.filter(
      (bank) =>
        bank.name.toLowerCase().includes(term) ||
        bank.fullName.toLowerCase().includes(term),
    );
  }, [query]);

  const searching = query.trim().length > 0;
  const popular = BANKS.filter((bank) => POPULAR_IDS.includes(bank.id as (typeof POPULAR_IDS)[number]));
  const visibleBanks = searching ? filtered : popular;
  const canLinkUpi = /@/.test(upiId.trim()) && upiId.trim().length > 5;

  const chooseBank = (bankId: string) => {
    const bank = BANKS.find((item) => item.id === bankId);
    if (!bank) return;
    writeBankDraft({
      tab: "bank",
      bankId: bank.id,
      bankName: bank.fullName,
      ifsc: "",
    });
    router.push("/wallet/bank/details");
  };

  return (
    <div className="w-full max-w-[760px] mx-auto min-h-full pb-8">
      <Link
        href="/wallet/withdraw/destination"
        aria-label="Go back"
        className="size-10 rounded-full flex items-center justify-center hover:bg-[#EFF4FF] transition-colors -ml-2 mb-1"
      >
        <FigmaIcon src="/figma/icons/back-arrow.svg" alt="" width={16} height={16} />
      </Link>
      <h1 className="text-[24px] font-bold leading-8 text-[#0B1C30]">
        {tab === "upi" ? "Link UPI ID" : "Add Bank Account"}
      </h1>
      <p className="mt-1 mb-5 text-[14px] leading-5 text-[#6B7280]">Step 1 of 3: Select your bank</p>

      <div className="w-full min-h-[calc(100vh-200px)] bg-white rounded-[16px] shadow-[0px_8px_24px_rgba(15,23,42,0.08)] px-6 pt-2 pb-16 flex flex-col">
        <div className="grid grid-cols-2 border-b border-[#E5E7EB] mb-5">
          {(["bank", "upi"] as const).map((value) => {
            const active = tab === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setTab(value);
                  writeBankDraft({ tab: value });
                }}
                className={`h-12 text-[15px] font-semibold leading-5 text-center ${
                  active ? "text-[#00696F] border-b-2 border-[#00696F]" : "text-[#6B7280]"
                }`}
              >
                {value === "bank" ? "Bank Account" : "UPI ID"}
              </button>
            );
          })}
        </div>

        {tab === "bank" ? (
          <div className="flex flex-col">
            <label className="w-full h-12 rounded-[12px] bg-[#F3F4F6] border border-[#E5E7EB] flex items-center gap-2.5 px-3.5">
              <FigmaIcon src="/figma/icons/search-sm.svg" alt="" width={14} height={14} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search bank name"
                className="flex-1 bg-transparent text-[14px] leading-5 text-[#0B1C30] placeholder:text-[#9CA3AF] focus:outline-none"
              />
            </label>

            <p className="mt-6 mb-4 text-[11px] font-bold tracking-[0.8px] uppercase text-[#6B7280]">
              Popular Banks
            </p>
            {visibleBanks.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-4">
                {visibleBanks.map((bank) => (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => chooseBank(bank.id)}
                    className="w-[168px] h-[148px] rounded-[16px] bg-[#F3F6F8] border border-[#E8EEF2] px-3 py-4 flex flex-col items-center justify-center gap-3 hover:ring-1 hover:ring-[#00696F] transition-[box-shadow]"
                  >
                    <BankMark src={bank.mark} alt="" size={56} />
                    <span className="text-[14px] font-semibold leading-5 text-[#0B1C30] text-center">
                      {bank.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[14px] leading-5 text-[#6B7280] text-center">No banks match “{query}”.</p>
            )}
          </div>
        ) : (
            <form
              className="flex flex-col"
              onSubmit={(event) => {
                event.preventDefault();
                if (!canLinkUpi) return;
                const value = upiId.trim().toLowerCase();
                writeBankDraft({
                  tab: "upi",
                  upiId: value,
                  bankId: "upi",
                  bankName: "UPI ID",
                  accountNumber: value,
                });
                router.push("/wallet/bank/verifying");
              }}
            >
              <label htmlFor="upi-vpa" className="text-[13px] font-semibold leading-5 text-[#0B1C30] mb-2">
                Enter UPI ID (VPA)
              </label>
              <div className="w-full h-12 rounded-[12px] bg-[#F3F4F6] border border-[#E5E7EB] flex items-center gap-2.5 px-3.5 focus-within:border-[#00696F] focus-within:ring-1 focus-within:ring-[#00696F]">
                <AtSign size={16} className="text-[#9CA3AF] shrink-0" />
                <input
                  id="upi-vpa"
                  type="text"
                  autoComplete="off"
                  value={upiId}
                  onChange={(event) => setUpiId(event.target.value)}
                  placeholder="username@bank"
                  className="flex-1 bg-transparent text-[14px] leading-5 text-[#0B1C30] placeholder:text-[#9CA3AF] focus:outline-none"
                />
              </div>
              <p className="mt-2 text-[12px] leading-4 text-[#9CA3AF]">
                Must be linked to your registered mobile number.
              </p>

              <div className="mt-5 rounded-[12px] bg-[#EEF4FF] border border-[#D3E4FE] px-4 py-3.5 flex items-start gap-3">
                <span className="size-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5">
                  <Lock size={14} className="text-[#00696F]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-5 text-[#0B1C30]">Secure Connection</p>
                  <p className="mt-0.5 text-[12px] leading-[18px] text-[#6B7280]">
                    Your payment details are encrypted with bank-grade security and never shared with third
                    parties.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canLinkUpi}
                className="mt-6 w-full h-12 rounded-[12px] bg-[#00696F] text-white text-[14px] font-semibold tracking-[0.14px] flex items-center justify-center gap-2 hover:bg-[#00585D] disabled:opacity-50 disabled:hover:bg-[#00696F] transition-colors"
              >
                Verify & Link
                <CircleCheck size={18} strokeWidth={2.25} />
              </button>
            </form>
          )}
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  extra,
  children,
}: {
  label: string;
  htmlFor?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={htmlFor} className="text-[13px] font-semibold leading-5 text-[#0B1C30]">
          {label}
        </label>
        {extra}
      </div>
      {children}
    </div>
  );
}

function inputClassName(invalid?: boolean) {
  return `w-full h-12 rounded-[12px] bg-white border px-3.5 text-[14px] leading-5 text-[#0B1C30] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 ${
    invalid
      ? "border-[#F87171] focus:border-[#DC2626] focus:ring-[#FECACA]"
      : "border-[#D1D5DB] focus:border-[#00696F] focus:ring-[#00696F]"
  }`;
}

function DetailsStepper() {
  return (
    <div className="relative w-full h-8" aria-hidden>
      <div className="absolute top-1/2 left-2 right-2 h-[3px] -translate-y-1/2 flex">
        <span className="flex-1 rounded-full bg-[#00696F]" />
        <span className="flex-1 rounded-full bg-[#D6E4FF]" />
      </div>
      <div className="relative z-10 flex items-center justify-between h-8">
        <span className="size-4 rounded-full bg-[#00696F] text-white text-[9px] font-bold leading-none flex items-center justify-center">
          1
        </span>
        <span className="size-8 rounded-full bg-[#C5EBE8] flex items-center justify-center">
          <span className="size-5 rounded-full bg-[#00696F] text-white text-[11px] font-bold leading-none flex items-center justify-center">
            2
          </span>
        </span>
        <span className="size-4 rounded-full bg-[#D6E4FF] text-[#8B9BB8] text-[9px] font-bold leading-none flex items-center justify-center">
          3
        </span>
      </div>
    </div>
  );
}

function DetailsScreen() {
  const router = useRouter();
  const [draft, setDraft] = useState<BankDraft | null>(null);
  const [confirmNumber, setConfirmNumber] = useState("");
  const [showAccount, setShowAccount] = useState(false);

  useEffect(() => {
    const stored = readBankDraft();
    if (!stored.bankId || stored.tab === "upi") {
      router.replace("/wallet/bank");
      return;
    }
    setDraft(stored);
    setConfirmNumber("");
  }, [router]);

  if (!draft) return null;

  const bank = BANKS.find((item) => item.id === draft.bankId);
  const accountDigits = draft.accountNumber.replace(/\D/g, "");
  const confirmDigits = confirmNumber.replace(/\D/g, "");
  const confirmMismatch = confirmDigits.length > 0 && confirmDigits !== accountDigits;
  const canSubmit =
    draft.holderName.trim().length > 1 &&
    accountDigits.length >= 8 &&
    confirmDigits === accountDigits &&
    draft.ifsc.replace(/\s/g, "").length >= 11;

  const update = (patch: Partial<BankDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    writeBankDraft(patch);
  };

  return (
    <div className="relative w-full min-h-full">
      <div className="flex justify-center pt-6 pb-16 px-4">
        <form
          className="relative w-full max-w-[420px] bg-white rounded-[16px] shadow-[0px_8px_24px_rgba(15,23,42,0.08)] px-6 pt-5 pb-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) return;
            const account = {
              id: `bank-${Date.now()}`,
              title: draft.bankName || bank?.fullName || "Bank Account",
              subtitle: `**** ${lastFour(accountDigits)}`,
              icon: "/figma/icons/wallet-card.png",
              object: "object-bottom" as const,
            };
            addLinkedAccount(account);
            writeWithdrawDest(account.id);
            writeBankDraft({ accountNumber: accountDigits });
            router.push("/wallet/bank/success");
          }}
        >
          <Link
            href="/wallet/bank"
            aria-label="Go back"
            className="absolute left-3 top-3.5 z-10 size-10 rounded-full flex items-center justify-center hover:bg-[#EFF4FF] transition-colors"
          >
            <FigmaIcon src="/figma/icons/back-arrow.svg" alt="" width={16} height={16} />
          </Link>

          <div className="flex flex-col items-center pt-6">
            <span className="size-12 rounded-full overflow-clip shrink-0 mb-3">
              <img
                src="/figma/icons/bank-landmark.png"
                alt=""
                width={48}
                height={48}
                className="size-full object-contain"
              />
            </span>
            <h1 className="text-[24px] font-bold leading-8 text-[#0B1C30] text-center">
              Account Details
            </h1>
            <p className="mt-1.5 text-[14px] leading-5 text-[#6B7280] text-center">
              Step 2 of 3: Enter your bank account info
            </p>
          </div>

          <div className="mt-5 mb-6">
            <DetailsStepper />
          </div>

          <div className="flex flex-col gap-5">
            <Field label="Account Number" htmlFor="account-number">
              <div className="relative">
                <input
                  id="account-number"
                  type={showAccount ? "text" : "password"}
                  inputMode="numeric"
                  autoComplete="off"
                  value={draft.accountNumber}
                  onChange={(event) =>
                    update({ accountNumber: event.target.value.replace(/\D/g, "").slice(0, 18) })
                  }
                  placeholder="Enter account number"
                  className={`${inputClassName()} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowAccount((value) => !value)}
                  aria-label={showAccount ? "Hide account number" : "Show account number"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 size-6 flex items-center justify-center text-[#6B7280] hover:text-[#0B1C30]"
                >
                  {showAccount ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </Field>

            <Field label="Confirm Account Number" htmlFor="confirm-account-number">
              <input
                id="confirm-account-number"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={confirmNumber}
                onChange={(event) => setConfirmNumber(event.target.value.replace(/\D/g, "").slice(0, 18))}
                placeholder="Re-enter account number"
                className={inputClassName(confirmMismatch)}
              />
              {confirmMismatch ? (
                <p className="mt-1.5 text-[12px] leading-4 text-[#DC2626]">Account numbers do not match.</p>
              ) : null}
            </Field>

            <Field
              label="IFSC Code"
              htmlFor="ifsc-code"
              extra={
                <button
                  type="button"
                  onClick={() => update({ ifsc: bank?.ifsc ?? "SBIN0001234" })}
                  className="text-[13px] font-semibold leading-5 text-[#00696F] hover:underline"
                >
                  Find IFSC
                </button>
              }
            >
              <input
                id="ifsc-code"
                type="text"
                autoComplete="off"
                value={draft.ifsc}
                onChange={(event) =>
                  update({ ifsc: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11) })
                }
                placeholder="E.G. SBIN0001234"
                className={inputClassName()}
              />
            </Field>

            <Field label="Account Holder Name" htmlFor="account-holder-name">
              <input
                id="account-holder-name"
                type="text"
                autoComplete="name"
                value={draft.holderName}
                onChange={(event) => update({ holderName: event.target.value })}
                placeholder="As per bank records"
                className={inputClassName()}
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-6 w-full h-12 rounded-[12px] bg-[#00696F] text-white text-[14px] font-semibold tracking-[0.14px] flex items-center justify-center gap-2 hover:bg-[#00585D] disabled:opacity-50 disabled:hover:bg-[#00696F] transition-colors"
          >
            Link Account
            <TintedIcon src="/figma/icons/arrow.svg" color="#FFFFFF" width={8} height={12} />
          </button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[12px] leading-4 text-[#9CA3AF]">
            <Lock size={12} strokeWidth={2.25} className="text-[#9CA3AF]" />
            Your information is securely encrypted
          </p>
        </form>
      </div>
    </div>
  );
}

function VerifyingUpiScreen() {
  const router = useRouter();
  const ran = useRef(false);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const stored = readBankDraft();
    if (!stored.upiId || stored.tab !== "upi") {
      router.replace("/wallet/bank");
      return;
    }

    const start = Date.now();
    const duration = 2200;
    const tick = window.setInterval(() => {
      const ratio = Math.min(1, (Date.now() - start) / duration);
      setProgress(12 + Math.round(ratio * 88));
    }, 50);

    const done = window.setTimeout(() => {
      if (ran.current) return;
      ran.current = true;
      const value = stored.upiId.trim().toLowerCase();
      const account = {
        id: `upi-${Date.now()}`,
        title: "UPI ID",
        subtitle: value,
        icon: "/figma/icons/wallet-upi.png",
        object: "object-top" as const,
      };
      addLinkedAccount(account);
      writeWithdrawDest(account.id);
      router.replace("/wallet/bank/success");
    }, duration);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(done);
    };
  }, [router]);

  return (
    <div className="relative w-full min-h-full">
      <BackLink href="/wallet/bank" />
      <div className="flex justify-center pt-16 pb-16 px-4">
        <div className="w-full max-w-[448px] min-h-[406px] bg-white/80 border border-[#D3E4FE] rounded-[12px] px-8 py-10 flex flex-col items-center justify-center">
          <div className="size-20 rounded-full bg-[#E8F4F8] flex items-center justify-center mb-5">
            <ShieldCheck size={40} color="#00696F" strokeWidth={1.75} />
          </div>
          <h1 className="text-[22px] font-bold leading-8 text-[#0B1C30] text-center">Verifying UPI ID...</h1>
          <p className="mt-2 text-[14px] leading-5 text-[#6B7280] text-center max-w-[320px]">
            Please wait while we securely validate your banking details.
          </p>
          <div className="mt-8 w-full h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#00696F] transition-[width] duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessScreen() {
  const [draft, setDraft] = useState<BankDraft | null>(null);

  useEffect(() => {
    setDraft(readBankDraft());
  }, []);

  if (!draft) return null;

  if (draft.tab === "upi") {
    const upiId = draft.upiId || draft.accountNumber;
    return (
      <div className="relative w-full min-h-full">
        <BackLink href="/wallet/bank" />
        <div className="flex justify-center pt-16 pb-16 px-4">
          <div className="w-full max-w-[420px] bg-white rounded-[12px] border border-[#D3E4FE] shadow-[0px_8px_24px_rgba(15,23,42,0.08)] px-6 pt-8 pb-6 flex flex-col items-center">
            <div className="size-[88px] rounded-full bg-[#D7F0F0] flex items-center justify-center mb-4">
              <span className="size-16 rounded-full bg-[#00696F] flex items-center justify-center">
                <Check size={32} color="#FFFFFF" strokeWidth={2.75} />
              </span>
            </div>
            <h1 className="text-[20px] font-bold leading-7 text-[#0B1C30] text-center">
              UPI ID Linked Successfully!
            </h1>
            <p className="mt-3 text-[14px] leading-5 text-[#6B7280] text-center">
              Your new UPI ID is ready to use for seamless, secure transactions across the network.
            </p>

            <div className="mt-5 w-full rounded-[12px] border border-dashed border-[#D1D5DB] px-4 py-3.5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-[#9CA3AF]">
                  Account Linked
                </span>
                <Landmark size={16} className="text-[#9CA3AF]" />
              </div>
              <p className="text-[12px] leading-4 text-[#6B7280] mb-1">UPI ID</p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[14px] font-medium leading-5 text-[#0B1C30] truncate">{upiId}</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#D7F0F0] text-[#00696F] text-[11px] font-semibold leading-4 px-2 py-1 shrink-0">
                  <Check size={10} strokeWidth={3} />
                  Verified
                </span>
              </div>
            </div>

            <Link
              href="/wallet"
              onClick={() => clearBankDraft()}
              className="mt-6 w-full h-12 rounded-[12px] bg-[#00696F] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#00585D] transition-colors"
            >
              Go to Wallet Dashboard
              <TintedIcon src="/figma/icons/arrow.svg" color="#FFFFFF" width={8} height={12} />
            </Link>
            <Link
              href="/wallet/bank"
              onClick={() => clearBankDraft()}
              className="mt-2 w-full h-12 rounded-[12px] border border-[#0B1C30] text-[#0B1C30] text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#F9FAFB] transition-colors"
            >
              <Link2 size={16} strokeWidth={2.25} />
              Link Another Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const bank = BANKS.find((item) => item.id === draft.bankId);
  const masked = `**** **** ${lastFour(draft.accountNumber)}`;
  const title = bank?.fullName || draft.bankName || "Bank Account";

  return (
    <div className="relative w-full min-h-full">
      <BackLink href="/wallet/bank" />

      <div className="flex justify-center pt-16 pb-16 px-4">
        <div className="w-full max-w-[420px] bg-white rounded-[16px] shadow-[0px_8px_24px_rgba(15,23,42,0.08)] px-6 pt-8 pb-6 flex flex-col items-center">
          <div className="size-16 rounded-full bg-[rgba(0,105,111,0.18)] flex items-center justify-center mb-4">
            <FigmaIcon src="/figma/icons/wallet-success-check.svg" alt="" width={40} height={40} />
          </div>

          <h1 className="text-[20px] font-bold leading-7 text-[#0B1C30] text-center">
            Bank Account Linked Successfully!
          </h1>
          <p className="mt-3 text-[14px] leading-5 text-[#6B7280] text-center">
            Your {title} account {masked} has been added to your wallet successfully.
          </p>

          <div className="mt-5 w-full rounded-[12px] border border-[#E5E7EB] px-4 py-3 flex items-center gap-3">
            <BankMark src={bank?.mark ?? "/figma/icons/bank-hdfc.png"} alt="" size={40} />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold leading-5 text-[#0B1C30] truncate">{title}</p>
              <p className="text-[12px] leading-4 text-[#6B7280]">{masked}</p>
            </div>
            <span className="text-[11px] font-semibold leading-4 text-[#15803D] bg-[#DCFCE7] rounded-full px-2 py-1 shrink-0">
              Verified
            </span>
          </div>

          <Link
            href="/wallet"
            onClick={() => clearBankDraft()}
            className="mt-6 w-full h-12 rounded-[12px] bg-[#00696F] text-white text-[14px] font-semibold flex items-center justify-center hover:bg-[#00585D] transition-colors"
          >
            Go to Wallet Dashboard
          </Link>
          <Link
            href="/wallet/bank"
            onClick={() => clearBankDraft()}
            className="mt-2 w-full h-12 rounded-[12px] border border-[#00696F] text-[#00696F] text-[14px] font-semibold flex items-center justify-center hover:bg-[rgba(0,105,111,0.06)] transition-colors"
          >
            Add Another Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AddBankFlow({ step }: { step: AddBankStep }) {
  if (step === "details") return <DetailsScreen />;
  if (step === "verifying") return <VerifyingUpiScreen />;
  if (step === "success") return <SuccessScreen />;
  return <SelectBankScreen />;
}
