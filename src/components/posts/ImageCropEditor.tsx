"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cropImageToFile, clampFeedAspect, FEED_MAX_ASPECT, loadImageFromSrc } from "../../lib/media";

export type ImageFormat = "original" | "square" | "portrait" | "landscape";

const FORMATS: { id: ImageFormat; label: string; hint: string; ratio: number | null }[] = [
  { id: "original", label: "Original", hint: "Fit to feed", ratio: null },
  { id: "square", label: "Square", hint: "1:1", ratio: 1 },
  { id: "portrait", label: "Portrait", hint: "4:5", ratio: 4 / 5 },
  { id: "landscape", label: "Landscape", hint: "1.91:1", ratio: FEED_MAX_ASPECT },
];

type Frame = { x: number; y: number; w: number; h: number };

function cropFrame(
  containerW: number,
  containerH: number,
  aspect: number,
): Frame {
  const pad = 28;
  const maxW = Math.max(80, containerW - pad * 2);
  const maxH = Math.max(80, containerH - pad * 2);
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  return {
    x: (containerW - w) / 2,
    y: (containerH - h) / 2,
    w,
    h,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function ImageCropEditor({
  src,
  fileName = "photo.jpg",
  onApply,
  onClose,
}: {
  src: string;
  fileName?: string;
  onApply: (file: File) => void;
  onClose: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [format, setFormat] = useState<ImageFormat>("original");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadImageFromSrc(src)
      .then((loaded) => {
        if (!cancelled) setImage(loaded);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to open image.");
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((current) => clamp(current + (event.deltaY > 0 ? -0.08 : 0.08), 1, 3));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      observer.disconnect();
      el.removeEventListener("wheel", onWheel);
    };
  }, [image]);

  const aspect = useMemo(() => {
    const preset = FORMATS.find((item) => item.id === format)?.ratio;
    if (preset) return preset;
    if (image) return clampFeedAspect(image.naturalWidth, image.naturalHeight);
    return 1;
  }, [format, image]);

  const frame = useMemo(
    () => (size.w && size.h ? cropFrame(size.w, size.h, aspect) : { x: 0, y: 0, w: 0, h: 0 }),
    [size, aspect],
  );

  const layout = useMemo(() => {
    if (!image || !frame.w) {
      return { width: 0, height: 0, left: 0, top: 0, maxX: 0, maxY: 0 };
    }
    const cover = Math.max(frame.w / image.naturalWidth, frame.h / image.naturalHeight);
    const width = image.naturalWidth * cover * zoom;
    const height = image.naturalHeight * cover * zoom;
    const maxX = Math.max(0, (width - frame.w) / 2);
    const maxY = Math.max(0, (height - frame.h) / 2);
    const ox = clamp(offset.x, -maxX, maxX);
    const oy = clamp(offset.y, -maxY, maxY);
    return {
      width,
      height,
      left: frame.x + frame.w / 2 - width / 2 + ox,
      top: frame.y + frame.h / 2 - height / 2 + oy,
      maxX,
      maxY,
    };
  }, [image, frame, zoom, offset]);

  useEffect(() => {
    setOffset((current) => {
      const x = clamp(current.x, -layout.maxX, layout.maxX);
      const y = clamp(current.y, -layout.maxY, layout.maxY);
      if (x === current.x && y === current.y) return current;
      return { x, y };
    });
  }, [layout.maxX, layout.maxY]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    setOffset({
      x: clamp(drag.ox + (event.clientX - drag.x), -layout.maxX, layout.maxX),
      y: clamp(drag.oy + (event.clientY - drag.y), -layout.maxY, layout.maxY),
    });
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const apply = useCallback(async () => {
    if (!image || !frame.w || working) return;
    setWorking(true);
    setError("");
    try {
      const crop = {
        x: ((frame.x - layout.left) / layout.width) * image.naturalWidth,
        y: ((frame.y - layout.top) / layout.height) * image.naturalHeight,
        width: (frame.w / layout.width) * image.naturalWidth,
        height: (frame.h / layout.height) * image.naturalHeight,
      };
      onApply(await cropImageToFile(image, crop, fileName));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to crop image.");
      setWorking(false);
    }
  }, [image, frame, layout, working, fileName, onApply]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-3 py-6">
      <div className="flex w-full max-w-[560px] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h3 className="text-[16px] font-bold text-[#111827]">Crop photo</h3>
            <p className="text-[12px] text-[#6B7280]">Portrait 4:5 · Square · Landscape 1.91:1. Drag to reframe.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full text-[18px] text-[#6B7280] hover:bg-[#F3F4F6]"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 px-4 pb-3">
          {FORMATS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setFormat(item.id);
                setOffset({ x: 0, y: 0 });
                setZoom(1);
              }}
              className={`flex flex-col items-center gap-1 rounded-[10px] border px-1 py-2 ${
                format === item.id
                  ? "border-[#00696F] bg-[#EFF4FF] text-[#00696F]"
                  : "border-[#E5E7EB] text-[#4B5563]"
              }`}
            >
              <span
                className={`border-2 ${format === item.id ? "border-[#00696F]" : "border-current"} ${
                  item.id === "portrait"
                    ? "h-7 w-5"
                    : item.id === "landscape"
                      ? "h-4 w-8"
                      : item.id === "square"
                        ? "size-6"
                        : "h-5 w-7"
                }`}
              />
              <span className="text-[11px] font-semibold">{item.label}</span>
              <span className="text-[10px] text-[#6B7280]">{item.hint}</span>
            </button>
          ))}
        </div>

        <div
          ref={stageRef}
          className="relative mx-4 h-[360px] cursor-grab touch-none overflow-hidden rounded-[12px] bg-[#111827] active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {image ? (
            <img
              src={src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute max-w-none select-none"
              style={{
                left: layout.left,
                top: layout.top,
                width: layout.width,
                height: layout.height,
              }}
            />
          ) : (
            <p className="absolute inset-0 flex items-center justify-center text-[13px] text-white/70">
              Loading photo…
            </p>
          )}
          {frame.w ? (
            <div
              className="pointer-events-none absolute rounded-[4px] border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
              style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }}
            />
          ) : null}
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          <span className="w-10 text-[12px] font-semibold text-[#6B7280]">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="h-1.5 flex-1 accent-[#00696F]"
          />
        </div>

        {error ? <p className="px-4 pb-2 text-[13px] text-red-600">{error}</p> : null}

        <div className="flex items-center justify-end gap-2 border-t border-[#F3F4F6] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-[14px] font-semibold text-[#4B5563] hover:bg-[#F3F4F6]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!image || working}
            onClick={() => void apply()}
            className="rounded-lg bg-[#00696F] px-5 py-2 text-[14px] font-bold text-white disabled:opacity-50"
          >
            {working ? "Saving…" : "Apply crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
