"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

export type VideoSource = { src: string; type: string };

export type LoopVideoProps = {
  /** Best format first, e.g. WebM then MP4. */
  sources: VideoSource[];
  /**
   * Shown until the video plays, and instead of it when it won't autoplay. Optional when
   * something else (an Img underneath) already shows the still.
   */
  poster?: string;
  /** Intrinsic size, for the aspect ratio: nothing shifts when it loads. */
  width: number;
  height: number;
  /** If the clip carries meaning, describe it; otherwise it's decorative (aria-hidden). */
  label?: string;
  /** Share of the video that must be visible before it plays (0–1). */
  threshold?: number;
  /**
   * "view" (default): plays while on screen. "hover" (4.4): with a mouse, plays only while the
   * closest `[data-loop-host]` (else the parent) is hovered or has focus inside; on touch it
   * falls back to "view".
   */
  trigger?: "view" | "hover";
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
  trigger = "view",
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
    const host = video.closest<HTMLElement>("[data-loop-host]") ?? video.parentElement;
    const byHover =
      trigger === "hover" &&
      host !== null &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let hovered = false;
    let focused = false;
    const sync = () => {
      const wanted = byHover ? hovered || focused : true;
      if (wanted && inView && document.visibilityState === "visible") {
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

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hovered = true;
      sync();
    };
    const onLeave = () => {
      hovered = false;
      sync();
    };
    const onFocusIn = () => {
      focused = true;
      sync();
    };
    const onFocusOut = (e: FocusEvent) => {
      if (host?.contains(e.relatedTarget as Node | null)) return;
      focused = false;
      sync();
    };
    if (byHover && host) {
      host.addEventListener("pointerenter", onEnter);
      host.addEventListener("pointerleave", onLeave);
      host.addEventListener("focusin", onFocusIn);
      host.addEventListener("focusout", onFocusOut);
    }

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      if (byHover && host) {
        host.removeEventListener("pointerenter", onEnter);
        host.removeEventListener("pointerleave", onLeave);
        host.removeEventListener("focusin", onFocusIn);
        host.removeEventListener("focusout", onFocusOut);
      }
      video.pause();
    };
  }, [reduced, threshold, trigger]);

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
