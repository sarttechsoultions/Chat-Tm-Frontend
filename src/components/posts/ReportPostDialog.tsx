"use client";

import { useEffect, useRef, useState } from "react";
import { POST_REPORT_REASONS, reportPost, type PostReportReason } from "../../lib/api/posts";

export default function ReportPostDialog({ postId, onClose }: { postId: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const busyRef = useRef(false);
  const [reason, setReason] = useState<PostReportReason | "">("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<{ alreadyReported: boolean } | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    const viewport = window.visualViewport;
    const fit = () => {
      if (!dialog || !viewport) return;
      dialog.style.maxHeight = `${Math.max(180, viewport.height - 24)}px`;
      dialog.style.top = `${viewport.offsetTop}px`;
      dialog.style.bottom = `${Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height)}px`;
    };
    fit();
    viewport?.addEventListener("resize", fit);
    viewport?.addEventListener("scroll", fit);
    return () => {
      viewport?.removeEventListener("resize", fit);
      viewport?.removeEventListener("scroll", fit);
      dialog?.close();
    };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason || busyRef.current) return;
    if (reason === "OTHER" && details.trim().length < 10) {
      setError("Please add at least 10 characters to describe the issue.");
      return;
    }
    busyRef.current = true;
    setSubmitting(true);
    setError("");
    try { setReceipt(await reportPost(postId, reason, details.trim())); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't submit your report. Please try again."); }
    finally { busyRef.current = false; setSubmitting(false); }
  }

  return (
    <dialog ref={dialogRef} aria-labelledby="report-post-title"
      onCancel={event => { event.preventDefault(); if (!busyRef.current) onClose(); }}
      onClick={event => {
        if (event.target !== event.currentTarget || busyRef.current) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-[#E5E7EB] bg-white p-5 text-[#111827] backdrop:bg-black/50 sm:p-6">
      <header className="sticky top-0 z-10 mb-4 flex items-start justify-between gap-3 bg-white pb-2">
        <div>
          <h2 id="report-post-title" className="text-lg font-bold">{receipt ? "Report received" : "Report post"}</h2>
          <p className="mt-1 text-sm text-[#6B7280]">{receipt ? "Thank you for helping keep ChatTm safe." : "Tell us what's wrong with this post."}</p>
        </div>
        <button type="button" disabled={submitting} onClick={onClose} aria-label="Close report" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-xl disabled:opacity-50">×</button>
      </header>
      {receipt ? <div>
        <p role="status" className="rounded-lg bg-[#EFF4FF] p-3 text-sm leading-6 text-[#00696F]">
          {receipt.alreadyReported ? "You've already reported this post. Your report is awaiting review." : "Your report has been added to the moderation queue for review."}
        </p>
        <p className="mt-3 text-sm leading-6 text-[#6B7280]">You can also hide the post from your feed using the post options menu.</p>
        <button type="button" onClick={onClose} className="mt-5 min-h-11 w-full rounded-lg bg-[#00696F] px-4 py-2 font-semibold text-white">Done</button>
      </div> : <form onSubmit={event => void submit(event)}>
        <fieldset disabled={submitting} className="min-w-0">
          <legend className="mb-2 text-sm font-semibold">Reason for reporting</legend>
          <div className="flex flex-col gap-1">
            {POST_REPORT_REASONS.map(option => <label key={option.value} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm ${reason === option.value ? "border-[#00696F] bg-[#F0F8F8]" : "border-[#E5E7EB] hover:bg-[#F9FAFB]"}`}>
              <input type="radio" name="report-reason" value={option.value} checked={reason === option.value} onChange={() => setReason(option.value)} className="size-4 accent-[#00696F]" required />
              {option.label}
            </label>)}
          </div>
          <label htmlFor="post-report-details" className="mt-4 block text-sm font-medium">{reason === "OTHER" ? "Describe the issue (required)" : "Additional details (optional)"}</label>
          <textarea id="post-report-details" value={details} onChange={event => setDetails(event.target.value)} maxLength={1000} rows={3} className="mt-2 w-full rounded-lg border border-[#D1D5DB] p-3 text-base outline-none focus:border-[#00696F] sm:text-sm" />
          <p className="mt-1 text-right text-xs text-[#6B7280]">{details.length}/1000</p>
        </fieldset>
        {error ? <p role="alert" className="mt-3 text-sm text-red-600">{error}<span className="block">Your selections are still here.</span></p> : null}
        <button type="submit" disabled={!reason || submitting} className="mt-4 min-h-11 w-full rounded-lg bg-[#00696F] px-4 py-2 font-semibold text-white disabled:opacity-50">{submitting ? "Submitting…" : error ? "Try submitting again" : "Submit report"}</button>
      </form>}
    </dialog>
  );
}
