/*
 * UI sound engine, loaded by lib/sfx.ts only after the visitor enables sound.
 * Each sound is fetched and decoded into an AudioBuffer once. Plays go through one master
 * gain, are throttled per sound and get a random ±3% pitch so repeats don't sound robotic.
 * Files: public/sfx/SND01_sine (open source; see CLAUDE.md for the credits TODO).
 */
import { getAudioContext } from "./context";

const BASE = "/sfx/SND01_sine/";

/** Sound name -> files; with several files one is picked at random each time. */
export const SOUNDS = {
  hover: ["tap_01.wav", "tap_02.wav", "tap_03.wav", "tap_04.wav", "tap_05.wav"],
  click: ["button.wav"],
  toggleOn: ["toggle_on.wav"],
  toggleOff: ["toggle_off.wav"],
  type: [
    "type_01.wav",
    "type_02.wav",
    "type_03.wav",
    "type_04.wav",
    "type_05.wav",
  ],
} as const;

export type SfxName = keyof typeof SOUNDS;

/** Minimum gap between two plays of the same sound (ms). */
const THROTTLE_MS: Record<SfxName, number> = {
  hover: 60,
  click: 60,
  toggleOn: 60,
  toggleOff: 60,
  // Shorter for typing, so quick typists don't lose keystrokes (1.7 follow-up).
  type: 30,
};

/** Per-sound level under the master gain: typing is the most repetitive, so it sits lowest. */
const GAIN: Record<SfxName, number> = {
  hover: 1,
  click: 1,
  toggleOn: 1,
  toggleOff: 1,
  type: 0.6,
};

const PITCH_SPREAD = 0.03;
/** UI sounds sit well under everything else. */
const MASTER_GAIN = 0.4;

const buffers: Partial<Record<SfxName, AudioBuffer[]>> = {};
const lastPlayed: Partial<Record<SfxName, number>> = {};
const gains: Partial<Record<SfxName, GainNode>> = {};
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
  for (const name of names) {
    const g = ctx.createGain();
    g.gain.value = GAIN[name];
    g.connect(master);
    gains[name] = g;
  }
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
  const out = gains[name];
  if (!ctx || !out || !list?.length || ctx.state !== "running") return;

  const now = performance.now();
  if (now - (lastPlayed[name] ?? -Infinity) < THROTTLE_MS[name]) return;
  lastPlayed[name] = now;

  const source = ctx.createBufferSource();
  source.buffer = list[Math.floor(Math.random() * list.length)] ?? null;
  source.playbackRate.value = 1 + (Math.random() * 2 - 1) * PITCH_SPREAD;
  source.connect(out);
  source.onended = () => source.disconnect();
  source.start();
}
