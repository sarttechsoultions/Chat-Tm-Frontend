import React from "react";
import Link from "next/link";
import AuthShell from "../../../components/auth/AuthShell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot password">
      <p className="text-[#4E616F] text-[14px] leading-6 mb-6">
        Password reset will be available soon. For now, go back to login or create a new account.
      </p>
      <Link
        href="/login"
        className="w-full h-[50px] bg-[#00696F] text-white font-semibold rounded-[10px] flex items-center justify-center hover:bg-[#005a5f] transition-colors"
      >
        Back to Login
      </Link>
    </AuthShell>
  );
}
