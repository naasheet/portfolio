"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { copy } from "@/content/copy";
import { loadingLines, readyLine } from "@/content/loadingLines";
import { preloadManifest } from "@/content/preload";
import { profile } from "@/content/profile";
import { storage } from "@/lib/browser";
import { gsap } from "@/lib/motion/gsap";
import { lockScroll, unlockScroll } from "@/lib/motion/lenis";
import type { EasedProgress } from "@/lib/preload";
import { useStore } from "@/lib/store";
import { GateClock } from "./GateClock";
import { GateScatter } from "./GateScatter";
import { OrbitSpinner } from "./OrbitSpinner";

/** A new line every 0.8 s (Nasheet: lines should change often; the board said 1.6 s). */
const LINE_MS = 800;
/** The gate stays at least this long, so even a fast load shows a few lines (Nasheet, 2.2). */
const MIN_MS = 3200;
/** Hold at 100% before leaving. */
const HOLD_MS = 300;
/** Written when the visitor gets in; GateScript skips the gate on later visits. */
const ENTERED_KEY = "entered";

const FIRST_LINE = loadingLines[0];

/** Every line except the opener, in a fresh random order (Fisher–Yates). */
function shuffledRest(): string[] {
  const rest: string[] = loadingLines.slice(1);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j]!, rest[i]!];
  }
  return rest;
}

const pad3 = (n: number) => String(n).padStart(3, "0");

/*
 * The scrambling line loads after hydration (ScrambleText isn't needed for the first paint);
 * until then the server-rendered fallback shows the first line. Keeps first-load JS on `/` small.
 */
const GateLine = dynamic(() => import("./GateLine").then((m) => m.GateLine), {
  ssr: false,
  loading: () => <span className="gate-line">{FIRST_LINE}</span>,
});

/**
 * The first screen (Loading screen board, chunk 2.2): a three-digit counter that eases toward the
 * real load (lib/preload.ts) and a playful line that changes every 0.8 s, both centred (Nasheet
 * moved them from the board's bottom-left), and a hairline along the bottom that fills. It stays
 * at least 3.2 s, so a fast load still shows a few lines; the counter never passes the real load.
 * No buttons: at 100% it says "Ready.", holds 300 ms and leaves on its own, and the site always
 * starts silent. The exit is a ~0.8 s GSAP timeline (a 200 ms fade with reduced motion); at the
 * end ui.entered = true (the hero intro, 4.2, listens for it).
 *
 * It's server-rendered, so it paints with the HTML before any asset. Repeat visits never see it:
 * GateScript marks <html data-gate="skip"> before paint and this component steps aside at once.
 * The counter, percentage and hairline are written straight to the DOM, never through React state.
 */
export function EntryGate() {
  const setEntered = useStore((s) => s.ui.setEntered);
  const [gone, setGone] = useState(false);
  const [line, setLine] = useState<string>(FIRST_LINE);
  const [ready, setReady] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLDivElement>(null);
  const lineRow = useRef<HTMLDivElement>(null);
  const hairRow = useRef<HTMLDivElement>(null);
  const percent = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const rootEl = root.current;

    // Repeat visit: GateScript already hid it before paint.
    if (html.dataset.gate === "skip" || !rootEl) {
      setEntered(true);
      setGone(true);
      return;
    }

    lockScroll();
    let locked = true;
    let finished = false;
    let loaded = false;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    let exitTween: gsap.core.Animation | undefined;

    // A new line every 1.6 s, shuffled, never repeating.
    const queue = shuffledRest();
    // Near the end, stop swapping lines so none flashes past just before "Ready.".
    let nearlyDone = false;
    const lineTimer = setInterval(() => {
      if (nearlyDone) return;
      const next = queue.shift();
      if (next) setLine(next);
    }, LINE_MS);

    const enter = () => {
      storage.set(ENTERED_KEY, "1");
      html.dataset.gate = "done";
      if (locked) {
        unlockScroll();
        locked = false;
      }
      setEntered(true);
      setGone(true);
    };

    const exit = () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduced) {
        exitTween = gsap.to(rootEl, {
          opacity: 0,
          duration: 0.2,
          ease: "power1.out",
          onComplete: enter,
        });
        return;
      }
      // ~0.8 s: the centred counter and line shrink toward the middle and fade, then the
      // overlay wipes upward.
      exitTween = gsap
        .timeline({ onComplete: enter })
        .to([counter.current, lineRow.current], {
          scale: 0.92,
          opacity: 0,
          transformOrigin: "center center",
          duration: 0.35,
          ease: "power2.in",
          stagger: 0.04,
        })
        .to(
          [hairRow.current, top.current],
          { opacity: 0, duration: 0.25, ease: "power1.out" },
          0,
        )
        .to(
          rootEl,
          { yPercent: -100, duration: 0.55, ease: "power3.inOut" },
          0.25,
        );
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      clearInterval(lineTimer);
      setLine(readyLine);
      setReady(true);
      if (fill.current) fill.current.dataset.full = "";
      holdTimer = setTimeout(exit, HOLD_MS);
    };

    // The preloader loads after hydration too (it isn't needed for the first paint).
    let eased: EasedProgress | undefined;
    let disposed = false;
    void import("@/lib/preload").then(({ createEasedProgress, preload }) => {
      if (disposed) return;
      const progress = createEasedProgress(
        (shown) => {
          const pct = Math.round(shown * 100);
          if (counter.current) counter.current.textContent = pad3(pct);
          if (percent.current) percent.current.textContent = `${pct}%`;
          if (fill.current) fill.current.style.transform = `scaleX(${shown})`;
          if (shown >= 0.95) nearlyDone = true;
          if (loaded && shown >= 1) finish();
        },
        { minDurationMs: MIN_MS },
      );
      eased = progress;
      const { ready: readyPromise } = preload(preloadManifest, {
        onProgress: (r) => progress.set(r.progress),
      });
      // Everything loaded, or 8 s passed: either way the counter runs up to 100 and lets them in.
      void readyPromise.then(() => {
        loaded = true;
        progress.set(1);
        if (progress.value >= 1) finish();
      });
    });

    return () => {
      disposed = true;
      clearInterval(lineTimer);
      clearTimeout(holdTimer);
      exitTween?.kill();
      eased?.stop();
      if (locked) unlockScroll();
    };
  }, [setEntered]);

  if (gone) return null;

  return (
    <div
      ref={root}
      className="entry-gate fixed inset-0 z-gate overflow-hidden bg-bg-base text-text-primary"
    >
      <GateScatter />
      <p role="status" className="sr-only">
        {ready ? readyLine : copy.ui.loading}
      </p>

      <div
        aria-hidden
        className="relative flex h-full flex-col px-6 pt-6 pb-11 md:px-12 md:pt-12 md:pb-12"
      >
        <div ref={top} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-subhead text-text-secondary">
            <span className="flex gap-1">
              <span className="size-2 rounded-chip bg-accent-primary" />
              <span className="size-2 rounded-chip bg-accent-secondary" />
            </span>
            {profile.name}
          </span>
          <span className="hidden md:inline">
            <GateClock />
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div ref={counter} className="text-stat-1 font-medium tabular-nums">
            000
          </div>
          <div
            ref={lineRow}
            className="mt-6 flex items-center justify-center gap-2 text-footnote font-mono text-text-secondary"
          >
            <OrbitSpinner />
            <GateLine text={line} />
          </div>
        </div>

        <div>
          <div ref={hairRow} className="flex flex-col gap-2">
            <span
              ref={percent}
              className="self-end text-caption-1 text-text-tertiary tabular-nums"
            >
              0%
            </span>
            <div className="relative h-px bg-border-default">
              <div
                ref={fill}
                className="gate-fill absolute inset-0 bg-accent-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
