"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { gsap } from "@/lib/motion/gsap";
import { getMusic } from "@/lib/music";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/*
 * The island's equalizer (5.2): four bars driven by the music itself. One shared gsap.ticker
 * callback reads the engine's analyser once per frame, reduces it to four bands, smooths them
 * (fast attack, slower release) and writes scaleY straight to every mounted set of bars. No
 * React state: mounting is the only render.
 *
 * Paused: the bars ease down flat, then the callback stops writing until playback resumes.
 * Reduced motion: the bars stand still (Island board).
 */

/** Frequency-bin ranges per bar (fftSize 1024 → ~43–47 Hz a bin): bass, low-mid, mid, high. */
const BANDS: readonly (readonly [number, number])[] = [
  [1, 4],
  [4, 13],
  [13, 47],
  [47, 186],
];
/*
 * The analyser's byte levels are in decibels: they sit high and move little within a track
 * (bass ~0.86–0.99), and differ a lot between tracks. So each band follows its own slow
 * average and spread, and a bar shows where the band is against them: lively on every track.
 */
const ADAPT_TAU = 1.5;
/** A bar at the average sits at half height; ±SPREADS spreads fill it or empty it. */
const SPREADS = 2;
const MIN_SPREAD = 0.015;
/** Smallest bar (paused, silence). */
const FLAT = 0.2;
const ATTACK_TAU = 0.03;
const RELEASE_TAU = 0.16;
/** Reduced motion: a still, uneven shape. */
const STILL = [0.55, 0.9, 0.65, 0.8];

const groups = new Set<HTMLSpanElement[]>();
const level = [0, 0, 0, 0];
const mean = [0, 0, 0, 0];
const spread = [0, 0, 0, 0];
/** The adaptive averages restart from the next frame's values (after a pause). */
let primed = false;
let data: Uint8Array<ArrayBuffer> | null = null;
let settled = true;

function write(bars: HTMLSpanElement[]) {
  for (let i = 0; i < bars.length; i++) {
    const scale = FLAT + (1 - FLAT) * (level[i] ?? 0);
    bars[i]!.style.transform = `scaleY(${scale.toFixed(3)})`;
  }
}

function tick(_time: number, deltaMs: number) {
  const playing = useStore.getState().audio.playing;
  if (!playing && settled) return;
  const dt = Math.min(deltaMs / 1000, 0.1);
  const analyser = playing ? getMusic()?.analyser : undefined;
  if (analyser) {
    if (!data || data.length !== analyser.frequencyBinCount)
      data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
  }
  let quiet = true;
  const adapt = 1 - Math.exp(-dt / ADAPT_TAU);
  for (let b = 0; b < BANDS.length; b++) {
    let target = 0;
    if (analyser && data) {
      const [from, to] = BANDS[b]!;
      let sum = 0;
      for (let i = from; i < to; i++) sum += data[i] ?? 0;
      const x = sum / (to - from) / 255;
      if (!primed) {
        mean[b] = x;
        spread[b] = MIN_SPREAD * 2;
      }
      mean[b]! += (x - mean[b]!) * adapt;
      spread[b]! += (Math.abs(x - mean[b]!) - spread[b]!) * adapt;
      const dev = (x - mean[b]!) / (SPREADS * Math.max(spread[b]!, MIN_SPREAD));
      // Silence (x near 0) stays flat whatever the average says.
      target = x < 0.05 ? 0 : Math.min(1, Math.max(0, 0.5 + dev));
    }
    const current = level[b]!;
    const tau = target > current ? ATTACK_TAU : RELEASE_TAU;
    const next = current + (target - current) * (1 - Math.exp(-dt / tau));
    level[b] = next;
    if (next > 0.002) quiet = false;
  }
  primed = Boolean(analyser);
  settled = !playing && quiet;
  if (settled) level.fill(0);
  for (const bars of groups) write(bars);
}

function register(bars: HTMLSpanElement[]): () => void {
  if (groups.size === 0) gsap.ticker.add(tick);
  groups.add(bars);
  settled = false;
  write(bars);
  return () => {
    groups.delete(bars);
    if (groups.size === 0) gsap.ticker.remove(tick);
  };
}

export function Bars({ className }: { className?: string }) {
  const root = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    return register(Array.from(el.children) as HTMLSpanElement[]);
  }, [reduced]);

  return (
    <span
      ref={root}
      aria-hidden
      className={cn("flex h-3.5 items-end gap-0.5", className)}
    >
      {STILL.map((still, i) => (
        <span
          key={i}
          className="h-full w-0.5 origin-bottom rounded-chip bg-current"
          // Runtime value: the still shape under reduced motion, else flat until the ticker writes.
          style={{ transform: `scaleY(${reduced ? still : FLAT})` }}
        />
      ))}
    </span>
  );
}
