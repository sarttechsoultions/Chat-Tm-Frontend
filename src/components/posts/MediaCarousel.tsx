"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CarouselMedia = {
  id: string;
  url: string;
  type: string;
};

function isVideo(type: string) {
  return type === "video" || type.includes("video");
}

function Slide({
  item,
  aspect,
}: {
  item: CarouselMedia;
  aspect: number;
}) {
  return (
    <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: String(aspect) }}>
      {isVideo(item.type) ? (
        <video src={item.url} controls className="absolute inset-0 size-full object-cover bg-black" />
      ) : (
        <img src={item.url} alt="" className="absolute inset-0 size-full object-cover" />
      )}
    </div>
  );
}

export default function MediaCarousel({
  items,
  aspect = 1,
  overlay,
  onSlideClick,
}: {
  items: CarouselMedia[];
  aspect?: number;
  overlay?: (item: CarouselMedia, index: number) => React.ReactNode;
  onSlideClick?: (item: CarouselMedia, index: number) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [items.map((item) => item.id).join("|")]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const sync = () => {
      el.scrollLeft = index * el.clientWidth;
    };
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [index]);

  function go(next: number) {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(items.length - 1, next));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setIndex(clamped);
  }

  if (!items.length) return null;

  if (items.length === 1) {
    const item = items[0];
    return (
      <div className="relative overflow-hidden rounded-[12px]">
        {onSlideClick && !isVideo(item.type) ? (
          <button type="button" className="block w-full" onClick={() => onSlideClick(item, 0)}>
            <Slide item={item} aspect={aspect} />
          </button>
        ) : (
          <Slide item={item} aspect={aspect} />
        )}
        {overlay?.(item, 0)}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[12px]">
      <div
        ref={scrollerRef}
        className="flex w-full overflow-x-auto no-scrollbar"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
        onScroll={(event) => {
          const el = event.currentTarget;
          if (!el.clientWidth) return;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {items.map((item, slideIndex) => (
          <div
            key={item.id}
            className="min-w-full max-w-full shrink-0 grow-0 basis-full"
            style={{ scrollSnapAlign: "center", scrollSnapStop: "always" }}
          >
            {onSlideClick && !isVideo(item.type) ? (
              <button
                type="button"
                className="block w-full"
                onClick={() => onSlideClick(item, slideIndex)}
              >
                <Slide item={item} aspect={aspect} />
              </button>
            ) : (
              <Slide item={item} aspect={aspect} />
            )}
            {overlay?.(item, slideIndex)}
          </div>
        ))}
      </div>

      {index > 0 ? (
        <button
          type="button"
          aria-label="Previous photo"
          onClick={() => go(index - 1)}
          className="absolute left-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white"
        >
          <ChevronLeft className="size-5" />
        </button>
      ) : null}
      {index < items.length - 1 ? (
        <button
          type="button"
          aria-label="Next photo"
          onClick={() => go(index + 1)}
          className="absolute right-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white"
        >
          <ChevronRight className="size-5" />
        </button>
      ) : null}

      <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-[12px] font-semibold text-white">
        {index + 1}/{items.length}
      </div>
      <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5">
        {items.map((item, slideIndex) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Go to photo ${slideIndex + 1}`}
            onClick={() => go(slideIndex)}
            className={`size-1.5 rounded-full ${slideIndex === index ? "bg-white" : "bg-white/45"}`}
          />
        ))}
      </div>
    </div>
  );
}
