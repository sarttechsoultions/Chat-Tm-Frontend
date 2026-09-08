"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  getAdminReports,
  updateAdminReport,
  type AdminReport,
  type ReportStatus,
} from "../../lib/api/admin";
import { AdminConfirmModal } from "./AdminConfirmModal";

function badge(status: string) {
  if (status === "OPEN") return "bg-[#FFEDD5] text-[#C2410C]";
  if (status === "REVIEWING") return "bg-[#DBEAFE] text-[#1D4ED8]";
  if (status === "RESOLVED") return "bg-[#DCFCE7] text-[#15803D]";
  return "bg-[#F3F4F6] text-[#6B7280]";
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [stats, setStats] = useState({ open: 0, reviewing: 0, resolved: 0, dismissed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | ReportStatus>("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [pending, setPending] = useState<{
    report: AdminReport;
    status: ReportStatus;
    userAction?: "WARN" | "SUSPEND" | "BLOCK" | null;
  } | null>(null);

  async function loadReports() {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminReports({ page, search, status, limit: 10 });
      setReports(response.reports ?? []);
      setStats(response.stats);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadReports();
    }, 250);
    return () => clearTimeout(timer);
  }, [page, search, status]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[20px] font-semibold text-[#171D1C]">Reports</h1>
        <p className="mt-1 text-[14px] text-[#6B7280]">
          Central queue for user, post, and policy reports.
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          ["Open", stats.open],
          ["Reviewing", stats.reviewing],
          ["Resolved", stats.resolved],
          ["Dismissed", stats.dismissed],
        ].map(([label, value]) => (
          <div key={String(label)} className="bg-white rounded-[12px] border border-[#E5E7EB] px-4 py-3">
            <p className="text-[12px] text-[#6B7280]">{label}</p>
            <p className="mt-1 text-[18px] font-semibold text-[#171D1C]">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 flex flex-col lg:flex-row gap-3">
        <div className="flex-1 h-10 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 flex items-center gap-2">
          <Search className="size-4 text-[#9CA3AF]" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search reason, reporter, or username"
            className="flex-1 bg-transparent outline-none text-[14px]"
          />
        </div>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as typeof status);
            setPage(1);
          }}
          className="h-10 rounded-[10px] border border-[#E5E7EB] px-3 text-[14px] bg-white"
        >
          <option value="ALL">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="REVIEWING">Reviewing</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#6B7280]">Loading reports...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">{error}</div>
        ) : reports.length === 0 ? (
          <div className="p-10 text-center text-[#6B7280]">No reports found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    {["REPORTER", "TARGET", "TYPE", "REASON", "STATUS", "ACTIONS"].map((heading) => (
                      <th key={heading} className="text-left px-5 py-3 text-[12px] font-semibold text-[#6B7280]">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-b border-[#F0F0F0]">
                      <td className="px-5 py-4 text-[13px] font-medium text-[#171D1C]">@{report.reporter.username}</td>
                      <td className="px-5 py-4 text-[13px] text-[#00696F]">
                        {report.targetUser ? (
                          <Link href={`/admin/users/${report.targetUser.username}`}>@{report.targetUser.username}</Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#6B7280]">{report.targetType}</td>
                      <td className="px-5 py-4 text-[13px] text-[#374151] max-w-[280px] truncate">{report.reason}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[12px] font-medium ${badge(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {report.status === "OPEN" ? (
                            <button
                              type="button"
                              onClick={() => setPending({ report, status: "REVIEWING" })}
                              className="h-8 px-3 rounded-[8px] border border-[#E5E7EB] text-[12px] font-medium"
                            >
                              Review
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setPending({ report, status: "RESOLVED", userAction: "WARN" })}
                            className="h-8 px-3 rounded-[8px] border border-[#E5E7EB] text-[12px] font-medium"
                          >
                            Warn
                          </button>
                          <button
                            type="button"
                            onClick={() => setPending({ report, status: "RESOLVED", userAction: "SUSPEND" })}
                            className="h-8 px-3 rounded-[8px] bg-[#FFEDD5] text-[#C2410C] text-[12px] font-medium"
                          >
                            Suspend
                          </button>
                          <button
                            type="button"
                            onClick={() => setPending({ report, status: "DISMISSED" })}
                            className="h-8 px-3 rounded-[8px] border border-[#E5E7EB] text-[12px] font-medium"
                          >
                            Dismiss
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
                Showing {reports.length} of {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="size-8 rounded-[8px] border border-[#E5E7EB] flex items-center justify-center disabled:opacity-40">
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-[13px] px-2">{pagination.page} / {pagination.totalPages}</span>
                <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="size-8 rounded-[8px] border border-[#E5E7EB] flex items-center justify-center disabled:opacity-40">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {pending ? (
        <AdminConfirmModal
          title={`${pending.userAction || pending.status} report`}
          description="Record the decision. User actions are logged and applied to the reported account when a target exists."
          confirmLabel="Apply decision"
          requireReason
          tone={pending.userAction === "SUSPEND" || pending.userAction === "BLOCK" ? "danger" : "warning"}
          onClose={() => setPending(null)}
          onConfirm={async (reason) => {
            await updateAdminReport(pending.report.id, {
              status: pending.status,
              reason,
              userAction: pending.userAction || null,
            });
            setPending(null);
            await loadReports();
          }}
        />
      ) : null}
    </div>
  );
}
