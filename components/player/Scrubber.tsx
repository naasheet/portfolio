"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { copy } from "@/content/copy";
import { focusRing } from "@/components/ui/controlStyles";
import { formatTime } from "@/lib/audio/time";
import { gsap } from "@/lib/motion/gsap";
import { writeText } from "@/lib/motion/writeText";
import { getMusic } from "@/lib/music";
import { cn } from "@/lib/utils";

/** ← / → jump this far (5.2). */
const STEP_S = 5;
/** After a seek, ignore the engine's time this long (it lands ~20 ms later). */
const HOLD_MS = 150;

/**
 * The player's scrubber (5.2): a native range input (so keyboard, touch and screen readers work)
 * drawn as a thin teal line. The time labels, the fill, the input's value and its aria-valuetext
 * ("1 minute 20 of 3 minutes 05") are written from one gsap.ticker callback through refs, never
 * through React state. Dragging previews the time and seeks on release; ← / → seek ±5 s.
 */
export function Scrubber({ className }: { className?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const nowLabel = useRef<HTMLSpanElement>(null);
  const totalLabel = useRef<HTMLSpanElement>(null);
  const dragging = useRef(false);
  const holdUntil = useRef(0);
  /** Where the last seek went: repeated keys step from it, not from the engine's stale time. */
  const pending = useRef(0);

  useEffect(() => {
    const el = input.current;
    const bar = fill.current;
    const nowEl = nowLabel.current;
    const totalEl = totalLabel.current;
    if (!el || !bar || !nowEl || !totalEl) return;

    let lastNow = -1;
    let lastTotal = -1;

    const render = (t: number, d: number) => {
      const now = Math.floor(t);
      const total = Math.floor(d);
      bar.style.transform = `scaleX(${d > 0 ? Math.min(1, t / d).toFixed(4) : 0})`;
      const totalChanged = total !== lastTotal;
      if (totalChanged) {
        lastTotal = total;
        el.max = String(total);
        writeText(totalEl, formatTime(total));
      }
      if (now !== lastNow || totalChanged) {
        lastNow = now;
        writeText(nowEl, formatTime(now));
        el.setAttribute(
          "aria-valuetext",
          copy.player.valueText(
            copy.player.spokenTime(now),
            copy.player.spokenTime(total),
          ),
        );
      }
    };

    const tick = () => {
      if (dragging.current || performance.now() < holdUntil.current) return;
      const music = getMusic();
      const t = music?.getTime() ?? 0;
      const d = music?.getDuration() ?? 0;
      const v = String(Math.floor(t));
      if (el.value !== v) el.value = v;
      render(t, d);
    };

    // "input": dragging (or a key the browser handles itself) — preview only.
    const onInput = () => {
      dragging.current = true;
      render(Number(el.value), getMusic()?.getDuration() ?? 0);
    };
    // "change": the value was committed (pointer released, Home / End / Page keys).
    const onChange = () => {
      dragging.current = false;
      holdUntil.current = performance.now() + HOLD_MS;
      getMusic()?.seek(Number(el.value));
    };

    el.addEventListener("input", onInput);
    el.addEventListener("change", onChange);
    gsap.ticker.add(tick);
    tick();
    return () => {
      el.removeEventListener("input", onInput);
      el.removeEventListener("change", onChange);
      gsap.ticker.remove(tick);
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const music = getMusic();
    const el = input.current;
    if (!music || !el) return;
    const d = music.getDuration();
    const t = Math.min(
      d,
      Math.max(
        0,
        (performance.now() < holdUntil.current
          ? pending.current
          : music.getTime()) + (e.key === "ArrowRight" ? STEP_S : -STEP_S),
      ),
    );
    music.seek(t);
    pending.current = t;
    holdUntil.current = performance.now() + HOLD_MS;
    el.value = String(Math.floor(t));
    fill.current?.style.setProperty(
      "transform",
      `scaleX(${d > 0 ? (t / d).toFixed(4) : 0})`,
    );
    if (nowLabel.current) writeText(nowLabel.current, formatTime(t));
    el.setAttribute(
      "aria-valuetext",
      copy.player.valueText(
        copy.player.spokenTime(t),
        copy.player.spokenTime(d),
      ),
    );
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-caption-2 font-mono text-island-text-secondary tabular-nums",
        className,
      )}
    >
      <span ref={nowLabel} aria-hidden className="w-8">
        0:00
      </span>
      <div className="relative flex h-5 flex-1 items-center">
        <span
          aria-hidden
          className="absolute inset-x-0 h-1 overflow-hidden rounded-chip bg-island-text/15"
        >
          <span
            ref={fill}
            className="absolute inset-0 origin-left bg-island-accent"
            style={{ transform: "scaleX(0)" }}
          />
        </span>
        <input
          ref={input}
          type="range"
          min={0}
          max={0}
          step={1}
          defaultValue={0}
          aria-label={copy.player.seek}
          onKeyDown={onKeyDown}
          data-lenis-prevent
          className={cn(
            "scrubber relative h-5 w-full cursor-pointer appearance-none rounded-chip bg-transparent",
            focusRing,
          )}
        />
      </div>
      <span ref={totalLabel} aria-hidden className="w-8 text-right">
        0:00
      </span>
    </div>
  );
}
