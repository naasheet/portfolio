"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useIsTouch } from "@/lib/hooks/useIsTouch";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { usePageVisible } from "@/lib/hooks/usePageVisible";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { gsap } from "@/lib/motion/gsap";
import { useStore, type ArStatus, type StoreState } from "@/lib/store";

// TEMPORARY (chunk 0.5): store test page with hardcoded strings. Delete in chunk 0.6.

const buttonClass =
  "rounded-control border border-border-default bg-surface-solid px-4 py-2 text-subhead transition-colors hover:border-border-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus active:scale-[0.97] disabled:opacity-40";

/** Counts commits without reading a ref during render: writes the count straight into a span. */
function useRenderCount(): RefObject<HTMLSpanElement | null> {
  const span = useRef<HTMLSpanElement>(null);
  const count = useRef(0);
  useEffect(() => {
    count.current += 1;
    if (span.current) span.current.textContent = String(count.current);
  });
  return span;
}

function Flag({
  label,
  select,
  toggle,
}: {
  label: string;
  select: (s: StoreState) => boolean | string;
  toggle: () => void;
}) {
  const value = useStore(select);
  return (
    <button type="button" onClick={toggle} className={buttonClass}>
      <span className="text-text-secondary">{label}</span>{" "}
      <span className="font-mono">{String(value)}</span>
    </button>
  );
}

const statuses: ArStatus[] = ["off", "loading", "ready", "denied", "error"];

/** Fake audio engine: writes levels, beat, hand and progress every frame. */
function useFakeFastValues(running: boolean) {
  useEffect(() => {
    if (!running) return;
    const tick = (time: number) => {
      const { audio, ar, scroll } = useStore.getState();
      const bass = (Math.sin(time * 4) + 1) / 2;
      audio.setLevels(
        {
          bass,
          mid: (Math.sin(time * 6 + 1) + 1) / 2,
          high: (Math.sin(time * 9 + 2) + 1) / 2,
        },
        bass > 0.95,
      );
      ar.setHand({
        x: (Math.sin(time) + 1) / 2,
        y: (Math.cos(time) + 1) / 2,
        visible: true,
      });
      scroll.setProgress((time / 4) % 1);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [running]);
}

/** The right way: reads fast values with getState() on the ticker, writes to the DOM via refs. */
function GoodMeter() {
  const renders = useRenderCount();
  const bars = useRef<(HTMLDivElement | null)[]>([]);
  const readout = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const tick = () => {
      const { audio, ar, scroll } = useStore.getState();
      const values = [
        audio.levels.bass,
        audio.levels.mid,
        audio.levels.high,
        scroll.progress,
      ];
      values.forEach((v, i) => {
        const bar = bars.current[i];
        if (bar) bar.style.transform = `scaleX(${v})`;
      });
      if (readout.current) {
        readout.current.textContent = `hand ${ar.hand.x.toFixed(2)}, ${ar.hand.y.toFixed(2)}${audio.beat ? " · beat" : ""}`;
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <div className="flex flex-col gap-2 rounded-card border border-border-default bg-glass-fill p-6 backdrop-blur-glass">
      <p className="text-headline">getState() reader</p>
      <p className="text-footnote text-text-secondary">
        Renders: <span ref={renders} className="font-mono" /> (should stay put
        while values move)
      </p>
      {["bass", "mid", "high", "progress"].map((name, i) => (
        <div key={name} className="flex items-center gap-4">
          <span className="w-20 text-caption-1 text-text-tertiary">{name}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-chip bg-border-default">
            <div
              ref={(el) => {
                bars.current[i] = el;
              }}
              className="h-full w-full origin-left scale-x-0 bg-accent-primary"
            />
          </div>
        </div>
      ))}
      <span
        ref={readout}
        className="text-caption-1 font-mono text-text-tertiary"
      />
    </div>
  );
}

/** The wrong way, for contrast: subscribes to a fast value, so it re-renders every frame. */
function BadMeter() {
  const renders = useRenderCount();
  const bass = useStore((s) => s.audio.levels.bass);
  return (
    <div className="flex flex-col gap-2 rounded-card border border-border-default bg-glass-fill p-6 backdrop-blur-glass">
      <p className="text-headline">Subscribed reader (don&apos;t do this)</p>
      <p className="text-footnote text-text-secondary">
        Renders: <span ref={renders} className="font-mono" /> · bass{" "}
        <span className="font-mono">{bass.toFixed(2)}</span>
      </p>
    </div>
  );
}

function Hooks() {
  const touch = useIsTouch();
  const visible = usePageVisible();
  const reduced = useReducedMotion();
  const wide = useMediaQuery("(min-width: 1024px)");
  return (
    <p className="text-caption-1 font-mono text-text-secondary">
      useIsTouch {String(touch)} · usePageVisible {String(visible)} ·
      useReducedMotion {String(reduced)} · useMediaQuery(min-width 1024){" "}
      {String(wide)}
    </p>
  );
}

/** Owns its own state, so starting the fake engine doesn't re-render the meters. */
function FakeLevelsButton() {
  const [running, setRunning] = useState(false);
  useFakeFastValues(running);
  return (
    <button
      type="button"
      className={buttonClass}
      onClick={() => setRunning((r) => !r)}
    >
      {running ? "Stop fake levels" : "Start fake levels"}
    </button>
  );
}

export function StoreTest() {
  const s = useStore.getState;
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 p-6">
      <h1 className="text-large-title">Store test</h1>
      <Hooks />

      <section className="flex flex-col gap-4">
        <h2 className="text-title-3">Flags</h2>
        <div className="flex flex-wrap gap-2">
          <Flag
            label="audio.enabled"
            select={(x) => x.audio.enabled}
            toggle={() => s().audio.setEnabled(!s().audio.enabled)}
          />
          <Flag
            label="audio.playing"
            select={(x) => x.audio.playing}
            toggle={() => s().audio.togglePlaying()}
          />
          <Flag
            label="ar.enabled"
            select={(x) => x.ar.enabled}
            toggle={() => s().ar.toggle()}
          />
          <Flag
            label="ar.pinching"
            select={(x) => x.ar.pinching}
            toggle={() => s().ar.setPinching(!s().ar.pinching)}
          />
          <Flag
            label="ar.status"
            select={(x) => x.ar.status}
            toggle={() =>
              s().ar.setStatus(
                statuses[
                  (statuses.indexOf(s().ar.status) + 1) % statuses.length
                ] ?? "off",
              )
            }
          />
          <Flag
            label="ui.entered"
            select={(x) => x.ui.entered}
            toggle={() => s().ui.setEntered(!s().ui.entered)}
          />
          <Flag
            label="ui.soundEnabled (saved)"
            select={(x) => x.ui.soundEnabled}
            toggle={() => s().ui.toggleSound()}
          />
          <Flag
            label="ui.terminalOpen"
            select={(x) => x.ui.terminalOpen}
            toggle={() => s().ui.toggleTerminal()}
          />
          <Flag
            label="ui.chatOpen"
            select={(x) => x.ui.chatOpen}
            toggle={() => s().ui.toggleChat()}
          />
          <Flag
            label="ui.chatStreaming"
            select={(x) => x.ui.chatStreaming}
            toggle={() => s().ui.setChatStreaming(!s().ui.chatStreaming)}
          />
          <Flag
            label="ui.shortcutsOpen"
            select={(x) => x.ui.shortcutsOpen}
            toggle={() => s().ui.toggleShortcuts()}
          />
          <Flag
            label="theme.mode (saved)"
            select={(x) => x.theme.mode}
            toggle={() => s().theme.toggleMode()}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Flag
            label="audio.volume −"
            select={(x) => x.audio.volume.toFixed(1)}
            toggle={() => s().audio.setVolume(s().audio.volume - 0.1)}
          />
          <Flag
            label="audio.volume +"
            select={(x) => x.audio.volume.toFixed(1)}
            toggle={() => s().audio.setVolume(s().audio.volume + 0.1)}
          />
          <Flag
            label="audio.trackIndex +"
            select={(x) => String(x.audio.trackIndex)}
            toggle={() => s().audio.setTrackIndex(s().audio.trackIndex + 1)}
          />
          <Flag
            label="scroll.chapter +"
            select={(x) => String(x.scroll.chapter)}
            toggle={() => s().scroll.setChapter(s().scroll.chapter + 1)}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-title-3">Fast values</h2>
        <FakeLevelsButton />
        <GoodMeter />
        <BadMeter />
      </section>
    </main>
  );
}
