"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import CenteredAuthFrame, {
  AuthLogo,
  authInputClass,
  primaryButtonClass,
} from "../../../components/auth/CenteredAuthFrame";
import { ApiError, loginRequest, setSession } from "../../../lib/auth";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
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
    <CenteredAuthFrame>
      <AuthLogo />
      <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
        <input
          type="text"
          name="identifier"
          autoComplete="username"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Email or Phone"
          required
          className={authInputClass}
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
            className={`${authInputClass} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>

        <div className="flex items-center justify-between mt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="size-4 rounded border-[#D8D2D2] accent-[#00696F]"
            />
            <span className="text-sm text-[#3C494A]">Remember Me</span>
          </label>
          <Link href="/forgot-password" className="text-sm text-[#00696F] font-medium hover:underline">
            Forgot Password?
          </Link>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button type="submit" disabled={loading} className={`w-full mt-2 ${primaryButtonClass}`}>
          {loading ? "Signing in..." : "Sign In Now"}
        </button>
      </form>

      <p className="text-center mt-8 text-sm text-[#0B1C30]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[#00696F] font-semibold hover:underline">
          Sign Up Now
        </Link>
      </p>
    </CenteredAuthFrame>
  );
}
