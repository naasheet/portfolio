"use client";

import { Hand, Play, Pause, ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { arCopy } from "@/content/ar";
import { roomObjects } from "@/content/room";
import { landmarks } from "@/features/ar/landmarks";
import { PALM_HOLD_S, PALM_OPEN_S } from "@/features/ar/gestures";
import { island } from "@/lib/island";
import { gsap } from "@/lib/motion/gsap";
import { useStore } from "@/lib/store";

const t = arCopy.island;
export const AR_ACTIVITY = "ar";
/** While a palm hold runs, AR takes the pill even over music (the ring is where the eye is). */
const HOLD_PRIORITY = -1;

/** Writes `text` into `el` only when it changed (no React state, no re-render). */
const write = (el: HTMLElement | null, text: string) => {
  if (el && el.textContent !== text) el.textContent = text;
};

/** Leading slot, live: the teal camera dot (always on while the camera is) and the hand. */
function ArLead() {
  return (
    <span className="flex items-center gap-2 text-island-text">
      <span aria-hidden className="size-2 rounded-chip bg-island-accent" />
      <Hand aria-hidden className="size-4" />
    </span>
  );
}

/** Trailing slot, live: "Tracking · right hand" or "No hand", and the detection rate. */
function ArTrail() {
  const status = useRef<HTMLSpanElement>(null);
  const fps = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const tick = () => {
      write(
        status.current,
        landmarks.visible ? t.tracking(landmarks.hand) : t.noHand,
      );
      write(fps.current, t.fps(landmarks.fps));
    };
    tick();
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);
  return (
    <span className="flex items-center gap-2 whitespace-nowrap">
      <span ref={status} className="text-footnote text-island-text-secondary" />
      <span
        ref={fps}
        className="text-caption-1 font-mono text-island-accent tabular-nums"
      />
    </span>
  );
}

const RING_R = 9;
const RING_C = 2 * Math.PI * RING_R;

/** Leading slot, palm hold: an amber ring filling around the action's icon. */
function HoldLead({ kind }: { kind: "open" | "music" }) {
  const ring = useRef<SVGCircleElement>(null);
  const playing = useStore((s) => s.audio.playing);
  useEffect(() => {
    const tick = () => {
      const palm = useStore.getState().ar.hand.palm;
      ring.current?.setAttribute(
        "stroke-dashoffset",
        String(RING_C * (1 - palm)),
      );
    };
    tick();
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);
  const Icon = kind === "open" ? ArrowUpRight : playing ? Pause : Play;
  return (
    <span className="relative flex size-6 items-center justify-center text-accent-secondary">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx={12}
          cy={12}
          r={RING_R}
          fill="none"
          strokeWidth={2}
          className="stroke-island-border"
        />
        <circle
          ref={ring}
          cx={12}
          cy={12}
          r={RING_R}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={RING_C}
          className="stroke-current"
        />
      </svg>
      <Icon aria-hidden className="size-2.5" />
    </span>
  );
}

/** Trailing slot, palm hold: "Hold to open Arcade" / "Hold to play music" and the time left. */
function HoldTrail({ text, duration }: { text: string; duration: number }) {
  const left = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const tick = () => {
      const palm = useStore.getState().ar.hand.palm;
      write(left.current, t.seconds(Math.max(0, (1 - palm) * duration)));
    };
    tick();
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [duration]);
  return (
    <span className="flex items-center gap-2 whitespace-nowrap">
      <span className="text-footnote font-semibold text-island-text">
        {text}
      </span>
      <span
        ref={left}
        className="text-caption-1 font-mono text-accent-secondary tabular-nums"
      />
    </span>
  );
}

/**
 * Hand mode in the island (8.4, Island board "AR · live" and "AR · palm hold"). Renders nothing;
 * while the camera is on it pushes the AR activity: the camera dot and hand leading, the tracking
 * status and rate trailing (written from the ticker, no re-renders). With music live, AR is the
 * split circle (music wins by kind). During a palm hold it is re-pushed ahead of music with the
 * filling ring and "Hold to open Arcade" / "Hold to play music". Mounted by ARLayer with the
 * camera; removes itself when it unmounts.
 */
export function IslandAR() {
  useEffect(() => {
    const live = () =>
      island.push({
        id: AR_ACTIVITY,
        kind: "ar",
        label: t.label,
        lead: <ArLead />,
        trail: <ArTrail />,
      });

    const onHold = ([kind, target]: readonly [
      "open" | "music" | null,
      string | null,
    ]) => {
      if (!kind) {
        live();
        return;
      }
      const name = roomObjects.find((o) => o.id === target)?.label ?? "";
      const text =
        kind === "open"
          ? t.holdOpen(name)
          : t.holdMusic(useStore.getState().audio.playing);
      island.push({
        id: AR_ACTIVITY,
        kind: "ar",
        priority: HOLD_PRIORITY,
        label: text,
        lead: <HoldLead kind={kind} />,
        trail: (
          <HoldTrail
            text={text}
            duration={kind === "open" ? PALM_OPEN_S : PALM_HOLD_S}
          />
        ),
      });
    };

    live();
    // A derived, slow value: it changes only when a hold starts, retargets or ends.
    const off = useStore.subscribe(
      (s) => [s.ar.hand.holdKind, s.ar.hand.holdTarget] as const,
      onHold,
      { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1] },
    );
    return () => {
      off();
      island.remove(AR_ACTIVITY);
    };
  }, []);
  return null;
}
