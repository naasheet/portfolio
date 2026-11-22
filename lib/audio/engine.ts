/*
 * The music engine (5.1): one per page load, outside React, so music never stops on a route
 * change. Loaded on demand by lib/music.ts the first time sound is turned on.
 *
 *   <audio A> → MediaElementSource → gain A ─┐
 *                                            ├→ master gain (volume) → analyser → speakers
 *   <audio B> → MediaElementSource → gain B ─┘
 *
 * Changing tracks crossfades the two decks over 1.2 s with equal-power curves (no dip in the
 * middle, no clicks). The two elements and their nodes are created once and reused (an element
 * can only ever have one MediaElementSource), and an idle deck has its src removed, so switching
 * tracks over and over doesn't grow memory.
 *
 * Slow values go to the store (playing, trackIndex, volume); the current time stays here and the
 * player reads it with getTime() / getDuration(). The analyser is for the canvas (5.4).
 */
import { copy } from "@/content/copy";
import { tracks } from "@/content/music";
import { storage } from "@/lib/browser";
import { useStore } from "@/lib/store";
import { toast } from "@/lib/toast";

const CROSSFADE_S = 1.2;
/** The very first track after sound is turned on (5.1: "fade it in over 2 s"). */
const FIRST_FADE_S = 2;
/** Resuming after a pause, and pausing. */
const RESUME_FADE_S = 0.4;
const PAUSE_FADE_S = 0.25;
/** A deck that's still audible is ramped to silence this fast before its src is swapped. */
const SILENCE_S = 0.03;
/** prev() restarts the current track when it's further in than this. */
const PREV_RESTART_S = 3;
/** Consecutive load failures before the engine gives up instead of skipping forever. */
const MAX_ERRORS = 3;
const VOLUME_KEY = "volume";

type Deck = {
  el: HTMLAudioElement;
  gain: GainNode;
  /** Pending "pause and empty after the fade-out". */
  cleanup: ReturnType<typeof setTimeout> | undefined;
  /** Which track it holds (index into `tracks`), or -1. */
  track: number;
};

const curve = (from: number, to: number, rising: boolean) => {
  const n = 64;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    // Equal power: sin / cos, so A² + B² stays 1 through the fade.
    const shape = rising
      ? Math.sin((x * Math.PI) / 2)
      : Math.cos((x * Math.PI) / 2);
    out[i] = rising ? from + (to - from) * shape : to + (from - to) * shape;
  }
  return out;
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

class AudioEngine {
  private ctx: AudioContext;
  private decks: [Deck, Deck];
  private active = 0;
  private master: GainNode;
  readonly analyser: AnalyserNode;
  /** Playlist order: track 0 first, the rest shuffled once per visit. */
  private order: number[];
  private pos = 0;
  private started = false;
  private errors = 0;
  /** Bumped on every switch, so a stale async step can tell it lost the race. */
  private switchId = 0;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.8;
    this.master.connect(this.analyser).connect(ctx.destination);

    this.decks = [this.makeDeck(), this.makeDeck()];

    const rest = tracks.map((_, i) => i).slice(1);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j]!, rest[i]!];
    }
    this.order = tracks.length ? [0, ...rest] : [];

    const saved = storage.get(VOLUME_KEY);
    const parsed = saved === null ? NaN : Number(saved);
    this.applyVolume(
      Number.isFinite(parsed) ? parsed : useStore.getState().audio.volume,
      true,
    );
    useStore.getState().audio.setEnabled(true);
  }

  private makeDeck(): Deck {
    const el = new Audio();
    el.preload = "auto";
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    this.ctx.createMediaElementSource(el).connect(gain).connect(this.master);
    const deck: Deck = { el, gain, cleanup: undefined, track: -1 };
    el.addEventListener("ended", () => {
      if (this.activeDeck() === deck) this.next();
    });
    el.addEventListener("error", () => {
      // An emptied deck fires "error" too (no src); only a real track failing counts.
      if (deck.track < 0 || !el.getAttribute("src")) return;
      if (this.activeDeck() === deck) void this.failed(deck.track);
    });
    el.addEventListener("playing", () => {
      if (this.activeDeck() === deck) this.errors = 0;
    });
    return deck;
  }

  private activeDeck(): Deck {
    return this.active === 0 ? this.decks[0] : this.decks[1];
  }

  private idleDeck(): Deck {
    return this.active === 0 ? this.decks[1] : this.decks[0];
  }

  // --- Public API ---------------------------------------------------------------------------

  /** Load track `i` (index into content/music.ts) and play it, crossfading from the current one. */
  load(i: number, fadeS = CROSSFADE_S): Promise<void> {
    if (!tracks[i]) return Promise.resolve();
    const p = this.order.indexOf(i);
    if (p >= 0) this.pos = p;
    return this.switchTo(i, fadeS);
  }

  /** Start (the first time: track 1, faded in over 2 s) or resume. */
  async play(): Promise<void> {
    if (this.ctx.state === "suspended") await this.ctx.resume();
    if (!this.started) {
      this.started = true;
      const first = this.order[0];
      if (first !== undefined) await this.switchTo(first, FIRST_FADE_S);
      return;
    }
    const deck = this.activeDeck();
    if (deck.track < 0) return;
    try {
      await deck.el.play();
    } catch {
      return;
    }
    this.ramp(deck.gain, 1, RESUME_FADE_S, true);
    this.setPlaying(true);
  }

  /** Fade out quickly and pause both decks (a crossfade in flight stops too). */
  pause(): void {
    const id = ++this.switchId;
    for (const deck of this.decks) this.ramp(deck.gain, 0, PAUSE_FADE_S, false);
    this.setPlaying(false);
    setTimeout(
      () => {
        if (id !== this.switchId) return;
        for (const deck of this.decks) deck.el.pause();
      },
      PAUSE_FADE_S * 1000 + 20,
    );
  }

  next(): Promise<void> {
    if (!this.order.length) return Promise.resolve();
    this.pos = (this.pos + 1) % this.order.length;
    return this.switchTo(this.order[this.pos]!, CROSSFADE_S);
  }

  prev(): Promise<void> {
    if (!this.order.length) return Promise.resolve();
    if (this.getTime() > PREV_RESTART_S) {
      this.seek(0);
      return Promise.resolve();
    }
    this.pos = (this.pos - 1 + this.order.length) % this.order.length;
    return this.switchTo(this.order[this.pos]!, CROSSFADE_S);
  }

  /** Jump within the current track, with a 15 ms dip so the jump doesn't click. */
  seek(t: number): void {
    const deck = this.activeDeck();
    const duration = deck.el.duration;
    if (!Number.isFinite(duration)) return;
    const target = Math.min(Math.max(0, t), Math.max(0, duration - 0.05));
    this.ramp(deck.gain, 0, 0.015, false);
    setTimeout(() => {
      deck.el.currentTime = target;
      this.ramp(deck.gain, this.isPlaying() ? 1 : 0, 0.03, true);
    }, 20);
  }

  /** 0–1. Saved, and written to the store. */
  setVolume(v: number): void {
    this.applyVolume(v, false);
  }

  getTime(): number {
    return this.activeDeck().el.currentTime || 0;
  }

  getDuration(): number {
    const d = this.activeDeck().el.duration;
    return Number.isFinite(d) ? d : 0;
  }

  /** Where the current track sits in this visit's play order: "track 3 of 8" (1-based). */
  getQueuePosition(): { index: number; total: number } {
    return { index: this.pos + 1, total: this.order.length };
  }

  isPlaying(): boolean {
    return useStore.getState().audio.playing;
  }

  // --- Internals ----------------------------------------------------------------------------

  private applyVolume(v: number, immediate: boolean): void {
    const volume = Math.min(1, Math.max(0, v));
    const g = this.master.gain;
    const now = this.ctx.currentTime;
    const current = g.value;
    g.cancelScheduledValues(0);
    if (immediate) g.setValueAtTime(volume, now);
    else {
      g.setValueAtTime(current, now);
      g.setTargetAtTime(volume, now, 0.03);
    }
    useStore.getState().audio.setVolume(volume);
    storage.set(VOLUME_KEY, String(volume));
  }

  /**
   * Ramp a gain from where it is now to `to`, equal-power. A fade already in progress is NOT
   * removed by cancelScheduledValues(now) (its start time is in the past), and a new curve over
   * it throws; so read the current level, cancel everything (from 0), and start the new curve
   * from that level. (cancelAndHoldAtTime would do this, but Firefox lacks it.)
   */
  private ramp(
    gain: GainNode,
    to: number,
    seconds: number,
    rising: boolean,
  ): void {
    const g = gain.gain;
    const now = this.ctx.currentTime;
    const from = g.value;
    g.cancelScheduledValues(0);
    if (Math.abs(from - to) < 0.001) {
      g.setValueAtTime(to, now);
      return;
    }
    g.setValueCurveAtTime(curve(from, to, rising), now, seconds);
  }

  private empty(deck: Deck): void {
    clearTimeout(deck.cleanup);
    deck.cleanup = undefined;
    deck.el.pause();
    deck.el.removeAttribute("src");
    deck.el.load(); // drops the decoded buffer
    deck.track = -1;
  }

  private async switchTo(i: number, fadeS: number): Promise<void> {
    const track = tracks[i];
    if (!track) return;
    const id = ++this.switchId;
    this.started = true;
    if (this.ctx.state === "suspended") await this.ctx.resume();

    const from = this.activeDeck();
    const to = this.idleDeck();
    clearTimeout(to.cleanup);
    to.cleanup = undefined;

    // Reusing a deck that's still fading out: silence it first, or cutting it would click.
    if (to.gain.gain.value > 0.001) {
      this.ramp(to.gain, 0, SILENCE_S, false);
      await sleep(SILENCE_S * 1000 + 10);
      if (id !== this.switchId) return;
    }

    to.el.pause();
    to.el.src = track.src;
    to.track = i;
    to.el.currentTime = 0;
    this.active = 1 - this.active;
    useStore.getState().audio.setTrackIndex(i);

    try {
      await to.el.play();
    } catch (error) {
      if (id !== this.switchId) return;
      // A refused play() (autoplay policy) isn't a broken file; an aborted one lost a race.
      if (
        error instanceof DOMException &&
        (error.name === "AbortError" || error.name === "NotAllowedError")
      ) {
        this.setPlaying(false);
        return;
      }
      void this.failed(i);
      return;
    }
    if (id !== this.switchId) return;

    this.ramp(to.gain, 1, fadeS, true);
    if (from.track >= 0 && from !== to) {
      this.ramp(from.gain, 0, fadeS, false);
      clearTimeout(from.cleanup);
      from.cleanup = setTimeout(() => this.empty(from), fadeS * 1000 + 100);
    }
    this.setPlaying(true);
  }

  private async failed(i: number): Promise<void> {
    this.errors += 1;
    const track = tracks[i];
    if (this.errors >= MAX_ERRORS) {
      toast(copy.music.gaveUp, { kind: "error" });
      this.pause();
      return;
    }
    toast(copy.music.loadError(track?.title ?? ""), { kind: "error" });
    await this.next();
  }

  private setPlaying(playing: boolean): void {
    if (useStore.getState().audio.playing !== playing)
      useStore.getState().audio.setPlaying(playing);
  }
}

let engine: AudioEngine | null = null;

/** The engine, created on first use on the shared AudioContext (lib/audio/context.ts). */
export function getEngine(ctx: AudioContext): AudioEngine {
  engine ??= new AudioEngine(ctx);
  return engine;
}

/** The engine if it exists (the player reads time from it). */
export function peekEngine(): AudioEngine | null {
  return engine;
}

export type { AudioEngine };
