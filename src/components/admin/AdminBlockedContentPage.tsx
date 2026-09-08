"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAdminBlockedContent,
  restoreAdminBlockedContent,
  type AdminBlockedItem,
} from "../../lib/api/admin";
import { AdminConfirmModal } from "./AdminConfirmModal";

export default function AdminBlockedContentPage() {
  const [items, setItems] = useState<AdminBlockedItem[]>([]);
  const [stats, setStats] = useState({ total: 0, hidden: 0, removed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [pending, setPending] = useState<AdminBlockedItem | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminBlockedContent({ page, search, type });
      setItems(response.items ?? []);
      setStats(response.stats);
      setPages(response.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load blocked content");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 250);
    return () => clearTimeout(timer);
  }, [page, search, type]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[20px] font-semibold text-[#171D1C]">Blocked Content</h1>
        <p className="mt-1 text-[14px] text-[#6B7280]">
          Hidden and removed posts, comments, stories, and videos.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          ["Total", stats.total],
          ["Hidden", stats.hidden],
          ["Removed", stats.removed],
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
          placeholder="Search content"
          className="flex-1 h-10 rounded-[10px] border border-[#E5E7EB] px-3 text-[14px]"
        />
        <select
          value={type}
          onChange={(event) => {
            setType(event.target.value);
            setPage(1);
          }}
          className="h-10 rounded-[10px] border border-[#E5E7EB] px-3 text-[14px]"
        >
          <option value="ALL">All types</option>
          <option value="POST">Posts</option>
          <option value="COMMENT">Comments</option>
          <option value="STORY">Stories</option>
          <option value="VIDEO">Videos</option>
        </select>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#6B7280]">Loading...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-[#6B7280]">No blocked content.</div>
        ) : (
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                {["TYPE", "AUTHOR", "CONTENT", "STATE", "REASON", "ACTIONS"].map((heading) => (
                  <th key={heading} className="text-left px-5 py-3 text-[12px] font-semibold text-[#6B7280]">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.targetType}-${item.id}`} className="border-b border-[#F0F0F0]">
                  <td className="px-5 py-4 text-[13px]">{item.targetType}</td>
                  <td className="px-5 py-4 text-[13px]">
                    <Link href={`/admin/users/${item.username}`} className="text-[#00696F]">
                      @{item.username}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-[13px] max-w-[280px] truncate">{item.body || "—"}</td>
                  <td className="px-5 py-4 text-[12px] font-medium">{item.state}</td>
                  <td className="px-5 py-4 text-[12px] text-[#6B7280] max-w-[220px] truncate">{item.reason || "—"}</td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setPending(item)}
                      className="h-8 px-3 rounded-[8px] bg-[#DCFCE7] text-[#15803D] text-[12px] font-medium"
                    >
                      Restore
                    </button>
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
          title={`Restore ${pending.targetType.toLowerCase()}`}
          description="Restored content becomes visible again on the platform."
          confirmLabel="Restore"
          requireReason
          tone="neutral"
          onClose={() => setPending(null)}
          onConfirm={async (reason) => {
            await restoreAdminBlockedContent(pending.targetType, pending.id, reason);
            setPending(null);
            await load();
          }}
        />
      ) : null}
    </div>
  );
}
