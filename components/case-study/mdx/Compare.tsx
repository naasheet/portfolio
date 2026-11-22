"use client";

import { ChevronsLeftRight } from "lucide-react";
import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { Img } from "@/components/media/Img";
import { copy } from "@/content/copy";
import { cn } from "@/lib/utils";

type Shot = { src: string; alt: string };

export type CompareProps = {
  before: Shot;
  after: Shot;
  /** Intrinsic size of both images (they should match). Default 1600 × 1000. */
  width?: number;
  height?: number;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
};

const clamp = (v: number) => Math.min(100, Math.max(0, v));

/**
 * A before / after slider (4.5; Case study frames). The "before" image is revealed up to the
 * handle. Everything moves with transforms of one CSS variable (`--pos`, 0–100%) written straight
 * to the element: no React state while dragging. Drag anywhere on it (mouse, pen or a sideways
 * touch drag; vertical touch still scrolls), or focus the handle and use the arrow keys
 * (Shift for bigger steps), Home and End.
 */
export function Compare({
  before,
  after,
  width = 1600,
  height = 1000,
  beforeLabel = copy.caseStudy.before,
  afterLabel = copy.caseStudy.after,
  className,
}: CompareProps) {
  const root = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const pos = useRef(50);

  const set = (v: number) => {
    pos.current = clamp(v);
    root.current?.style.setProperty("--pos", `${pos.current}%`);
    handle.current?.setAttribute(
      "aria-valuenow",
      String(Math.round(pos.current)),
    );
  };

  const fromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    set(((e.clientX - r.left) / r.width) * 100);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    const next =
      e.key === "ArrowLeft" || e.key === "ArrowDown"
        ? pos.current - step
        : e.key === "ArrowRight" || e.key === "ArrowUp"
          ? pos.current + step
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? 100
              : null;
    if (next === null) return;
    e.preventDefault();
    set(next);
  };

  return (
    <div
      ref={root}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        fromPointer(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e);
      }}
      className={cn(
        "relative cursor-ew-resize touch-pan-y overflow-hidden rounded-card border border-border-default bg-surface-glass select-none [--pos:50%]",
        className,
      )}
    >
      <Img
        src={after.src}
        alt={after.alt}
        width={width}
        height={height}
        sizes="(min-width: 1024px) 720px, 100vw"
      />

      {/* Before: a full-size layer slid left so its right edge sits at the handle; its content
          slides back by the same amount, so the image itself stays put. */}
      <div className="absolute inset-0 [transform:translateX(calc(var(--pos)-100%))] overflow-hidden">
        <div className="absolute inset-0 [transform:translateX(calc(100%-var(--pos)))]">
          <Img
            src={before.src}
            alt={before.alt}
            width={width}
            height={height}
            sizes="(min-width: 1024px) 720px, 100vw"
            className="h-full"
          />
        </div>
      </div>

      <span className="pointer-events-none absolute top-3 left-3 rounded-chip bg-island-bg/80 px-3 py-1 text-caption-1 text-island-text">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute top-3 right-3 rounded-chip bg-island-bg/80 px-3 py-1 text-caption-1 text-island-text">
        {afterLabel}
      </span>

      {/* The divider and handle: a full-width layer moved by --pos, the line on its left edge. */}
      <div className="pointer-events-none absolute inset-0 [transform:translateX(var(--pos))]">
        <div className="absolute inset-y-0 left-0 w-0.5 -translate-x-1/2 bg-island-text" />
        <div
          ref={handle}
          role="slider"
          tabIndex={0}
          aria-label={copy.caseStudy.compare}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={50}
          onKeyDown={onKeyDown}
          className="pointer-events-auto absolute top-1/2 left-0 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-chip bg-island-text text-island-bg shadow-lift outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          <ChevronsLeftRight aria-hidden className="size-4" />
        </div>
      </div>
    </div>
  );
}
