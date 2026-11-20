"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

/**
 * Writes scroll.chapter from the homepage's `[data-chapter="n"]` sections: the one crossing the
 * middle of the viewport is current. IntersectionObserver only, no per-frame work, and it only
 * writes when the chapter changes. The 4.x chapters keep the same data attribute.
 * Used once by the nav (which never unmounts); it re-scans when the route changes.
 */
export function useChapterTracker(): void {
  const pathname = usePathname();
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-chapter]");
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(
            (entry.target as HTMLElement).dataset.chapter ?? 0,
          );
          if (useStore.getState().scroll.chapter !== index)
            useStore.getState().scroll.setChapter(index);
        }
      },
      // A one-pixel line across the middle of the viewport.
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [pathname]);
}
