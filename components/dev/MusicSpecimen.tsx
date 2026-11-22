"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { tracks } from "@/content/music";
import { gsap } from "@/lib/motion/gsap";
import { getMusic, startMusic } from "@/lib/music";
import { useStore } from "@/lib/store";
import { DevState } from "./DevState";

/**
 * The music engine (5.1) without a player (that's 5.2): start / pause / prev / next / volume,
 * the clock read straight from the engine, and the analyser's level. Also exposes the engine as
 * window.__music for test scripts (this page only, never linked from the site).
 */
export function MusicSpecimen() {
  const playing = useStore((s) => s.audio.playing);
  const index = useStore((s) => s.audio.trackIndex);
  const volume = useStore((s) => s.audio.volume);
  const clock = useRef<HTMLSpanElement>(null);
  const meter = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    (window as unknown as { __music?: unknown }).__music = {
      getMusic,
      startMusic,
    };
    const data = new Float32Array(1024);
    const tick = () => {
      const m = getMusic();
      if (!m) return;
      if (clock.current) {
        clock.current.textContent = `${m.getTime().toFixed(1)} / ${m.getDuration().toFixed(1)} s`;
      }
      m.analyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += v * v;
      if (meter.current)
        meter.current.style.transform = `scaleX(${Math.min(1, Math.sqrt(sum / data.length) * 4)})`;
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      delete (window as unknown as { __music?: unknown }).__music;
    };
  }, []);

  const turnOn = () => {
    if (!useStore.getState().ui.soundEnabled)
      useStore.getState().ui.setSoundEnabled(true);
    void startMusic();
  };

  return (
    <div className="flex flex-col gap-6">
      <DevState label="Engine">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={turnOn}>Sound on + start</Button>
          <Button variant="secondary" onClick={() => getMusic()?.pause()}>
            Pause
          </Button>
          <Button variant="secondary" onClick={() => void getMusic()?.play()}>
            Play
          </Button>
          <Button variant="secondary" onClick={() => void getMusic()?.prev()}>
            Prev
          </Button>
          <Button variant="secondary" onClick={() => void getMusic()?.next()}>
            Next
          </Button>
          <label className="flex items-center gap-2 text-footnote text-text-secondary">
            Volume
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => getMusic()?.setVolume(Number(e.target.value))}
            />
          </label>
        </div>
      </DevState>
      <DevState label="State (store: playing, trackIndex, volume · engine: time · analyser: level)">
        <div className="flex flex-col gap-2 text-footnote font-mono text-text-secondary">
          <span data-music-state={`${playing ? "playing" : "paused"}:${index}`}>
            {playing ? "playing" : "paused"} · #{index + 1}{" "}
            {tracks[index]?.artist} – {tracks[index]?.title} · vol{" "}
            {volume.toFixed(2)}
          </span>
          <span ref={clock}>0.0 / 0.0 s</span>
          <span className="block h-1.5 w-64 overflow-hidden rounded-chip bg-border-default">
            <span
              ref={meter}
              className="block h-full origin-left scale-x-0 bg-accent-primary"
            />
          </span>
        </div>
      </DevState>
    </div>
  );
}
