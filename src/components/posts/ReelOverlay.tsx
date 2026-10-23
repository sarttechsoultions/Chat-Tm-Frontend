"use client";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

const subscribe = (listener: () => void) => {
  const media = window.matchMedia("(min-width: 768px)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
};
export default function ReelOverlay({ children, onClose, label, sidePanel = false }: {children: ReactNode; onClose: () => void; label: string; sidePanel?: boolean}) {
  const desktop = useSyncExternalStore(subscribe, () => window.matchMedia("(min-width: 768px)").matches, () => false);
  if (sidePanel && desktop) return <aside aria-label={label} className="flex min-h-0 w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#E4EBEC] bg-white shadow-sm lg:w-[360px]">{children}</aside>;
  return <ReelSheet label={label} onClose={onClose} desktop={desktop}>{children}</ReelSheet>;
}
function ReelSheet({children,onClose,label,desktop}:{children:ReactNode;onClose:()=>void;label:string;desktop:boolean}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={ref} aria-label={label} onCancel={event => {event.preventDefault();onClose();}} onClick={event => {if(event.target === event.currentTarget){const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)onClose();}}} className={desktop ? "fixed inset-0 m-auto h-[min(720px,85dvh)] max-h-[85dvh] w-[540px] max-w-[calc(100%_-_2rem)] overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-black/45" : "fixed inset-x-0 bottom-0 top-auto m-0 h-[56dvh] max-h-[70dvh] w-full max-w-none overflow-hidden rounded-t-3xl border-0 bg-white p-0 shadow-2xl backdrop:bg-black/45"}>
    <div className="flex h-full min-h-0 flex-col text-[#0B1C30]">{!desktop && <div aria-hidden="true" className="mx-auto mb-1 mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-300"/>}{children}</div>
  </dialog>;
}
