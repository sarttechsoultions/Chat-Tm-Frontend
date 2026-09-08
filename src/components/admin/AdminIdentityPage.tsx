"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAdminKycCases,
  getAdminVerification,
  grantAdminVerification,
  reviewAdminKyc,
  reviewAdminVerification,
  setAdminVerificationBadge,
  type AdminKycCase,
  type AdminVerificationApp,
} from "../../lib/api/admin";
import { AdminConfirmModal } from "./AdminConfirmModal";

function riskClass(level: string) {
  if (level === "HIGH") return "bg-[#FEE2E2] text-[#DC2626]";
  if (level === "MEDIUM") return "bg-[#FFEDD5] text-[#C2410C]";
  return "bg-[#DCFCE7] text-[#15803D]";
}

export default function AdminIdentityPage() {
  const [tab, setTab] = useState<"kyc" | "badge">("kyc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [queue, setQueue] = useState("MANUAL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cases, setCases] = useState<AdminKycCase[]>([]);
  const [kycStats, setKycStats] = useState({
    manualReview: 0,
    approved: 0,
    rejected: 0,
    resubmissionRequired: 0,
  });
  const [canViewDocuments, setCanViewDocuments] = useState(false);
  const [kycPages, setKycPages] = useState(1);
  const [selected, setSelected] = useState<AdminKycCase | null>(null);
  const [apps, setApps] = useState<AdminVerificationApp[]>([]);
  const [badgeStats, setBadgeStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    revoked: 0,
    verifiedUsers: 0,
  });
  const [badgeStatus, setBadgeStatus] = useState("PENDING");
  const [grantUser, setGrantUser] = useState("");
  const [pending, setPending] = useState<{
    type: "KYC" | "BADGE" | "GRANT" | "REVOKE";
    action: string;
    id: string;
    extra?: boolean;
  } | null>(null);
  const [correction, setCorrection] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      if (tab === "kyc") {
        const response = await getAdminKycCases({ page, search, queue });
        setCases(response.cases ?? []);
        setKycStats(response.stats);
        setCanViewDocuments(response.canViewDocuments);
        setKycPages(response.pagination.totalPages);
      } else {
        const response = await getAdminVerification({ page, search, status: badgeStatus });
        setApps(response.applications ?? []);
        setBadgeStats(response.stats);
        setKycPages(response.pagination.totalPages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load identity data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 250);
    return () => clearTimeout(timer);
  }, [tab, page, search, queue, badgeStatus]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[20px] font-semibold text-[#171D1C]">KYC / Verification</h1>
        <p className="mt-1 text-[14px] text-[#6B7280]">
          Identity checks stay separate from public verification badges. Only failed or suspicious KYC cases enter this queue.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setTab("kyc");
            setPage(1);
          }}
          className={`h-10 px-4 rounded-[10px] text-[13px] font-semibold ${tab === "kyc" ? "bg-[#00696F] text-white" : "bg-white border border-[#E5E7EB] text-[#4B5563]"}`}
        >
          Identity KYC
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("badge");
            setPage(1);
          }}
          className={`h-10 px-4 rounded-[10px] text-[13px] font-semibold ${tab === "badge" ? "bg-[#00696F] text-white" : "bg-white border border-[#E5E7EB] text-[#4B5563]"}`}
        >
          Verification badges
        </button>
      </div>

      {tab === "kyc" ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            ["Manual review", kycStats.manualReview],
            ["Approved", kycStats.approved],
            ["Rejected", kycStats.rejected],
            ["Resubmission", kycStats.resubmissionRequired],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-white rounded-[12px] border border-[#E5E7EB] px-4 py-3">
              <p className="text-[12px] text-[#6B7280]">{label}</p>
              <p className="mt-1 text-[18px] font-semibold">{value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
          {[
            ["Pending", badgeStats.pending],
            ["Approved", badgeStats.approved],
            ["Rejected", badgeStats.rejected],
            ["Revoked", badgeStats.revoked],
            ["Live badges", badgeStats.verifiedUsers],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-white rounded-[12px] border border-[#E5E7EB] px-4 py-3">
              <p className="text-[12px] text-[#6B7280]">{label}</p>
              <p className="mt-1 text-[18px] font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 flex flex-col lg:flex-row gap-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search username"
          className="flex-1 h-10 rounded-[10px] border border-[#E5E7EB] px-3 text-[14px]"
        />
        {tab === "kyc" ? (
          <select
            value={queue}
            onChange={(event) => {
              setQueue(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-[10px] border border-[#E5E7EB] px-3 text-[14px]"
          >
            <option value="MANUAL">Manual review queue</option>
            <option value="ALL">All cases</option>
          </select>
        ) : (
          <select
            value={badgeStatus}
            onChange={(event) => {
              setBadgeStatus(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-[10px] border border-[#E5E7EB] px-3 text-[14px]"
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="REVOKED">Revoked</option>
            <option value="ALL">All</option>
          </select>
        )}
      </div>

      {tab === "badge" ? (
        <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 flex flex-col sm:flex-row gap-3">
          <input
            value={grantUser}
            onChange={(event) => setGrantUser(event.target.value)}
            placeholder="Grant badge to username"
            className="flex-1 h-10 rounded-[10px] border border-[#E5E7EB] px-3 text-[14px]"
          />
          <button
            type="button"
            onClick={() => setPending({ type: "GRANT", action: "GRANT", id: grantUser.trim() })}
            className="h-10 px-4 rounded-[10px] bg-[#00696F] text-white text-[13px] font-semibold"
          >
            Grant badge
          </button>
        </div>
      ) : null}

      <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#6B7280]">Loading...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">{error}</div>
        ) : tab === "kyc" && cases.length === 0 ? (
          <div className="p-10 text-center text-[#6B7280]">No KYC exception cases in this queue.</div>
        ) : tab === "badge" && apps.length === 0 ? (
          <div className="p-10 text-center text-[#6B7280]">No verification applications.</div>
        ) : tab === "kyc" ? (
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                {["USER", "DOCUMENT", "RISK", "PROVIDER", "STATUS", "ACTIONS"].map((heading) => (
                  <th key={heading} className="text-left px-5 py-3 text-[12px] font-semibold text-[#6B7280]">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => (
                <tr key={item.id} className="border-b border-[#F0F0F0]">
                  <td className="px-5 py-4">
                    <Link href={`/admin/users/${item.user.username}`} className="text-[13px] font-semibold text-[#00696F]">
                      @{item.user.username}
                    </Link>
                    <p className="text-[12px] text-[#6B7280]">{item.user.name}</p>
                  </td>
                  <td className="px-5 py-4 text-[13px]">{item.documentType || "—"}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[12px] font-medium ${riskClass(item.riskLevel)}`}>
                      {item.riskLevel} · {item.riskScore}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[12px] text-[#6B7280]">{item.autoDecision}</td>
                  <td className="px-5 py-4 text-[12px] font-medium">{item.status.replaceAll("_", " ")}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setSelected(item)} className="h-8 px-3 rounded-[8px] border text-[12px]">
                        Review
                      </button>
                      <button type="button" onClick={() => setPending({ type: "KYC", action: "APPROVE", id: item.id })} className="h-8 px-3 rounded-[8px] bg-[#DCFCE7] text-[#15803D] text-[12px] font-medium">
                        Approve
                      </button>
                      <button type="button" onClick={() => setPending({ type: "KYC", action: "REJECT", id: item.id, extra: true })} className="h-8 px-3 rounded-[8px] bg-[#FEE2E2] text-[#DC2626] text-[12px] font-medium">
                        Reject
                      </button>
                      <button type="button" onClick={() => setPending({ type: "KYC", action: "RESUBMIT", id: item.id, extra: true })} className="h-8 px-3 rounded-[8px] border text-[12px]">
                        Resubmit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                {["USER", "CATEGORY", "STATEMENT", "STATUS", "ACTIONS"].map((heading) => (
                  <th key={heading} className="text-left px-5 py-3 text-[12px] font-semibold text-[#6B7280]">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map((item) => (
                <tr key={item.id} className="border-b border-[#F0F0F0]">
                  <td className="px-5 py-4">
                    <Link href={`/admin/users/${item.user.username}`} className="text-[13px] font-semibold text-[#00696F]">
                      @{item.user.username}
                    </Link>
                    {item.user.isVerified ? (
                      <p className="text-[11px] text-[#15803D]">Badge active</p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-[13px]">{item.category}</td>
                  <td className="px-5 py-4 text-[13px] max-w-[280px] truncate">{item.statement || "—"}</td>
                  <td className="px-5 py-4 text-[12px]">{item.status}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {item.status === "PENDING" ? (
                        <>
                          <button type="button" onClick={() => setPending({ type: "BADGE", action: "APPROVE", id: item.id })} className="h-8 px-3 rounded-[8px] bg-[#DCFCE7] text-[#15803D] text-[12px] font-medium">
                            Approve
                          </button>
                          <button type="button" onClick={() => setPending({ type: "BADGE", action: "REJECT", id: item.id })} className="h-8 px-3 rounded-[8px] bg-[#FEE2E2] text-[#DC2626] text-[12px] font-medium">
                            Reject
                          </button>
                        </>
                      ) : item.user.isVerified ? (
                        <button type="button" onClick={() => setPending({ type: "REVOKE", action: "REVOKE", id: item.user.username })} className="h-8 px-3 rounded-[8px] border text-[12px]">
                          Revoke
                        </button>
                      ) : (
                        <button type="button" onClick={() => setPending({ type: "REVOKE", action: "RESTORE", id: item.user.username })} className="h-8 px-3 rounded-[8px] border text-[12px]">
                          Restore
                        </button>
                      )}
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
          <span className="text-[13px] py-1">{page} / {kycPages}</span>
          <button type="button" disabled={page >= kycPages} onClick={() => setPage((current) => current + 1)} className="h-8 px-3 rounded-[8px] border disabled:opacity-40">
            Next
          </button>
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-[560px] bg-white rounded-[16px] overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="text-[16px] font-semibold">KYC review · @{selected.user.username}</h2>
              <button type="button" onClick={() => setSelected(null)} className="text-[13px] text-[#6B7280]">
                Close
              </button>
            </div>
            <div className="p-5 flex flex-col gap-3 text-[13px]">
              <p>{selected.providerSummary}</p>
              <p>Authenticity: {selected.documentAuthentic ? "Passed" : "Failed"} · Face match: {selected.faceMatch ? "Passed" : "Not completed"} · Liveness: {selected.livenessPerformed ? (selected.livenessPassed ? "Passed" : "Failed") : "Not performed"}</p>
              {canViewDocuments && selected.documentUrl ? (
                <a href={selected.documentUrl} target="_blank" rel="noreferrer" className="text-[#00696F] underline">
                  Open identity document
                </a>
              ) : (
                <p className="text-[#6B7280]">
                  {selected.hasDocument
                    ? "Document on file. Access is limited to KYC administrators for exception cases."
                    : "No document attached."}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {pending ? (
        <AdminConfirmModal
          title={pending.action}
          description={
            pending.type === "KYC" && pending.action === "REJECT"
              ? "Provide a reason and the correction or valid document the user must submit."
              : "This decision is written to the audit log."
          }
          confirmLabel="Confirm"
          requireReason
          tone={pending.action === "REJECT" || pending.action === "REVOKE" ? "danger" : "neutral"}
          onClose={() => {
            setPending(null);
            setCorrection("");
          }}
          onConfirm={async (reason) => {
            if (pending.type === "KYC") {
              await reviewAdminKyc(pending.id, {
                action: pending.action as "APPROVE" | "REJECT" | "RESUBMIT",
                reason,
                requiredCorrection:
                  pending.action === "REJECT" || pending.action === "RESUBMIT"
                    ? correction || reason
                    : undefined,
              });
            } else if (pending.type === "BADGE") {
              await reviewAdminVerification(pending.id, pending.action as "APPROVE" | "REJECT", reason);
            } else if (pending.type === "GRANT") {
              await grantAdminVerification(pending.id, reason);
              setGrantUser("");
            } else {
              await setAdminVerificationBadge(pending.id, pending.action as "REVOKE" | "RESTORE", reason);
            }
            setPending(null);
            setCorrection("");
            await load();
          }}
        />
      ) : null}

      {pending?.extra ? (
        <div className="fixed bottom-6 right-6 z-[70] w-[320px] bg-white border border-[#E5E7EB] rounded-[12px] p-3 shadow-lg">
          <p className="text-[12px] font-medium mb-1">Required correction</p>
          <textarea
            value={correction}
            onChange={(event) => setCorrection(event.target.value)}
            placeholder="e.g. Upload a clear passport photo"
            className="w-full h-20 rounded-[8px] border px-2 py-1 text-[12px]"
          />
        </div>
      ) : null}
    </div>
  );
}
