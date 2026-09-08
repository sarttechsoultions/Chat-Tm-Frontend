"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Ban, CheckCircle, RefreshCw, UserX } from "lucide-react";
import {
  deleteAdminUser,
  getAdminUser,
  updateAdminUserStatus,
  type AdminUserDetails,
} from "../../lib/api/admin";
import { AdminConfirmModal } from "./AdminConfirmModal";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminUserDetail() {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username || "");
  const [user, setUser] = useState<AdminUserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"ACTIVE" | "INACTIVE" | "SUSPENDED" | "BLOCKED" | "DELETE" | null>(null);

  async function loadUser() {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminUser(username);
      setUser(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load user");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUser();
  }, [username]);

  if (loading) {
    return <div className="p-10 text-center text-[#6B7280]">Loading user...</div>;
  }

  if (error || !user) {
    return (
      <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-10 text-center">
        <AlertCircle className="mx-auto size-8 text-[#DC2626]" />
        <p className="mt-3 text-[14px] text-[#6B7280]">{error || "User not found"}</p>
        <button
          type="button"
          onClick={loadUser}
          className="mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-[10px] bg-[#00696F] text-white text-[13px]"
        >
          <RefreshCw className="size-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/admin/users" className="inline-flex items-center gap-1 text-[13px] text-[#00696F]">
            <ArrowLeft className="size-4" /> All users
          </Link>
          <h1 className="mt-2 text-[20px] font-semibold text-[#171D1C]">{user.name}</h1>
          <p className="text-[14px] text-[#6B7280]">@{user.username}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.status !== "ACTIVE" ? (
            <button type="button" onClick={() => setPending("ACTIVE")} className="h-10 px-3 rounded-[10px] bg-[#DCFCE7] text-[#15803D] text-[13px] font-semibold inline-flex items-center gap-2">
              <CheckCircle className="size-4" /> Activate
            </button>
          ) : null}
          <button type="button" onClick={() => setPending("SUSPENDED")} className="h-10 px-3 rounded-[10px] bg-[#FFEDD5] text-[#C2410C] text-[13px] font-semibold inline-flex items-center gap-2">
            <Ban className="size-4" /> Suspend
          </button>
          <button type="button" onClick={() => setPending("BLOCKED")} className="h-10 px-3 rounded-[10px] bg-[#FEE2E2] text-[#DC2626] text-[13px] font-semibold inline-flex items-center gap-2">
            <Ban className="size-4" /> Block
          </button>
          <button type="button" onClick={() => setPending("DELETE")} className="h-10 px-3 rounded-[10px] border border-[#FEE2E2] text-[#DC2626] text-[13px] font-semibold inline-flex items-center gap-2">
            <UserX className="size-4" /> Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-5 flex items-center gap-4">
        <div className="relative size-16 rounded-full overflow-hidden bg-[#E5E7EB] shrink-0">
          {user.avatar ? (
            <Image src={user.avatar} alt={user.username} fill sizes="64px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[22px] font-semibold text-[#00696F]">
              {user.firstName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-[#171D1C]">{user.name}</p>
          <p className="text-[13px] text-[#6B7280]">{user.bio || "No bio"}</p>
          <p className="text-[12px] text-[#9CA3AF]">{user.location || "No location"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          ["Status", user.status],
          ["KYC", user.kycStatus],
          ["Email", user.email || "—"],
          ["Phone", user.phone || "—"],
          ["Joined", formatDate(user.joinedAt)],
          ["Last active", formatDate(user.lastActiveAt)],
          ["Wallet", `${user.wallet.currency} ${user.wallet.balance}`],
          ["Referrals", String(user.counts.referrals)],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-[12px] border border-[#E5E7EB] px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-[#9CA3AF]">{label}</p>
            <p className="mt-1 text-[13px] font-medium text-[#171D1C] break-all">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
        {Object.entries(user.counts).map(([key, value]) => (
          <div key={key} className="bg-white rounded-[12px] border border-[#E5E7EB] px-4 py-3">
            <p className="text-[12px] capitalize text-[#6B7280]">{key}</p>
            <p className="mt-1 text-[18px] font-semibold text-[#171D1C]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="bg-white rounded-[12px] border border-[#E5E7EB] p-4">
          <h2 className="text-[14px] font-semibold text-[#171D1C] mb-3">Reports against this user</h2>
          {user.reports.length === 0 ? (
            <p className="text-[13px] text-[#6B7280]">No reports.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {user.reports.map((report) => (
                <li key={report.id} className="border border-[#F3F4F6] rounded-[10px] p-3">
                  <p className="text-[13px] font-medium text-[#171D1C]">{report.reason}</p>
                  <p className="text-[12px] text-[#6B7280]">
                    {report.status} · {report.reporterName} · {formatDate(report.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-[12px] border border-[#E5E7EB] p-4">
          <h2 className="text-[14px] font-semibold text-[#171D1C] mb-3">Moderation history</h2>
          {user.moderationHistory.length === 0 ? (
            <p className="text-[13px] text-[#6B7280]">No previous admin actions.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {user.moderationHistory.map((item) => (
                <li key={item.id} className="border border-[#F3F4F6] rounded-[10px] p-3">
                  <p className="text-[13px] font-medium text-[#171D1C]">{item.action}</p>
                  <p className="text-[12px] text-[#6B7280]">
                    {item.actorName} · {formatDate(item.createdAt)}
                  </p>
                  {item.reason ? <p className="mt-1 text-[12px] text-[#4B5563]">{item.reason}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {pending ? (
        <AdminConfirmModal
          title={`${pending === "DELETE" ? "Delete" : pending.toLowerCase()} @${user.username}`}
          description="Sensitive account actions require a reason and are written to the audit log."
          confirmLabel="Confirm"
          requireReason={pending !== "ACTIVE"}
          tone={pending === "DELETE" || pending === "BLOCKED" ? "danger" : pending === "ACTIVE" ? "neutral" : "warning"}
          onClose={() => setPending(null)}
          onConfirm={async (reason) => {
            if (pending === "DELETE") {
              await deleteAdminUser(user.username, reason);
            } else {
              await updateAdminUserStatus(user.username, pending, reason);
            }
            setPending(null);
            await loadUser();
          }}
        />
      ) : null}
    </div>
  );
}
