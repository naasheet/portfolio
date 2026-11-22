/*
 * Audio levels (5.4): the analyser reduced to three smoothed bands and a beat flag, written to
 * the store (audio.levels, audio.beat: FAST values, read with getState(), never subscribed to).
 * The canvas turns them into uBass / uMid / uHigh / uPulse.
 *
 * One gsap.ticker callback, added with priority so it runs before the canvas draws in the same
 * tick. The analyser's byte data is in decibels (it sits high and barely moves), so each bin is
 * turned back into linear amplitude against the analyser's max level, then divided by the volume
 * (the analyser sits after the volume control): turning the music down doesn't calm the canvas,
 * muting does. Paused or silent, every level eases to 0, and once they're all at 0 the callback
 * stops writing.
 */
import { gsap } from "@/lib/motion/gsap";
import { useStore, type Levels } from "@/lib/store";
import type { AudioEngine } from "./engine";

/** Hz ranges (5.4). */
const BANDS = {
  bass: [20, 150],
  mid: [150, 2000],
  high: [2000, 8000],
} as const;
/**
 * Per-band gain after normalising: higher bands carry far less energy, so they're lifted to use a
 * similar part of 0–1. Tuned on the local playlist at 80 % volume (with the analyser's ceiling at
 * -10 dB, engine.ts): medians before gain were bass 0.06–0.19, mid 0.009–0.025, high
 * 0.001–0.009; after it, bass ~0.2–0.7 (p90 0.4–1), mid ~0.2–0.6, high ~0.1–0.7, and the beat
 * rule fires 1–3 times a second on all six tracks.
 */
const GAIN: Levels = { bass: 3.5, mid: 25, high: 80 };
/** Per 60 fps frame (5.4: fast attack, slow release). */
const ATTACK = 0.5;
const RELEASE = 0.1;
/** Beat: bass above 1.35× its average over ~0.7 s, above 0.3, at most every 250 ms. */
const BEAT_RATIO = 1.35;
const BEAT_FLOOR = 0.3;
const BEAT_AVG_S = 0.7;
const BEAT_GAP_S = 0.25;
/** Below this volume the music counts as silent. */
const MIN_VOLUME = 0.02;

type Range = [number, number];

let started = false;

export function startLevels(engine: AudioEngine): void {
  if (started) return;
  started = true;
  const analyser = engine.analyser;
  const data = new Uint8Array(analyser.frequencyBinCount);
  const binHz = analyser.context.sampleRate / analyser.fftSize;
  const bins = (hz: readonly [number, number]): Range => [
    Math.max(1, Math.round(hz[0] / binHz)),
    Math.min(data.length - 1, Math.round(hz[1] / binHz)),
  ];
  const ranges: Record<keyof Levels, Range> = {
    bass: bins(BANDS.bass),
    mid: bins(BANDS.mid),
    high: bins(BANDS.high),
  };
  // Byte → linear amplitude, 0–1 against the analyser's max level (a 256-entry table).
  const span = analyser.maxDecibels - analyser.minDecibels;
  const amp = new Float32Array(256);
  for (let b = 0; b < 256; b++)
    amp[b] = b === 0 ? 0 : Math.pow(10, ((b / 255 - 1) * span) / 20);

  const level: Levels = { bass: 0, mid: 0, high: 0 };
  let bassAvg = 0;
  let sinceBeat = Infinity;
  let settled = true;

  const band = ([from, to]: Range) => {
    let sum = 0;
    for (let i = from; i <= to; i++) sum += amp[data[i]!]!;
    return sum / (to - from + 1);
  };

  gsap.ticker.add(
    (_time, deltaMs) => {
      const dt = Math.min(Math.max(deltaMs, 0) / 1000, 0.1);
      const { playing, volume } = useStore.getState().audio;
      const live = playing && volume > MIN_VOLUME;
      if (!live && settled) return;

      const target: Levels = { bass: 0, mid: 0, high: 0 };
      if (live) {
        analyser.getByteFrequencyData(data);
        for (const key of ["bass", "mid", "high"] as const)
          target[key] = Math.min(1, (band(ranges[key]) / volume) * GAIN[key]);
      }

      const frames = dt * 60;
      let quiet = true;
      for (const key of ["bass", "mid", "high"] as const) {
        const rate = target[key] > level[key] ? ATTACK : RELEASE;
        level[key] +=
          (target[key] - level[key]) * (1 - Math.pow(1 - rate, frames));
        if (level[key] < 1e-3 && !live) level[key] = 0;
        if (level[key] > 0) quiet = false;
      }

      // Beat: the raw bass against its own recent average.
      bassAvg += (target.bass - bassAvg) * (1 - Math.exp(-dt / BEAT_AVG_S));
      sinceBeat += dt;
      const beat =
        live &&
        sinceBeat >= BEAT_GAP_S &&
        target.bass > BEAT_FLOOR &&
        target.bass > bassAvg * BEAT_RATIO;
      if (beat) sinceBeat = 0;

      settled = !live && quiet;
      if (settled) bassAvg = 0;
      useStore
        .getState()
        .audio.setLevels(
          { bass: level.bass, mid: level.mid, high: level.high },
          beat,
        );
    },
    false,
    true,
  );
}
