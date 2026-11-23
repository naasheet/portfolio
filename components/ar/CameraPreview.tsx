"use client";

import { animate, m, useMotionValue, type PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { arCopy } from "@/content/ar";
import { focusRing } from "@/components/ui/controlStyles";
import {
  FINGERTIPS,
  HAND_CONNECTIONS,
  LANDMARK_COUNT,
  landmarks,
} from "@/features/ar/landmarks";
import { storage } from "@/lib/browser";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { gsap } from "@/lib/motion/gsap";
import { spring } from "@/lib/motion/tokens";
import { setHandMode } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

const t = arCopy.preview;

type Corner = "bl" | "br" | "tl" | "tr";
const CORNERS: readonly Corner[] = ["bl", "br", "tl", "tr"];
const CORNER_KEY = "ar-preview-corner";

/**
 * The card's resting places, in px from the window's edges. Plain numbers (not the safe-area
 * variables) so the snap can compute the same spot it lands on; Hand mode is a laptop feature.
 * Top corners sit under the nav row.
 */
const EDGE = 16;
const TOP = 84;
const CORNER_CLASS: Record<Corner, string> = {
  bl: "bottom-4 left-4",
  br: "bottom-4 right-4",
  tl: "top-21 left-4",
  tr: "top-21 right-4",
};

const readCorner = (): Corner => {
  const saved = storage.get(CORNER_KEY);
  return CORNERS.includes(saved as Corner) ? (saved as Corner) : "bl";
};

/** The video's size (the board's 160 × 120) and the canvas drawn over it. */
const W = 160;
const H = 120;

/**
 * Landmarks over the video (8.1; 8.2 fills the buffer): bones teal, joints white, fingertips
 * amber, mirrored like the video. Runs on the gsap ticker only while the tab is visible, and
 * redraws only when the buffer changed, so before 8.2 it costs one comparison a frame.
 */
function startLandmarkCanvas(el: HTMLCanvasElement): () => void {
  {
    const ctx = el.getContext("2d");
    if (!ctx) return () => {};
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = W * dpr;
    el.height = H * dpr;
    const styles = getComputedStyle(document.documentElement);
    const bone = styles.getPropertyValue("--color-accent-primary").trim();
    const tip = styles.getPropertyValue("--color-accent-secondary").trim();
    const joint = styles.getPropertyValue("--color-island-text").trim();
    let drawn = -1;

    const draw = () => {
      if (landmarks.version === drawn) return;
      drawn = landmarks.version;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!landmarks.visible) return;
      const p = landmarks.points;
      // Mirrored, like the video.
      const x = (i: number) => (1 - p[i * 2]!) * W;
      const y = (i: number) => p[i * 2 + 1]! * H;
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.strokeStyle = bone;
      ctx.beginPath();
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.moveTo(x(a), y(a));
        ctx.lineTo(x(b), y(b));
      }
      ctx.stroke();
      for (let i = 0; i < LANDMARK_COUNT; i++) {
        const isTip = FINGERTIPS.includes(i);
        ctx.fillStyle = isTip ? tip : joint;
        ctx.beginPath();
        ctx.arc(x(i), y(i), isTip ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let running = false;
    const sync = () => {
      const visible = document.visibilityState === "visible";
      if (visible && !running) gsap.ticker.add(draw);
      if (!visible && running) gsap.ticker.remove(draw);
      running = visible;
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      gsap.ticker.remove(draw);
    };
  }
}

/**
 * The camera preview (8.1; AR board, "Tracking"): the mirrored 160 × 120 video in a rounded glass
 * card with a red live dot, "mirrored", a status row and a close (back to Mouse). Drag it anywhere;
 * on release it springs to the nearest corner, which is remembered (default bottom-left).
 */
export function CameraPreview({ stream }: { stream: MediaStream }) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [corner, setCorner] = useState<Corner>(readCorner);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    el.srcObject = stream;
    void el.play().catch(() => {});
    return () => {
      el.srcObject = null;
    };
  }, [stream]);

  useEffect(
    () => (canvas.current ? startLandmarkCanvas(canvas.current) : undefined),
    [],
  );

  // The new corner's classes are in place: drop the drag offset in the same frame.
  useLayoutEffect(() => {
    x.set(0);
    y.set(0);
  }, [corner, x, y]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const el = card.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const right = info.point.x > window.innerWidth / 2;
    const bottom = info.point.y > window.innerHeight / 2;
    const next: Corner = `${bottom ? "b" : "t"}${right ? "r" : "l"}`;
    storage.set(CORNER_KEY, next);
    const targetLeft = right ? window.innerWidth - EDGE - r.width : EDGE;
    const targetTop = bottom ? window.innerHeight - EDGE - r.height : TOP;
    const done = () => setCorner(next);
    if (reduced) {
      done();
      return;
    }
    let pending = 2;
    const finish = () => {
      if (--pending === 0) done();
    };
    animate(x, x.get() + targetLeft - r.left, {
      ...spring.soft,
      onComplete: finish,
    });
    animate(y, y.get() + targetTop - r.top, {
      ...spring.soft,
      onComplete: finish,
    });
  };

  return (
    <m.div
      ref={card}
      role="group"
      aria-label={t.label}
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={onDragEnd}
      style={{ x, y }}
      title={t.dragHint}
      className={cn(
        "pointer-events-auto fixed flex w-44 cursor-grab touch-none flex-col gap-2 rounded-card glass p-2 select-none active:cursor-grabbing",
        CORNER_CLASS[corner],
      )}
    >
      <div className="relative h-30 w-40 overflow-hidden rounded-control bg-island-bg">
        <video
          ref={video}
          muted
          playsInline
          autoPlay
          aria-hidden
          className="size-full -scale-x-100 object-cover"
        />
        <canvas
          ref={canvas}
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full"
        />
        <span
          aria-hidden
          className="absolute top-2 left-2 size-2 rounded-chip bg-island-danger"
        />
        <span
          aria-hidden
          className="absolute right-2 bottom-1.5 text-caption-2 font-mono text-island-text-secondary"
        >
          {t.mirrored}
        </span>
      </div>
      <div className="flex items-center justify-between pl-1">
        <span className="flex items-center gap-2 text-footnote text-text-primary">
          <span aria-hidden className="size-2 rounded-chip bg-accent-primary" />
          {t.live}
        </span>
        <button
          type="button"
          aria-label={t.off}
          onClick={() => setHandMode(false)}
          onPointerDownCapture={(e) => e.stopPropagation()}
          className={cn(
            "flex size-7 cursor-pointer items-center justify-center rounded-control text-text-secondary transition-colors duration-150 ease-out hover:bg-text-primary/10 hover:text-text-primary [&_svg]:size-4",
            focusRing,
          )}
        >
          <X aria-hidden />
        </button>
      </div>
    </m.div>
  );
}
