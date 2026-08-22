"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { Eye, EyeOff } from "lucide-react";
import { adminLoginRequest, ApiError, setSession } from "../../../../lib/auth";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await adminLoginRequest(identifier, password);
      setSession(result.token, result.user, remember);
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to sign in. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${inter.className} min-h-screen bg-white flex items-center justify-center px-4`}>
      <form className="w-full max-w-[384px] flex flex-col items-center" onSubmit={handleSubmit}>
        <div className="relative h-[72px] w-[200px] overflow-clip">
          <Image
            src="/ChatTmLogo.png"
            alt="ChatTm"
            fill
            sizes="200px"
            className="object-contain"
            priority
          />
        </div>

        <p className="mt-4 mb-8 text-[14px] leading-5 text-[#4E616F] text-center">
          Sign in to access the system workspace.
        </p>

        <label className="w-full text-[16px] font-semibold leading-6 text-[#171D1C] mb-2">
          Email or Username
        </label>
        <input
          type="text"
          name="identifier"
          autoComplete="username"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="admin@chattm.com"
          required
          className="w-full h-[50px] px-4 rounded-[10px] border border-[#D8D2D2] text-[14px] text-[#171D1C] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#00696F] focus:ring-1 focus:ring-[#00696F]"
        />

        <label className="w-full text-[16px] font-semibold leading-6 text-[#171D1C] mt-5 mb-2">
          Password
        </label>
        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            className="w-full h-[50px] px-4 pr-12 rounded-[10px] border border-[#D8D2D2] text-[14px] text-[#171D1C] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#00696F] focus:ring-1 focus:ring-[#00696F]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#3C494A]"
          >
            {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>

        <label className="w-full mt-4 pl-2 flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="size-4 rounded border-[#D8D2D2] accent-[#00696F]"
          />
          <span className="text-[13px] leading-[18px] text-[#4E616F]">Remember me for 30 days</span>
        </label>

        {error ? <p className="w-full mt-4 text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[50px] mt-6 rounded-[10px] bg-[#00696F] text-white text-[16px] font-semibold hover:bg-[#00585D] transition-colors disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="mt-6 w-[320px] text-center text-[13px] leading-[18px] text-[#4E616F]">
          Secure Administrative Access Only.
          <br />
          Powered by AdminPro
        </p>
      </form>
    </div>
  );
}
