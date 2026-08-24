"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  X,
} from "lucide-react";

import {
  getAdminUsers,
  getAdminUser,
  updateAdminUserStatus,
  type AdminUser,
} from "../../../../lib/api/admin";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<
    "ALL" | "ACTIVE" | "INACTIVE" | "BLOCKED"
  >("ALL");

  const [kyc, setKyc] = useState<
    "ALL" | "VERIFIED" | "PENDING" | "UNVERIFIED"
  >("ALL");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(Date.now());

    updateCurrentTime();
    const timer = setInterval(updateCurrentTime, 60_000);

    return () => clearInterval(timer);
  }, []);

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
      });

      setUsers(response.users ?? []);

      setPagination(
        response.pagination ?? {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1,
        },
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load users",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [page, search, status, kyc]);

  async function handleStatusChange(
    userId: string,
    newStatus: "ACTIVE" | "INACTIVE" | "BLOCKED",
  ) {
    try {
      setActionLoading(userId);

      await updateAdminUserStatus(userId, newStatus);

      setUsers((currentUsers) =>
        currentUsers.map((user) => {
          if (user.id !== userId) return user;

          return {
            ...user,
            status: newStatus,
            isActive: newStatus === "ACTIVE",
            isBlocked: newStatus === "BLOCKED",
          };
        }),
      );

      if (selectedUser?.id === userId) {
        setSelectedUser((current) =>
          current
            ? {
                ...current,
                status: newStatus,
                isActive: newStatus === "ACTIVE",
                isBlocked: newStatus === "BLOCKED",
              }
            : current,
        );
      }
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Unable to update user status",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleViewUser(userId: string) {
    try {
      setViewLoading(true);

      const response = await getAdminUser(userId);

      setSelectedUser(response.user);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Unable to load user details",
      );
    } finally {
      setViewLoading(false);
    }
  }

  function formatDate(date: string | null | undefined) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatLastActive(date: string | null | undefined) {
    if (!date) return "Never";
    if (currentTime === null) return "—";

    const diff = currentTime - new Date(date).getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "1d ago";
    return `${days}d ago`;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-semibold text-[#171D1C]">
          Users
        </h1>

        <p className="mt-1 text-[14px] text-[#6B7280]">
          Manage all users on your platform.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 h-10 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 flex items-center gap-2">
            <Search className="size-4 text-[#9CA3AF]" />

            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or username..."
              className="flex-1 bg-transparent outline-none text-[14px]"
            />
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setPage(1);
            }}
            className="h-10 rounded-[10px] border border-[#E5E7EB] px-3 text-[14px] bg-white outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLOCKED">Blocked</option>
          </select>

          {/* KYC */}
          <select
            value={kyc}
            onChange={(e) => {
              setKyc(e.target.value as typeof kyc);
              setPage(1);
            }}
            className="h-10 rounded-[10px] border border-[#E5E7EB] px-3 text-[14px] bg-white outline-none"
          >
            <option value="ALL">All Verification</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="UNVERIFIED">Unverified</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#6B7280]">
            Loading users...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-[#6B7280]">
            No users found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#6B7280]">
                      USER
                    </th>

                    <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#6B7280]">
                      USERNAME
                    </th>

                    <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#6B7280]">
                      EMAIL
                    </th>

                    <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#6B7280]">
                      STATUS
                    </th>

                    <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#6B7280]">
                      KYC STATUS
                    </th>

                    <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#6B7280]">
                      JOINED DATE
                    </th>

                    <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#6B7280]">
                      LAST ACTIVE
                    </th>

                    <th className="text-center px-4 py-3 text-[12px] font-semibold text-[#6B7280]">
                      ACTIONS
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]"
                    >
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative size-10 rounded-full overflow-hidden bg-[#E5E7EB] shrink-0">
                            {user.avatar ? (
                              <Image
                                src={user.avatar}
                                alt={user.username}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-semibold text-[#00696F]">
                                {user.firstName
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="text-[14px] font-semibold text-[#171D1C]">
                              {user.name ||
                                `${user.firstName} ${user.lastName}`.trim()}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="px-5 py-4">
                        <span className="text-[14px] text-[#00696F]">
                          @{user.username}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4">
                        <span className="text-[14px] text-[#6B7280]">
                          {user.email || "—"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {user.status === "BLOCKED" ||
                        user.isBlocked ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FEE2E2] text-[#DC2626] text-[12px] font-medium">
                            Blocked
                          </span>
                        ) : user.status === "INACTIVE" ||
                          !user.isActive ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FFF7ED] text-[#C2410C] text-[12px] font-medium">
                            Inactive
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] text-[12px] font-medium">
                            Active
                          </span>
                        )}
                      </td>

                      {/* KYC Status */}
                      <td className="px-5 py-4">
                        {user.kycStatus === "VERIFIED" ||
                        user.isVerified ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] text-[12px] font-medium">
                            Verified
                          </span>
                        ) : user.kycStatus === "PENDING" ||
                          user.verificationStatus === "PENDING" ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-[#FFF7ED] text-[#EA580C] text-[12px] font-medium">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-[#F3F4F6] text-[#6B7280] text-[12px] font-medium">
                            Unverified
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="px-5 py-4 text-[13px] text-[#6B7280]">
                        {formatDate(user.joinedAt)}
                      </td>

                      {/* Last Active */}
                      <td className="px-5 py-4 text-[13px] text-[#6B7280]">
                        {formatLastActive(user.lastActiveAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* View */}
                          <button
                            type="button"
                            disabled={viewLoading}
                            title="View user"
                            onClick={() => handleViewUser(user.id)}
                            className="size-9 rounded-[8px] border border-[#E5E7EB] flex items-center justify-center text-[#7B8794] hover:bg-[#F3F4F6] hover:text-[#00696F] transition-colors disabled:opacity-50"
                          >
                            <Eye className="size-[17px]" />
                          </button>

                          {/* Suspend / Activate */}
                          <button
                            type="button"
                            disabled={actionLoading === user.id}
                            title={
                              user.isBlocked
                                ? "Activate user"
                                : "Suspend user"
                            }
                            onClick={() =>
                              handleStatusChange(
                                user.id,
                                user.isBlocked
                                  ? "ACTIVE"
                                  : "BLOCKED",
                              )
                            }
                            className={`size-9 rounded-[8px] border flex items-center justify-center transition-colors disabled:opacity-50 ${
                              user.isBlocked
                                ? "border-[#DCFCE7] text-[#16A34A] hover:bg-[#F0FDF4]"
                                : "border-[#FEE2E2] text-[#EF4444] hover:bg-[#FEF2F2]"
                            }`}
                          >
                            {user.isBlocked ? (
                              <CheckCircle className="size-[17px]" />
                            ) : (
                              <Ban className="size-[17px]" />
                            )}
                          </button>

                          {/* More */}
                          <button
                            type="button"
                            title="More actions"
                            className="size-9 rounded-[8px] border border-[#E5E7EB] flex items-center justify-center text-[#7B8794] hover:bg-[#F3F4F6] transition-colors"
                          >
                            <MoreVertical className="size-[17px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-4 flex items-center justify-between border-t border-[#E5E7EB]">
              <p className="text-[13px] text-[#6B7280]">
                Showing {users.length} of {pagination.total} users
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="size-8 rounded-[8px] border border-[#E5E7EB] flex items-center justify-center disabled:opacity-40 hover:bg-[#F3F4F6]"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <span className="text-[13px] text-[#4B5563] px-2">
                  {pagination.page} / {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="size-8 rounded-[8px] border border-[#E5E7EB] flex items-center justify-center disabled:opacity-40 hover:bg-[#F3F4F6]"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-[520px] bg-white rounded-[16px] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-semibold text-[#171D1C]">
                  User Details
                </h2>

                <p className="text-[13px] text-[#6B7280] mt-1">
                  @{selectedUser.username}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="size-9 rounded-full flex items-center justify-center hover:bg-[#F3F4F6]"
              >
                <X className="size-5 text-[#6B7280]" />
              </button>
            </div>

            {/* User */}
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative size-16 rounded-full overflow-hidden bg-[#E5E7EB]">
                  {selectedUser.avatar ? (
                    <Image
                      src={selectedUser.avatar}
                      alt={selectedUser.username}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[22px] font-semibold text-[#00696F]">
                      {selectedUser.firstName
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-[17px] font-semibold text-[#171D1C]">
                    {selectedUser.name ||
                      `${selectedUser.firstName} ${selectedUser.lastName}`.trim()}
                  </h3>

                  <p className="text-[13px] text-[#6B7280]">
                    @{selectedUser.username}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[10px] bg-[#F9FAFB] p-4">
                  <p className="text-[11px] uppercase tracking-wide text-[#9CA3AF]">
                    Email
                  </p>
                  <p className="mt-1 text-[13px] text-[#374151] break-all">
                    {selectedUser.email || "—"}
                  </p>
                </div>

                <div className="rounded-[10px] bg-[#F9FAFB] p-4">
                  <p className="text-[11px] uppercase tracking-wide text-[#9CA3AF]">
                    Phone
                  </p>
                  <p className="mt-1 text-[13px] text-[#374151]">
                    {selectedUser.phone || "—"}
                  </p>
                </div>

                <div className="rounded-[10px] bg-[#F9FAFB] p-4">
                  <p className="text-[11px] uppercase tracking-wide text-[#9CA3AF]">
                    Status
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-[#374151]">
                    {selectedUser.status}
                  </p>
                </div>

                <div className="rounded-[10px] bg-[#F9FAFB] p-4">
                  <p className="text-[11px] uppercase tracking-wide text-[#9CA3AF]">
                    KYC
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-[#374151]">
                    {selectedUser.kycStatus}
                  </p>
                </div>

                <div className="rounded-[10px] bg-[#F9FAFB] p-4">
                  <p className="text-[11px] uppercase tracking-wide text-[#9CA3AF]">
                    Joined
                  </p>
                  <p className="mt-1 text-[13px] text-[#374151]">
                    {formatDate(selectedUser.joinedAt)}
                  </p>
                </div>

                <div className="rounded-[10px] bg-[#F9FAFB] p-4">
                  <p className="text-[11px] uppercase tracking-wide text-[#9CA3AF]">
                    Last Active
                  </p>
                  <p className="mt-1 text-[13px] text-[#374151]">
                    {formatLastActive(selectedUser.lastActiveAt)}
                  </p>
                </div>
              </div>

              {/* Suspend */}
              <div className="mt-6 pt-5 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  disabled={actionLoading === selectedUser.id}
                  onClick={() =>
                    handleStatusChange(
                      selectedUser.id,
                      selectedUser.isBlocked
                        ? "ACTIVE"
                        : "BLOCKED",
                    )
                  }
                  className={`w-full h-10 rounded-[9px] flex items-center justify-center gap-2 text-[13px] font-semibold transition-colors disabled:opacity-50 ${
                    selectedUser.isBlocked
                      ? "bg-[#DCFCE7] text-[#15803D] hover:bg-[#BBF7D0]"
                      : "bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA]"
                  }`}
                >
                  {selectedUser.isBlocked ? (
                    <>
                      <CheckCircle className="size-4" />
                      Activate User
                    </>
                  ) : (
                    <>
                      <Ban className="size-4" />
                      Suspend User
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}