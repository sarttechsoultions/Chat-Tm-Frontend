"use client";

import React, { useState } from "react";

export function AdminConfirmModal({
  title,
  description,
  confirmLabel,
  tone = "danger",
  requireReason = false,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "warning" | "neutral";
  requireReason?: boolean;
  onConfirm: (reason: string) => Promise<void> | void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const confirmClass =
    tone === "danger"
      ? "bg-[#DC2626] hover:bg-[#B91C1C] text-white"
      : tone === "warning"
        ? "bg-[#EA580C] hover:bg-[#C2410C] text-white"
        : "bg-[#00696F] hover:bg-[#00575C] text-white";

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white rounded-[16px] shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-[16px] font-semibold text-[#171D1C]">{title}</h2>
          <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">{description}</p>
        </div>

        <form
          className="p-5 flex flex-col gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (requireReason && !reason.trim()) {
              setError("A reason is required.");
              return;
            }

            try {
              setLoading(true);
              setError("");
              await onConfirm(reason.trim());
            } catch (err) {
              setError(err instanceof Error ? err.message : "Action failed");
              setLoading(false);
            }
          }}
        >
          {requireReason ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[#374151]">Reason</span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                required
                placeholder="Explain why this action is being taken"
                className="rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-[13px] text-[#111827] outline-none focus:border-[#00696F]"
              />
            </label>
          ) : null}

          {error ? <p className="text-[13px] text-[#DC2626]">{error}</p> : null}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-[10px] border border-[#E5E7EB] text-[13px] font-medium text-[#4B5563] hover:bg-[#F9FAFB]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`h-10 px-4 rounded-[10px] text-[13px] font-semibold disabled:opacity-50 ${confirmClass}`}
            >
              {loading ? "Working..." : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
