"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

export type VideoSource = { src: string; type: string };

export type LoopVideoProps = {
  /** Best format first, e.g. WebM then MP4. */
  sources: VideoSource[];
  /** Shown until the video plays, and instead of it when it won't autoplay. */
  poster: string;
  /** Intrinsic size, for the aspect ratio: nothing shifts when it loads. */
  width: number;
  height: number;
  /** If the clip carries meaning, describe it; otherwise it's decorative (aria-hidden). */
  label?: string;
  /** Share of the video that must be visible before it plays (0–1). */
  threshold?: number;
  className?: string;
};

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

/**
 * A short muted loop that only plays while it's on screen (IntersectionObserver) and the tab
 * is visible, and pauses otherwise. preload="none": nothing downloads until it first plays.
 * With reduced motion or Save-Data it never autoplays and the poster stays.
 * No React state and no frame loop; everything is cleaned up on unmount.
 */
export function LoopVideo({
  sources,
  poster,
  width,
  height,
  label,
  threshold = 0.25,
  className,
}: LoopVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const saveData =
      (navigator as NavigatorWithConnection).connection?.saveData === true;
    if (reduced || saveData) {
      video.pause();
      return;
    }

    let inView = false;
    const sync = () => {
      if (inView && document.visibilityState === "visible") {
        // Autoplay can still be refused; the poster stays, which is fine.
        video.play().catch(() => {});
      } else if (!video.paused) {
        video.pause();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry?.isIntersecting ?? false;
        sync();
      },
      { threshold },
    );
    observer.observe(video);
    document.addEventListener("visibilitychange", sync);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      video.pause();
    };
  }, [reduced, threshold]);

  return (
    <video
      ref={ref}
      muted
      playsInline
      loop
      preload="none"
      poster={poster}
      width={width}
      height={height}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cn(
        "block h-auto w-full bg-surface-glass object-cover",
        className,
      )}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {sources.map((s) => (
        <source key={s.src} src={s.src} type={s.type} />
      ))}
    </video>
  );
}
