"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, loginRequest, setSession } from "../../../lib/auth";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginRequest(identifier, password);
      setSession(result.token, result.user, remember);
      router.replace(result.user.role === "ADMIN" ? "/admin" : nextPath.startsWith("/admin") ? "/" : nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to login. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-5 py-10 font-sans text-[#0B1C30] lg:flex lg:items-center lg:justify-center lg:px-8 lg:py-0">
      <div className="mx-auto flex w-full max-w-[917px] flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-[85px]">
        <section className="hidden h-[604px] w-[448px] shrink-0 items-center justify-center rounded-[14px] bg-[rgba(0,105,111,0.10)] lg:flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/auth/chat-tm-logo.png" alt="ChatTm" className="h-[92.5px] w-[256px] object-contain" />
        </section>

        <section className="w-full max-w-[384px] shrink-0">
          <div className="mb-[50px] flex items-center gap-2">
            <h1 className="font-[family-name:var(--font-plus-jakarta)] text-[24px] font-bold leading-8">Welcome Back</h1>
            <span className="text-[24px] leading-8" aria-hidden="true">👋</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
        <input
          type="text"
          name="identifier"
          autoComplete="username"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Email or Phone Number"
          required
          className="h-[50px] w-full rounded-[10px] border border-[#D8D2D2] bg-white px-4 font-sans text-[16px] text-[#0B1C30] placeholder:text-[#6B7280] focus:border-[#00696F] focus:outline-none focus:ring-1 focus:ring-[#00696F]"
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            className="h-[50px] w-full rounded-[10px] border border-[#D8D2D2] bg-white px-4 pr-12 font-sans text-[16px] text-[#0B1C30] placeholder:text-[#6B7280] focus:border-[#00696F] focus:outline-none focus:ring-1 focus:ring-[#00696F]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 h-5 w-[22px] -translate-y-1/2"
          >
            {showPassword ? (
              <span className="text-sm text-[#6B7280]" aria-hidden="true">Hide</span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/figma/auth/password-visibility.svg" alt="" className="h-full w-full" />
            )}
          </button>
        </div>

        <div className="flex justify-end pt-[2px]">
          <Link href="/forgot-password" className="font-sans text-[12px] font-normal tracking-[0.24px] text-[#00696F] hover:underline">
            Forgot Password?
          </Link>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button type="submit" disabled={loading} className="mt-[18px] h-[50px] w-full rounded-[10px] bg-[#00696F] font-sans text-[18px] font-bold text-white transition-colors hover:bg-[#005a5f] disabled:opacity-70">
          {loading ? "Signing in..." : "Login"}
        </button>
            </div>
          </form>

          <div className="my-[40px] flex items-center gap-[18px]" aria-hidden="true">
            <span className="h-px flex-1 bg-[#D8D2D2]" />
            <span className="font-sans text-[18px] font-bold text-[#C1C1C1]">OR</span>
            <span className="h-px flex-1 bg-[#D8D2D2]" />
          </div>

          <div className="space-y-[26px]">
            <button type="button" className="flex h-[50px] w-full items-center justify-center gap-4 rounded-[10px] border border-[#D8D2D2] font-[family-name:var(--font-plus-jakarta)] text-[14px] font-semibold tracking-[0.14px] text-[#0B1C30]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/figma/auth/google.svg" alt="" className="h-5 w-5" />
              Continue with Google
            </button>
            <button type="button" className="flex h-[50px] w-full items-center justify-center gap-4 rounded-[10px] border border-[#D8D2D2] font-[family-name:var(--font-plus-jakarta)] text-[14px] font-semibold tracking-[0.14px] text-[#0B1C30]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/figma/auth/apple.svg" alt="" className="h-5 w-5" />
              Continue with Apple
            </button>
          </div>

          <p className="mt-[18px] text-center font-[family-name:var(--font-plus-jakarta)] text-[16px] leading-6 text-[#3C494A]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#00696F] hover:underline">Sign Up</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
