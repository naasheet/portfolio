"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

/**
 * A thin teal bar across the top of the window that fills as the page is read (4.5; Case study
 * frames). It follows `scroll.progress` (written by RouteWatcher for the current page) through a
 * store subscription that writes the bar's transform directly: no React state, no extra loop.
 */
export function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const write = (p: number) => {
      if (bar.current)
        bar.current.style.transform = `scaleX(${Math.min(1, Math.max(0, p))})`;
    };
    write(useStore.getState().scroll.progress);
    return useStore.subscribe((s) => s.scroll.progress, write);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-persistent h-0.5"
    >
      <div
        ref={bar}
        className="h-full origin-left scale-x-0 bg-accent-primary"
      />
    </div>
  );
}
