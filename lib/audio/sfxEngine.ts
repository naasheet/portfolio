/*
 * UI sound engine, loaded by lib/sfx.ts only after the visitor enables sound.
 * Each sound is fetched and decoded into an AudioBuffer once. Plays go through one master
 * gain, are throttled per sound (60 ms) and get a random ±3% pitch so repeats don't sound
 * robotic. Files: public/sfx/SND01_sine (open source; see CLAUDE.md for the credits TODO).
 */
import { getAudioContext } from "./context";

const BASE = "/sfx/SND01_sine/";

/** Sound name -> files; with several files one is picked at random each time. */
export const SOUNDS = {
  hover: ["tap_01.wav", "tap_02.wav", "tap_03.wav", "tap_04.wav", "tap_05.wav"],
  click: ["button.wav"],
  toggleOn: ["toggle_on.wav"],
  toggleOff: ["toggle_off.wav"],
} as const;

export type SfxName = keyof typeof SOUNDS;

const THROTTLE_MS = 60;
const PITCH_SPREAD = 0.03;
/** UI sounds sit well under everything else. */
const MASTER_GAIN = 0.4;

const buffers: Partial<Record<SfxName, AudioBuffer[]>> = {};
const lastPlayed: Partial<Record<SfxName, number>> = {};
let master: GainNode | null = null;
let loading: Promise<void> | null = null;

/** Fetch and decode every sound once. Safe to call repeatedly. */
export function load(): Promise<void> {
  if (loading) return loading;
  const ctx = getAudioContext();
  if (!ctx) return Promise.resolve();
  master = ctx.createGain();
  master.gain.value = MASTER_GAIN;
  master.connect(ctx.destination);
  const names = Object.keys(SOUNDS) as SfxName[];
  loading = Promise.all(
    names.map(async (name) => {
      buffers[name] = await Promise.all(
        SOUNDS[name].map(async (file) => {
          const res = await fetch(BASE + file);
          return ctx.decodeAudioData(await res.arrayBuffer());
        }),
      );
    }),
  )
    .then(() => undefined)
    .catch(() => {
      // A failed fetch leaves the engine silent; a later initSfx() retries.
      loading = null;
    });
  return loading;
}

/** Play one sound now (the caller has already checked that sound is on). */
export function play(name: SfxName): void {
  const ctx = getAudioContext();
  const list = buffers[name];
  if (!ctx || !master || !list?.length || ctx.state !== "running") return;

  const now = performance.now();
  if (now - (lastPlayed[name] ?? -Infinity) < THROTTLE_MS) return;
  lastPlayed[name] = now;

  const source = ctx.createBufferSource();
  source.buffer = list[Math.floor(Math.random() * list.length)] ?? null;
  source.playbackRate.value = 1 + (Math.random() * 2 - 1) * PITCH_SPREAD;
  source.connect(master);
  source.onended = () => source.disconnect();
  source.start();
}
