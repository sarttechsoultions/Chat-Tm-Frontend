"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle, ChevronLeft, ChevronRight, Eye, Search, UserX } from "lucide-react";
import {
  deleteAdminUser,
  getAdminUsers,
  updateAdminUserStatus,
  type AccountStatus,
  type AdminUser,
  type KycStatus,
} from "../../lib/api/admin";
import { AdminConfirmModal } from "./AdminConfirmModal";

function statusBadge(status: string) {
  if (status === "BLOCKED") return "bg-[#FEE2E2] text-[#DC2626]";
  if (status === "SUSPENDED") return "bg-[#FFEDD5] text-[#C2410C]";
  if (status === "INACTIVE") return "bg-[#F3F4F6] text-[#6B7280]";
  return "bg-[#DCFCE7] text-[#15803D]";
}

function kycBadge(status: string) {
  if (status === "VERIFIED") return "bg-[#DCFCE7] text-[#15803D]";
  if (status === "PENDING") return "bg-[#FFF7ED] text-[#EA580C]";
  return "bg-[#F3F4F6] text-[#6B7280]";
}

export function AdminUsersManager({
  title = "Users",
  description = "Manage registered accounts, status, and identity.",
  defaultStatus = "ALL",
}: {
  title?: string;
  description?: string;
  defaultStatus?: "ALL" | AccountStatus;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | AccountStatus>(defaultStatus);
  const [kyc, setKyc] = useState<"ALL" | KycStatus>("ALL");
  const [joinedFrom, setJoinedFrom] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    unverifiedUsers: 0,
    blockedUsers: 0,
    suspendedUsers: 0,
  });
  const [pending, setPending] = useState<{
    user: AdminUser;
    action: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BLOCKED" | "DELETE";
  } | null>(null);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminUsers({
        page,
        limit: 10,
        search,
        status,
        kyc,
        joinedFrom: joinedFrom || undefined,
      });
      setUsers(response.users ?? []);
      setPagination(response.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 });
      if (response.stats) setStats(response.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, search, status, kyc, joinedFrom]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[20px] font-semibold text-[#171D1C]">{title}</h1>
        <p className="mt-1 text-[14px] text-[#6B7280]">{description}</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          ["Total", stats.totalUsers],
          ["Active", stats.activeUsers],
          ["Unverified", stats.unverifiedUsers],
          ["Suspended", stats.suspendedUsers],
          ["Blocked", stats.blockedUsers],
        ].map(([label, value]) => (
          <div key={String(label)} className="bg-white rounded-[12px] border border-[#E5E7EB] px-4 py-3">
            <p className="text-[12px] text-[#6B7280]">{label}</p>
            <p className="mt-1 text-[18px] font-semibold text-[#171D1C]">{Number(value).toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 h-10 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 flex items-center gap-2">
            <Search className="size-4 text-[#9CA3AF]" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, username, or email"
              className="flex-1 bg-transparent outline-none text-[14px]"
            />
          </div>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status);
              setPage(1);
            }}
            className="h-10 rounded-[10px] border border-[#E5E7EB] px-3 text-[14px] bg-white outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BLOCKED">Blocked</option>
          </select>
          <select
            value={kyc}
            onChange={(event) => {
              setKyc(event.target.value as typeof kyc);
              setPage(1);
            }}
            className="h-10 rounded-[10px] border border-[#E5E7EB] px-3 text-[14px] bg-white outline-none"
          >
            <option value="ALL">All Verification</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="UNVERIFIED">Unverified</option>
          </select>
          <input
            type="date"
            value={joinedFrom}
            onChange={(event) => {
              setJoinedFrom(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-[10px] border border-[#E5E7EB] px-3 text-[14px] bg-white outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#6B7280]">Loading users...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-[#6B7280]">No users found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    {["USER", "USERNAME", "EMAIL", "STATUS", "KYC", "JOINED", "ACTIONS"].map((heading) => (
                      <th key={heading} className="text-left px-5 py-3 text-[12px] font-semibold text-[#6B7280]">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]">
                      <td className="px-5 py-4">
                        <Link href={`/admin/users/${user.username}`} className="flex items-center gap-3">
                          <div className="relative size-10 rounded-full overflow-hidden bg-[#E5E7EB] shrink-0">
                            {user.avatar ? (
                              <Image src={user.avatar} alt={user.username} fill sizes="40px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-semibold text-[#00696F]">
                                {user.firstName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <p className="text-[14px] font-semibold text-[#171D1C]">{user.name}</p>
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-[14px] text-[#00696F]">@{user.username}</td>
                      <td className="px-5 py-4 text-[14px] text-[#6B7280]">{user.email || "—"}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[12px] font-medium ${statusBadge(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[12px] font-medium ${kycBadge(user.kycStatus)}`}>
                          {user.kycStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#6B7280]">
                        {new Date(user.joinedAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            title="View user"
                            onClick={() => router.push(`/admin/users/${user.username}`)}
                            className="size-9 rounded-[8px] border border-[#E5E7EB] flex items-center justify-center text-[#7B8794] hover:text-[#00696F]"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            type="button"
                            title={user.status === "ACTIVE" ? "Suspend" : "Activate"}
                            onClick={() =>
                              setPending({
                                user,
                                action: user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                              })
                            }
                            className="size-9 rounded-[8px] border border-[#E5E7EB] flex items-center justify-center text-[#7B8794] hover:text-[#EA580C]"
                          >
                            {user.status === "ACTIVE" ? <Ban className="size-4" /> : <CheckCircle className="size-4" />}
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => setPending({ user, action: "DELETE" })}
                            className="size-9 rounded-[8px] border border-[#FEE2E2] flex items-center justify-center text-[#DC2626] hover:bg-[#FEF2F2]"
                          >
                            <UserX className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 flex items-center justify-between border-t border-[#E5E7EB]">
              <p className="text-[13px] text-[#6B7280]">
                Showing {users.length} of {pagination.total} users
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="size-8 rounded-[8px] border border-[#E5E7EB] flex items-center justify-center disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-[13px] text-[#4B5563] px-2">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="size-8 rounded-[8px] border border-[#E5E7EB] flex items-center justify-center disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {pending ? (
        <AdminConfirmModal
          title={
            pending.action === "DELETE"
              ? `Delete @${pending.user.username}`
              : pending.action === "ACTIVE"
                ? `Activate @${pending.user.username}`
                : `${pending.action === "BLOCKED" ? "Block" : "Suspend"} @${pending.user.username}`
          }
          description="This action is recorded in the audit log. Username remains the public identifier."
          confirmLabel={pending.action === "DELETE" ? "Delete account" : "Confirm"}
          tone={pending.action === "DELETE" || pending.action === "BLOCKED" ? "danger" : pending.action === "ACTIVE" ? "neutral" : "warning"}
          requireReason={pending.action !== "ACTIVE"}
          onClose={() => setPending(null)}
          onConfirm={async (reason) => {
            if (pending.action === "DELETE") {
              await deleteAdminUser(pending.user.username, reason);
            } else {
              await updateAdminUserStatus(pending.user.username, pending.action, reason);
            }
            setPending(null);
            await loadUsers();
          }}
        />
      ) : null}
    </div>
  );
}
