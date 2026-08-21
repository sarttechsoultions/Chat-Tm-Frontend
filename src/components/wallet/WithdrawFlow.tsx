"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FigmaIcon from "../home/FigmaIcon";
import {
  formatInr,
  markCreated,
  prependTx,
  readBalance,
  readLinkedAccounts,
  readWithdrawAmount,
  readWithdrawDest,
  writeBalance,
  writeWithdrawAmount,
  writeWithdrawDest,
  type LinkedAccount,
} from "./walletStorage";

export type WithdrawStep = "amount" | "destination" | "processing";

const QUICK_AMOUNTS = [500, 1000, 2000];

const DESTINATIONS = [
  {
    id: "chase",
    title: "Chase Checking",
    subtitle: "**** 4321",
    icon: "/figma/icons/wallet-card.png",
    object: "object-bottom",
  },
  {
    id: "boa",
    title: "Bank of America Savings",
    subtitle: "**** 9876",
    icon: "/figma/icons/wallet-card.png",
    object: "object-bottom",
  },
  {
    id: "upi",
    title: "UPI ID",
    subtitle: "rahulsharma@okicici",
    icon: "/figma/icons/wallet-upi.png",
    object: "object-top",
  },
] as const;

function TintedIcon({
  src,
  color,
  width,
  height,
  className = "",
}: {
  src: string;
  color: string;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex overflow-clip shrink-0 ${className}`}
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

function AmountScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState(0);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    markCreated();
    setBalance(readBalance());
    setAmount(readWithdrawAmount());
  }, []);

  const canContinue = amount > 0 && amount <= balance;
  const display = amount === 0 ? "0" : amount.toLocaleString("en-IN");

  return (
    <div className="relative w-full min-h-full">
      <BackLink href="/wallet" />

      <div className="flex justify-center pt-10 pb-16 px-4">
        <form
          className="w-full max-w-[480px] bg-white rounded-[16px] shadow-[0px_8px_24px_rgba(15,23,42,0.08)] p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canContinue) return;
            writeWithdrawAmount(amount);
            router.push("/wallet/withdraw/destination");
          }}
        >
          <h1 className="text-[24px] font-bold leading-8 text-[#0B1C30]">Withdraw Money</h1>
          <p className="mt-2 mb-6 text-[14px] leading-5 text-[#6B7280]">
            Step 1 of 2: Enter the amount you wish to withdraw to your linked bank account.
          </p>

          <label className="block text-[12px] font-semibold tracking-[0.6px] uppercase text-[#6B7280] mb-2">
            Amount
          </label>
          <div className="rounded-[16px] bg-[#F3F4F6] p-3">
            <div className="h-16 rounded-[12px] bg-white border border-[#E5E7EB] flex items-center px-4 gap-2">
              <span className="text-[28px] font-bold text-[#0B1C30]">₹</span>
              <input
                type="text"
                inputMode="numeric"
                value={display}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "").slice(0, 7);
                  setAmount(digits ? Number(digits) : 0);
                }}
                className="flex-1 bg-transparent text-[28px] font-bold text-[#0B1C30] focus:outline-none"
                aria-label="Withdraw amount"
              />
            </div>
            <div className="mt-3 flex items-center justify-between px-1">
              <p className="text-[13px] leading-5 text-[#6B7280]">
                Available Balance: ₹{formatInr(balance)}
              </p>
              <button
                type="button"
                onClick={() => setAmount(Math.floor(balance))}
                className="text-[13px] font-semibold text-[#00696F] hover:underline"
              >
                use max
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {QUICK_AMOUNTS.map((value) => {
              const selected = amount === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmount(value)}
                  className={`flex-1 h-10 rounded-[10px] text-[13px] font-semibold border transition-colors ${
                    selected
                      ? "bg-[rgba(0,105,111,0.12)] border-[#00696F] text-[#00696F]"
                      : "bg-white border-[#E5E7EB] text-[#0B1C30] hover:bg-[#F9FAFB]"
                  }`}
                >
                  ₹{value.toLocaleString("en-IN")}
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-[12px] bg-[rgba(0,105,111,0.08)] border border-[rgba(0,105,111,0.28)] px-3 py-3 flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0">
              <FigmaIcon src="/figma/icons/clock.svg" alt="" width={14} height={14} />
            </span>
            <p className="text-[12px] leading-[18px] text-[#0B1C30]">
              Standard Processing Time: 2-3 Business Days. (Sat & Sun is not included). In case of
              a holiday it will be added to your balance next working day.
            </p>
          </div>

          <button
            type="submit"
            disabled={!canContinue}
            className="mt-6 w-full h-14 rounded-[12px] bg-[#00696F] text-white text-[14px] font-semibold tracking-[0.14px] flex items-center justify-center gap-2 hover:bg-[#00585D] disabled:opacity-50 disabled:hover:bg-[#00696F] transition-colors"
          >
            Next
            <TintedIcon src="/figma/icons/arrow.svg" color="#FFFFFF" width={8} height={12} />
          </button>
        </form>
      </div>
    </div>
  );
}

function DestinationScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState(0);
  const [dest, setDest] = useState("chase");
  const [destinations, setDestinations] = useState<LinkedAccount[]>([...DESTINATIONS]);

  useEffect(() => {
    const stored = readWithdrawAmount();
    if (stored <= 0) {
      router.replace("/wallet/withdraw");
      return;
    }
    setAmount(stored);
    const linked = readLinkedAccounts();
    const merged = [...linked, ...DESTINATIONS.filter((item) => !linked.some((acc) => acc.id === item.id))];
    setDestinations(merged);
    const saved = readWithdrawDest();
    setDest(merged.some((item) => item.id === saved) ? saved : merged[0]?.id ?? "chase");
  }, [router]);

  const selected = destinations.find((item) => item.id === dest) ?? destinations[0];

  return (
    <div className="relative w-full min-h-full">
      <BackLink href="/wallet/withdraw" />

      <div className="flex justify-center pt-10 pb-16 px-4">
        <form
          className="w-full max-w-[480px] bg-white rounded-[16px] shadow-[0px_8px_24px_rgba(15,23,42,0.08)] p-6"
          onSubmit={(event) => {
            event.preventDefault();
            writeWithdrawDest(dest);
            router.push("/wallet/withdraw/processing");
          }}
        >
          <h1 className="text-[24px] font-bold leading-8 text-[#0B1C30]">Select Destination</h1>
          <p className="mt-2 mb-5 text-[14px] leading-5 text-[#6B7280]">
            Where should we send your funds?
          </p>

          <div className="rounded-[12px] bg-[#E8F4F8] px-4 py-3 flex items-center justify-between gap-3 mb-5">
            <p className="text-[13px] leading-5 text-[#0B1C30]">
              Available to withdraw:{" "}
              <span className="font-bold">₹{formatInr(amount)}</span>
            </p>
            <Link
              href="/wallet/withdraw"
              className="text-[13px] font-semibold text-[#00696F] shrink-0 hover:underline"
            >
              Edit Amount
            </Link>
          </div>

          <ul className="flex flex-col gap-3">
            {destinations.map((item) => {
              const isSelected = dest === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setDest(item.id)}
                    className={`w-full flex items-center gap-3 rounded-[12px] border px-3 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-[#00696F] bg-[rgba(0,105,111,0.04)]"
                        : "border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <span className="size-10 rounded-full bg-[#E8F4F8] overflow-clip flex items-center justify-center shrink-0">
                      <img
                        src={item.icon}
                        alt=""
                        width={28}
                        height={28}
                        className={`size-7 ${item.object} object-cover`}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold leading-5 text-[#0B1C30]">
                        {item.title}
                      </span>
                      <span className="block text-[12px] leading-4 text-[#6B7280]">
                        {item.subtitle}
                      </span>
                    </span>
                    <span
                      className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? "border-[#00696F]" : "border-[#D1D5DB]"
                      }`}
                    >
                      {isSelected ? <span className="size-2.5 rounded-full bg-[#00696F]" /> : null}
                    </span>
                  </button>
                </li>
              );
            })}

            <li>
              <Link
                href="/wallet/bank"
                className="w-full flex items-center gap-3 rounded-[12px] border border-dashed border-[#C5DADC] px-3 py-3 text-left hover:bg-[#F9FAFB] transition-colors"
              >
                <span className="size-10 rounded-full bg-[rgba(0,105,111,0.12)] overflow-clip flex items-center justify-center shrink-0">
                  <FigmaIcon src="/figma/icons/attach-plus.svg" alt="" width={20} height={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold leading-5 text-[#0B1C30]">
                    Add New Account
                  </span>
                  <span className="block text-[12px] leading-4 text-[#6B7280]">
                    Link bank account or wallet
                  </span>
                </span>
              </Link>
            </li>
          </ul>

          <div className="mt-5 rounded-[12px] bg-[#FEF9C3] border border-[#FDE68A] px-3 py-3 flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0">
              <TintedIcon src="/figma/icons/friends-lock.svg" color="#A16207" width={14} height={12} />
            </span>
            <p className="text-[12px] leading-[18px] text-[#0B1C30]">
              Security: Your information is encrypted and secure. We do not share your banking
              information with anyone.
            </p>
          </div>

          <button
            type="submit"
            className="mt-6 w-full h-14 rounded-[12px] bg-[#00696F] text-white text-[14px] font-semibold tracking-[0.14px] hover:bg-[#00585D] transition-colors"
          >
            Proceed to Withdraw
          </button>
          <p className="sr-only">
            Sending ₹{formatInr(amount)} to {selected?.title}
          </p>
        </form>
      </div>
    </div>
  );
}

function formatClock() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function ProcessingScreen() {
  const router = useRouter();
  const ran = useRef(false);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const amount = readWithdrawAmount();
    if (amount <= 0) {
      router.replace("/wallet/withdraw");
      return;
    }

    const start = Date.now();
    const duration = 2500;
    const tick = window.setInterval(() => {
      const ratio = Math.min(1, (Date.now() - start) / duration);
      setProgress(8 + Math.round(ratio * 92));
    }, 50);

    const done = window.setTimeout(() => {
      if (ran.current) return;
      ran.current = true;
      const destId = readWithdrawDest();
      const dest =
        [...readLinkedAccounts(), ...DESTINATIONS].find((item) => item.id === destId) ?? DESTINATIONS[0];
      writeBalance(Math.max(0, readBalance() - amount));
      prependTx({
        id: `wd-${Date.now()}`,
        name: dest.title,
        detail: `${dest.subtitle} • Money Withdrawn`,
        amount: -amount,
        time: `Today, ${formatClock()}`,
        icon: dest.icon,
      });
      writeWithdrawAmount(0);
      router.replace("/wallet");
    }, duration);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(done);
    };
  }, [router]);

  return (
    <div className="relative w-full min-h-full">
      <div className="flex justify-center pt-16 pb-16 px-4">
        <div className="w-full max-w-[420px] bg-white rounded-[16px] shadow-[0px_8px_24px_rgba(15,23,42,0.08)] px-6 pt-10 pb-8 flex flex-col items-center">
          <div className="size-20 rounded-full bg-[#00696F] flex items-center justify-center mb-5 overflow-clip">
            <img
              src="/figma/icons/wallet-card.png"
              alt=""
              width={40}
              height={40}
              className="size-10 object-cover object-bottom"
            />
          </div>

          <h1 className="text-[22px] font-bold leading-8 text-[#0B1C30] text-center">
            Processing Withdrawal
          </h1>
          <p className="mt-2 text-[14px] leading-5 text-[#6B7280] text-center">
            Please wait while we transfer funds to your bank account.
          </p>

          <div className="mt-6 w-full h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#00696F] transition-[width] duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-4 text-[12px] leading-4 text-[#9CA3AF] text-center">
            This may take a few seconds.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WithdrawFlow({ step }: { step: WithdrawStep }) {
  if (step === "destination") return <DestinationScreen />;
  if (step === "processing") return <ProcessingScreen />;
  return <AmountScreen />;
}
