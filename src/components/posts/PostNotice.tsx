"use client";

import { useEffect, useState } from "react";

const EVENT = "chattm:post-notice";
export function announcePostSuccess(message: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }));
}

export default function PostNotice() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    const receive = (event: Event) => setMessage((event as CustomEvent<string>).detail);
    window.addEventListener(EVENT, receive);
    return () => window.removeEventListener(EVENT, receive);
  }, []);
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 6000);
    return () => window.clearTimeout(timeout);
  }, [message]);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-3 top-20 z-[150] mx-auto max-w-md">
      {message ? <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-[#BBC9CA] bg-white px-4 py-3 text-sm text-[#00696F] shadow-sm">
        <span className="flex-1 font-medium">{message}</span>
        <button type="button" onClick={() => setMessage("")} aria-label="Dismiss notification" className="flex size-9 items-center justify-center rounded-full hover:bg-[#EFF4FF]">×</button>
      </div> : null}
    </div>
  );
}
