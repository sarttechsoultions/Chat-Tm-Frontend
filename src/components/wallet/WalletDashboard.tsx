"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FigmaIcon from "../home/FigmaIcon";
import {
  formatInr,
  markCreated,
  readAmount,
  readBalance,
  readExtraTxs,
  writeAmount,
  writeBalance,
  type WalletTx,
} from "./walletStorage";

export type DashboardStep = "dashboard" | "add" | "payment" | "added";

const QUICK_AMOUNTS = [500, 1000, 2000];

const PAYMENT_METHODS = [
  {
    id: "upi",
    title: "UPI",
    subtitle: "Pay using any UPI app",
    icon: "/figma/icons/wallet-upi.png",
    object: "object-top",
  },
  {
    id: "card",
    title: "Debit / Credit Card",
    subtitle: "Visa, Mastercard, RuPay",
    icon: "/figma/icons/wallet-card.png",
    object: "object-top",
  },
  {
    id: "netbanking",
    title: "Net Banking",
    subtitle: "All major banks",
    icon: "/figma/icons/wallet-card.png",
    object: "object-bottom",
  },
] as const;

const BASE_TRANSACTIONS = [
  {
    id: "amit",
    name: "Amit Sharma",
    detail: "@amitsharma • Money Sent",
    amount: -750,
    time: "Today, 10:30 AM",
    avatar: "/figma/photos/contact-2.png",
  },
  {
    id: "priya",
    name: "Priya Verma",
    detail: "@priyaverma • Money Received",
    amount: 1500,
    time: "Yesterday, 05:20 PM",
    avatar: "/figma/photos/contact-4.png",
  },
  {
    id: "upi",
    name: "Added Money via UPI",
    detail: "Wallet Deposit",
    amount: 11000,
    time: "10 May, 02:15 PM",
    icon: "/figma/icons/wallet-card.png",
  },
  {
    id: "rohan",
    name: "Rohan Singh",
    detail: "@rohansingh • Money Sent",
    amount: -500,
    time: "09 May, 11:45 AM",
    avatar: "/figma/photos/contact-3.png",
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

function PageHeader({
  title,
  backHref,
}: {
  title: string;
  backHref: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <Link
        href={backHref}
        aria-label="Go back"
        className="size-10 rounded-full flex items-center justify-center hover:bg-[#EFF4FF] transition-colors shrink-0"
      >
        <FigmaIcon src="/figma/icons/back-arrow.svg" alt="" width={16} height={16} />
      </Link>
      <h1 className="text-[24px] font-bold leading-8 text-[#0B1C30]">{title}</h1>
    </div>
  );
}

function DashboardScreen() {
  const [balance, setBalance] = useState(5240);
  const [transactions, setTransactions] = useState<WalletTx[]>(BASE_TRANSACTIONS);

  useEffect(() => {
    markCreated();
    setBalance(readBalance());
    setTransactions([...readExtraTxs(), ...BASE_TRANSACTIONS]);
  }, []);

  return (
    <div className="w-full max-w-[760px] pt-2 pb-12 px-1">
      <PageHeader title="My Wallet Dashboard" backHref="/" />

      <div className="flex items-stretch gap-3 mb-6">
        <div className="flex-1 min-w-0 rounded-[16px] bg-[#00696F] text-white p-5 shadow-[0px_8px_16px_rgba(0,105,111,0.18)] relative overflow-hidden">
          <div className="absolute right-4 top-4 size-9 rounded-full bg-white/20 flex items-center justify-center">
            <TintedIcon src="/figma/icons/wallet.svg" color="#FFFFFF" width={16} height={15} />
          </div>
          <p className="text-[13px] leading-5 text-white/80">Total Balance</p>
          <p className="mt-2 text-[28px] sm:text-[32px] font-bold leading-9 tracking-[-0.3px]">
            ₹{formatInr(balance)}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-[12px] leading-4 text-white/90">
            <span className="inline-flex items-center gap-1.5">
              <TintedIcon src="/figma/icons/friends-lock.svg" color="#FFFFFF" width={12} height={10} />
              Secure
            </span>
            <span className="inline-flex items-center gap-1.5">
              <TintedIcon src="/figma/icons/clock.svg" color="#FFFFFF" width={12} height={12} />
              Updated just now
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 shrink-0 w-[96px] sm:w-[108px]">
          <Link
            href="/wallet/add"
            className="flex-1 bg-white rounded-[12px] border border-[#E5E7EB] shadow-[0px_1px_3px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center gap-2 px-2 py-3 hover:bg-[#F9FAFB] transition-colors"
          >
            <span className="size-9 rounded-full bg-[rgba(0,105,111,0.12)] flex items-center justify-center overflow-clip">
              <FigmaIcon src="/figma/icons/attach-plus.svg" alt="" width={20} height={20} />
            </span>
            <span className="text-[12px] font-semibold leading-4 text-[#0B1C30] text-center">
              Add Money
            </span>
          </Link>
          <Link
            href="/wallet/withdraw"
            className="flex-1 bg-white rounded-[12px] border border-[#E5E7EB] shadow-[0px_1px_3px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center gap-2 px-2 py-3 hover:bg-[#F9FAFB] transition-colors"
          >
            <span className="size-9 rounded-full bg-[rgba(0,105,111,0.12)] flex items-center justify-center overflow-clip">
              <TintedIcon src="/figma/icons/wallet.svg" color="#00696F" width={16} height={15} />
            </span>
            <span className="text-[12px] font-semibold leading-4 text-[#0B1C30] text-center">
              Withdraw
            </span>
          </Link>
        </div>
      </div>

      <section className="bg-white rounded-[16px] border border-[#EEF2F6] shadow-[0px_1px_3px_rgba(0,0,0,0.05)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-bold leading-6 text-[#0B1C30]">Recent Transactions</h2>
          <button type="button" className="text-[14px] font-medium text-[#00696F]">
            View More
          </button>
        </div>

        <ul className="flex flex-col">
          {transactions.map((tx, index) => (
            <li
              key={tx.id}
              className={`flex items-center gap-3 py-3 ${
                index < transactions.length - 1 ? "border-b border-[#F3F4F6]" : ""
              }`}
            >
              {tx.avatar ? (
                <span className="relative size-10 rounded-full overflow-hidden shrink-0">
                  <Image src={tx.avatar} alt="" fill sizes="40px" className="object-cover" />
                </span>
              ) : (
                <span className="size-10 rounded-full bg-[rgba(0,105,111,0.12)] flex items-center justify-center overflow-clip shrink-0">
                  <img
                    src={tx.icon}
                    alt=""
                    width={22}
                    height={22}
                    className="size-[22px] object-cover object-bottom"
                  />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold leading-5 text-[#0B1C30] truncate">{tx.name}</p>
                <p className="text-[12px] leading-4 text-[#6B7280] truncate">{tx.detail}</p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`text-[14px] font-semibold leading-5 ${
                    tx.amount > 0 ? "text-[#00696F]" : "text-[#0B1C30]"
                  }`}
                >
                  {tx.amount > 0 ? "+" : "-"} ₹{Math.abs(tx.amount).toLocaleString("en-IN")}
                </p>
                <p className="text-[12px] leading-4 text-[#6B7280]">{tx.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function AddMoneyScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState(1000);

  useEffect(() => {
    setAmount(readAmount());
  }, []);

  const display = amount.toLocaleString("en-IN");

  return (
    <div className="relative w-full min-h-full">
      <Link
        href="/wallet/dashboard"
        aria-label="Go back"
        className="absolute left-0 top-2.5 z-10 size-10 rounded-full flex items-center justify-center hover:bg-[#EFF4FF] transition-colors"
      >
        <FigmaIcon src="/figma/icons/back-arrow.svg" alt="" width={16} height={16} />
      </Link>

      <div className="flex justify-center pt-10 pb-16 px-4">
        <form
          className="w-full max-w-[420px] bg-white rounded-[16px] shadow-[0px_8px_24px_rgba(15,23,42,0.08)] p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (amount <= 0) return;
            writeAmount(amount);
            router.push("/wallet/payment");
          }}
        >
          <h1 className="text-[24px] font-bold leading-8 text-[#0B1C30] mb-6">Add Money</h1>

          <label className="block text-[13px] leading-5 text-[#6B7280] mb-2">Enter Amount</label>
          <div className="h-16 rounded-[12px] bg-[#F3F4F6] flex items-center px-4 gap-2">
            <span className="text-[24px] font-bold text-[#0B1C30]">₹</span>
            <input
              type="text"
              inputMode="numeric"
              value={display}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "").slice(0, 7);
                setAmount(digits ? Number(digits) : 0);
              }}
              className="flex-1 bg-transparent text-[24px] font-bold text-[#0B1C30] text-center focus:outline-none"
              aria-label="Amount"
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            {QUICK_AMOUNTS.map((value) => {
              const selected = amount === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmount(value)}
                  className={`flex-1 h-9 rounded-full text-[13px] font-semibold ${
                    selected
                      ? "bg-[rgba(0,105,111,0.12)] text-[#00696F]"
                      : "bg-[#F3F4F6] text-[#0B1C30]"
                  }`}
                >
                  + ₹{value.toLocaleString("en-IN")}
                </button>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={amount <= 0}
            className="mt-8 w-full h-14 rounded-[12px] bg-[#00696F] text-white text-[14px] font-semibold tracking-[0.14px] hover:bg-[#00585D] disabled:opacity-50 transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

function PaymentScreen() {
  const router = useRouter();

  return (
    <div className="relative w-full min-h-full">
      <Link
        href="/wallet/add"
        aria-label="Go back"
        className="absolute left-0 top-2.5 z-10 size-10 rounded-full flex items-center justify-center hover:bg-[#EFF4FF] transition-colors"
      >
        <FigmaIcon src="/figma/icons/back-arrow.svg" alt="" width={16} height={16} />
      </Link>

      <div className="flex flex-col items-center pt-10 pb-16 px-4">
        <h1 className="text-[24px] font-bold leading-8 text-[#0B1C30] text-center">
          Select Payment Method
        </h1>
        <p className="mt-2 mb-6 text-[14px] leading-5 text-[#6B7280] text-center">
          Choose how you want to add money to your wallet.
        </p>

        <div className="w-full max-w-[420px] bg-white rounded-[16px] shadow-[0px_8px_24px_rgba(15,23,42,0.08)] p-4 flex flex-col gap-3">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => router.push("/wallet/added")}
              className="w-full flex items-center gap-3 rounded-[12px] border border-[#E5E7EB] px-3 py-3 text-left hover:bg-[#F9FAFB] transition-colors"
            >
              <span className="size-10 rounded-full bg-[#E8F4F8] overflow-clip flex items-center justify-center shrink-0">
                <img
                  src={method.icon}
                  alt=""
                  width={28}
                  height={28}
                  className={`size-7 ${method.object} object-cover`}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold leading-5 text-[#0B1C30]">
                  {method.title}
                </span>
                <span className="block text-[12px] leading-4 text-[#6B7280]">{method.subtitle}</span>
              </span>
              <FigmaIcon src="/figma/icons/arrow.svg" alt="" width={7} height={12} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddedScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState(1000);

  useEffect(() => {
    setAmount(readAmount());
  }, []);

  return (
    <div className="relative w-full min-h-full">
      <Link
        href="/wallet/payment"
        aria-label="Go back"
        className="absolute left-0 top-2.5 z-10 size-10 rounded-full flex items-center justify-center hover:bg-[#EFF4FF] transition-colors"
      >
        <FigmaIcon src="/figma/icons/back-arrow.svg" alt="" width={16} height={16} />
      </Link>

      <div className="flex justify-center pt-16 pb-16 px-4">
        <div className="w-full max-w-[420px] rounded-[16px] bg-[#E7F3F4] shadow-[0px_8px_24px_rgba(15,23,42,0.08)] px-6 pt-8 pb-6 flex flex-col items-center">
          <div className="size-16 rounded-full bg-[rgba(0,105,111,0.18)] flex items-center justify-center mb-4">
            <FigmaIcon src="/figma/icons/wallet-success-check.svg" alt="" width={40} height={40} />
          </div>

          <h1 className="text-[20px] font-bold leading-7 text-[#0B1C30] text-center">
            Money Added Successfully!
          </h1>
          <p className="mt-3 text-[28px] font-bold leading-9 text-[#00696F]">₹{amount.toLocaleString("en-IN")}</p>
          <p className="mt-2 text-[14px] leading-5 text-[#6B7280] text-center">
            Your wallet balance has been updated.
          </p>

          <div className="w-full h-px bg-[#C5DADC] my-5" />

          <button
            type="button"
            onClick={() => {
              writeBalance(readBalance() + amount);
              router.push("/wallet/dashboard");
            }}
            className="w-full h-12 rounded-[12px] bg-[#00696F] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#00585D] transition-colors"
          >
            <TintedIcon src="/figma/icons/wallet.svg" color="#FFFFFF" width={15} height={14} />
            Back to My Wallet
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WalletDashboard({ step }: { step: DashboardStep }) {
  if (step === "add") return <AddMoneyScreen />;
  if (step === "payment") return <PaymentScreen />;
  if (step === "added") return <AddedScreen />;
  return <DashboardScreen />;
}
