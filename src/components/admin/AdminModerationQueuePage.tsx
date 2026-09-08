"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAdminModerationQueue,
  reviewAdminModeration,
  type AdminModerationItem,
} from "../../lib/api/admin";
import { AdminConfirmModal } from "./AdminConfirmModal";

function riskClass(score: number) {
  if (score >= 70) return "bg-[#FEE2E2] text-[#DC2626]";
  if (score >= 40) return "bg-[#FFEDD5] text-[#C2410C]";
  return "bg-[#DCFCE7] text-[#15803D]";
}

export default function AdminModerationQueuePage() {
  const [items, setItems] = useState<AdminModerationItem[]>([]);
  const [stats, setStats] = useState({ open: 0, reviewing: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("OPEN");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [pending, setPending] = useState<{ id: string; action: "HIDE" | "REMOVE" | "RESTORE" | "DISMISS" } | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminModerationQueue({ page, search, status });
      setItems(response.items ?? []);
      setStats(response.stats);
      setPages(response.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 250);
    return () => clearTimeout(timer);
  }, [page, search, status]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[20px] font-semibold text-[#171D1C]">Moderation Queue</h1>
        <p className="mt-1 text-[14px] text-[#6B7280]">
          Automated risk scoring plus reported content, ordered by highest risk first.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          ["Open", stats.open],
          ["Reviewing", stats.reviewing],
          ["Resolved", stats.resolved],
        ].map(([label, value]) => (
          <div key={String(label)} className="bg-white rounded-[12px] border border-[#E5E7EB] px-4 py-3">
            <p className="text-[12px] text-[#6B7280]">{label}</p>
            <p className="mt-1 text-[18px] font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 flex flex-col lg:flex-row gap-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search snippet, reason, or username"
          className="flex-1 h-10 rounded-[10px] border border-[#E5E7EB] px-3 text-[14px]"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="h-10 rounded-[10px] border border-[#E5E7EB] px-3 text-[14px]"
        >
          <option value="OPEN">Open</option>
          <option value="REVIEWING">Reviewing</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
          <option value="ALL">All</option>
        </select>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#6B7280]">Loading queue...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-[#6B7280]">Queue is clear.</div>
        ) : (
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                {["RISK", "TYPE", "AUTHOR", "SNIPPET", "SOURCE", "ACTIONS"].map((heading) => (
                  <th key={heading} className="text-left px-5 py-3 text-[12px] font-semibold text-[#6B7280]">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-[#F0F0F0]">
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[12px] font-medium ${riskClass(item.riskScore)}`}>
                      {item.riskScore}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[13px]">{item.targetType}</td>
                  <td className="px-5 py-4 text-[13px]">
                    {item.author ? (
                      <Link href={`/admin/users/${item.author.username}`} className="text-[#00696F]">
                        @{item.author.username}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-4 text-[13px] max-w-[280px] truncate">{item.snippet || item.reason}</td>
                  <td className="px-5 py-4 text-[12px] text-[#6B7280]">{item.source}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setPending({ id: item.id, action: "HIDE" })} className="h-8 px-3 rounded-[8px] border text-[12px]">
                        Hide
                      </button>
                      <button type="button" onClick={() => setPending({ id: item.id, action: "REMOVE" })} className="h-8 px-3 rounded-[8px] bg-[#FEE2E2] text-[#DC2626] text-[12px] font-medium">
                        Remove
                      </button>
                      <button type="button" onClick={() => setPending({ id: item.id, action: "DISMISS" })} className="h-8 px-3 rounded-[8px] border text-[12px]">
                        Dismiss
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-5 py-4 flex justify-end gap-2 border-t border-[#E5E7EB]">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="h-8 px-3 rounded-[8px] border disabled:opacity-40">
            Prev
          </button>
          <span className="text-[13px] py-1">{page} / {pages}</span>
          <button type="button" disabled={page >= pages} onClick={() => setPage((current) => current + 1)} className="h-8 px-3 rounded-[8px] border disabled:opacity-40">
            Next
          </button>
        </div>
      </div>

      {pending ? (
        <AdminConfirmModal
          title={`${pending.action} content`}
          description="Record the moderation decision. Hidden and removed content leaves the public feed."
          confirmLabel="Apply"
          requireReason
          tone={pending.action === "REMOVE" ? "danger" : "warning"}
          onClose={() => setPending(null)}
          onConfirm={async (reason) => {
            await reviewAdminModeration(pending.id, pending.action, reason);
            setPending(null);
            await load();
          }}
        />
      ) : null}
    </div>
  );
}
