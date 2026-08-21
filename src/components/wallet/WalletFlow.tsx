"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FigmaIcon from "../home/FigmaIcon";
import { markCreated } from "./walletStorage";

const PHONE_KEY = "chattm-wallet-phone";
const DEFAULT_PHONE = "9876543210";

export type WalletStep = "welcome" | "verify" | "otp" | "success";

function readPhone() {
  if (typeof window === "undefined") return DEFAULT_PHONE;
  return sessionStorage.getItem(PHONE_KEY) || DEFAULT_PHONE;
}

function savePhone(digits: string) {
  sessionStorage.setItem(PHONE_KEY, digits);
}

function formatMobile(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

function displayPhone(digits: string) {
  return `+91 ${formatMobile(digits)}`;
}

function WalletShell({
  backHref,
  children,
}: {
  backHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-full min-h-full">
      {backHref ? (
        <Link
          href={backHref}
          aria-label="Go back"
          className="absolute left-0 top-2.5 z-10 size-10 rounded-full flex items-center justify-center hover:bg-[#EFF4FF] transition-colors"
        >
          <FigmaIcon src="/figma/icons/back-arrow.svg" alt="" width={16} height={16} />
        </Link>
      ) : null}
      <div className="flex flex-col items-center w-full pt-10 pb-16 px-4">{children}</div>
    </div>
  );
}

function PrimaryButton({
  children,
  className = "",
  type = "button",
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-14 rounded-[12px] bg-[#00696F] text-white text-[14px] font-semibold leading-5 tracking-[0.14px] hover:bg-[#00585D] disabled:opacity-50 disabled:hover:bg-[#00696F] transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

function WelcomeStep() {
  return (
    <WalletShell>
      <div className="w-full max-w-[324px] flex flex-col items-center">
        <h1 className="text-[28px] font-bold leading-9 text-[#122756] text-center">
          Welcome to Wallet
        </h1>

        <div className="relative flex items-center justify-center w-full max-w-[280px] mt-12 mb-6">
          <div className="absolute inset-0 bg-[#00696F] blur-[32px] opacity-10 rounded-full" />
          <div className="relative h-[69px] w-[192px] drop-shadow-[0px_25px_25px_rgba(0,0,0,0.15)]">
            <Image
              src="/figma/photos/wallet-logo.png"
              alt="ChatTm"
              fill
              sizes="192px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        <p className="text-[16px] leading-6 text-[#122756] text-center opacity-80 max-w-[280px]">
          Send, receive and manage money
          <br />
          securely on our platform.
        </p>

        <Link
          href="/wallet/verify"
          className="mt-12 w-full h-14 rounded-[12px] bg-[#00696F] text-white text-[14px] font-semibold leading-5 tracking-[0.14px] flex items-center justify-center drop-shadow-[0px_8px_8px_rgba(210,27,139,0.2)] hover:bg-[#00585D] transition-colors"
        >
          Create Wallet
        </Link>

        <Link
          href="/"
          className="w-full h-14 rounded-[12px] text-[#122756] text-[14px] font-semibold leading-5 tracking-[0.14px] flex items-center justify-center hover:bg-[#F9FAFB] transition-colors"
        >
          Not Now
        </Link>
      </div>
    </WalletShell>
  );
}

function VerifyStep() {
  const router = useRouter();
  const [phone, setPhone] = useState(DEFAULT_PHONE);

  useEffect(() => {
    setPhone(readPhone());
  }, []);

  const canContinue = phone.length === 10;

  return (
    <WalletShell backHref="/wallet">
      <form
        className="w-full max-w-[380px] flex flex-col items-center"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canContinue) return;
          savePhone(phone);
          router.push("/wallet/otp");
        }}
      >
        <h1 className="text-[24px] font-bold leading-8 text-[#0B1C30] text-center">
          Verify Mobile Number
        </h1>

        <div className="relative size-[120px] mt-8 mb-6 overflow-clip">
          <Image
            src="/figma/photos/wallet-phone.png"
            alt=""
            fill
            sizes="120px"
            className="object-contain"
          />
        </div>

        <p className="text-[16px] leading-6 text-[#3C494A] text-center mb-8">
          Enter your mobile number to create your wallet.
        </p>

        <label className="w-full text-[14px] font-medium leading-5 text-[#0B1C30] mb-2">
          Mobile Number
        </label>
        <div className="w-full h-14 rounded-[12px] border border-[#D8D2D2] flex items-center overflow-hidden focus-within:border-[#00696F] focus-within:ring-1 focus-within:ring-[#00696F]">
          <span className="h-full px-3 flex items-center gap-1.5 border-r border-[#D8D2D2] text-[14px] font-medium text-[#0B1C30] shrink-0">
            +91
            <FigmaIcon src="/figma/icons/chevron-down.svg" alt="" width={7} height={4} />
          </span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={formatMobile(phone)}
            onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
            className="flex-1 h-full px-3 text-[16px] leading-6 text-[#0B1C30] bg-transparent focus:outline-none"
            aria-label="Mobile number"
          />
        </div>

        <PrimaryButton type="submit" disabled={!canContinue} className="mt-8">
          Continue
        </PrimaryButton>

        <p className="mt-4 text-[14px] leading-5 text-[#3C494A] text-center">
          We will send you an OTP to verify.
        </p>
      </form>
    </WalletShell>
  );
}

function OtpStep() {
  const router = useRouter();
  const [phone, setPhone] = useState(DEFAULT_PHONE);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(25);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    setPhone(readPhone());
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(id);
  }, [seconds]);

  const code = otp.join("");
  const canVerify = code.length === 6;

  const setDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) inputsRef.current[index + 1]?.focus();
  };

  return (
    <WalletShell backHref="/wallet/verify">
      <form
        className="w-full max-w-[380px] flex flex-col items-center"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canVerify) return;
          markCreated();
          router.push("/wallet/success");
        }}
      >
        <h1 className="text-[24px] font-bold leading-8 text-[#0B1C30] text-center">Enter OTP</h1>
        <p className="mt-3 text-[16px] leading-6 text-[#3C494A] text-center">
          Enter the 6-digit OTP sent to {displayPhone(phone)}
        </p>

        <div className="mt-8 flex items-center justify-center gap-2 w-full">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(node) => {
                inputsRef.current[index] = node;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              onChange={(event) => setDigit(index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !otp[index] && index > 0) {
                  inputsRef.current[index - 1]?.focus();
                }
              }}
              onPaste={(event) => {
                const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                if (!pasted) return;
                event.preventDefault();
                const next = ["", "", "", "", "", ""];
                pasted.split("").forEach((char, charIndex) => {
                  next[charIndex] = char;
                });
                setOtp(next);
                inputsRef.current[Math.min(pasted.length, 5)]?.focus();
              }}
              className="size-12 sm:size-14 rounded-[8px] border border-[#D8D2D2] text-center text-[20px] font-semibold text-[#0B1C30] focus:outline-none focus:border-[#00696F] focus:ring-1 focus:ring-[#00696F]"
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </div>

        <PrimaryButton type="submit" disabled={!canVerify} className="mt-8 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]">
          Verify & Proceed
        </PrimaryButton>

        <p className="mt-5 text-[14px] leading-5 text-[#3C494A] text-center">
          Resend OTP in{" "}
          <span className="text-[#00696F] font-medium">
            {seconds > 0
              ? `00:${String(seconds).padStart(2, "0")}`
              : "00:00"}
          </span>
        </p>

        {seconds <= 0 ? (
          <button
            type="button"
            onClick={() => setSeconds(25)}
            className="mt-1 text-[14px] font-medium text-[#00696F] hover:underline"
          >
            Resend OTP
          </button>
        ) : null}

        <Link
          href="/wallet/verify"
          className="mt-3 text-[14px] font-medium text-[#00696F] underline underline-offset-2"
        >
          Change Number
        </Link>
      </form>
    </WalletShell>
  );
}

function SuccessStep() {
  return (
    <WalletShell backHref="/wallet/otp">
      <div className="w-full max-w-[380px] flex flex-col items-center">
        <h1 className="text-[24px] font-bold leading-8 text-[#0B1C30] text-center">
          Wallet Created Successfully!
        </h1>

        <div className="mt-8 mb-6 size-24 rounded-full bg-[rgba(0,105,111,0.1)] flex items-center justify-center">
          <FigmaIcon src="/figma/icons/wallet-success-check.svg" alt="" width={40} height={40} />
        </div>

        <p className="text-[16px] leading-6 text-[#3C494A] text-center">Your wallet is ready to use</p>

        <div className="mt-6 mb-12 flex flex-col items-center gap-1">
          <p className="text-[28px] font-bold leading-9 text-[#20737B] text-center">₹0.00</p>
          <p className="text-[14px] font-semibold leading-5 tracking-[0.7px] uppercase text-[#3C494A] text-center">
            Wallet Balance
          </p>
        </div>

        <Link
          href="/wallet/dashboard"
          className="w-full h-14 rounded-[12px] bg-[#00696F] text-white text-[14px] font-semibold leading-5 tracking-[0.14px] flex items-center justify-center shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] hover:bg-[#00585D] transition-colors"
        >
          Go to My Wallet
        </Link>
      </div>
    </WalletShell>
  );
}

export default function WalletFlow({ step }: { step: WalletStep }) {
  if (step === "verify") return <VerifyStep />;
  if (step === "otp") return <OtpStep />;
  if (step === "success") return <SuccessStep />;
  return <WelcomeStep />;
}
