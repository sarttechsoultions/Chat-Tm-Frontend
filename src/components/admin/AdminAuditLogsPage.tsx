"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { getAdminAuditLogs, type AdminAuditLog } from "../../lib/api/admin";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  async function loadLogs() {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminAuditLogs({ page, search, limit: 20 });
      setLogs(response.logs ?? []);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadLogs();
    }, 250);
    return () => clearTimeout(timer);
  }, [page, search]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[20px] font-semibold text-[#171D1C]">Audit Logs</h1>
        <p className="mt-1 text-[14px] text-[#6B7280]">
          Every sensitive admin action, including actor, target, reason, and outcome.
        </p>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4">
        <div className="h-10 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 flex items-center gap-2">
          <Search className="size-4 text-[#9CA3AF]" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search action, username, reason, or target"
            className="flex-1 bg-transparent outline-none text-[14px]"
          />
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#6B7280]">Loading logs...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-[#6B7280]">No audit events yet.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    {["TIME", "ACTOR", "ACTION", "TARGET", "REASON", "OUTCOME"].map((heading) => (
                      <th key={heading} className="text-left px-5 py-3 text-[12px] font-semibold text-[#6B7280]">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-[#F0F0F0]">
                      <td className="px-5 py-4 text-[12px] text-[#6B7280] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4 text-[13px] font-medium text-[#171D1C]">
                        @{log.actor.username}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#00696F]">{log.action}</td>
                      <td className="px-5 py-4 text-[12px] text-[#6B7280]">
                        {log.targetType}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151] max-w-[320px] truncate">
                        {log.reason || "—"}
                      </td>
                      <td className="px-5 py-4 text-[12px] font-medium text-[#15803D]">{log.outcome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 flex items-center justify-between border-t border-[#E5E7EB]">
              <p className="text-[13px] text-[#6B7280]">
                Showing {logs.length} of {pagination.total}
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
    </div>
  );
}
