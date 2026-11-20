"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import type { PreloadEntry } from "@/content/preload";
import {
  createEasedProgress,
  preload,
  type EasedProgress,
  type PreloadReport,
} from "@/lib/preload";
import sampleSquare from "./media/sample-square.jpg";
import sampleWide from "./media/sample-wide.jpg";

/**
 * A dev-only manifest of the placeholder media, so the preloader can be watched under DevTools
 * throttling. URL entries get a cache-buster per run; next/image URLs are fixed, so the images
 * come from the HTTP cache after the first run (use DevTools "Disable cache" to repeat them).
 */
function devManifest(run: number, withMissing: boolean): PreloadEntry[] {
  const entries: PreloadEntry[] = [
    { id: "fonts", kind: "fonts", weight: 258 },
    {
      id: "sample-wide",
      kind: "image",
      src: sampleWide,
      width: 1600,
      height: 900,
      sizes: "(min-width: 768px) 33vw, 100vw",
      vw: 0.33,
      // Measured: the optimized 640 w AVIF is ~6 KB on the wire.
      weight: 6,
    },
    {
      id: "sample-square",
      kind: "image",
      src: sampleSquare,
      width: 512,
      height: 512,
      sizes: "(min-width: 768px) 33vw, 100vw",
      vw: 0.33,
      weight: 7,
    },
    {
      id: "loop-video",
      kind: "url",
      url: `/dev/loop.webm?run=${run}`,
      weight: 43,
    },
    {
      id: "loop-poster",
      kind: "url",
      url: `/dev/loop-poster.jpg?run=${run}`,
      weight: 6,
    },
  ];
  if (withMissing) {
    entries.push({
      id: "missing",
      kind: "url",
      url: `/dev/missing.bin?run=${run}`,
      weight: 20,
    });
  }
  return entries;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

/** Run the preloader on placeholder assets and show real vs displayed progress. */
export function PreloadSpecimen() {
  const [run, setRun] = useState(0);
  const [withMissing, setWithMissing] = useState(false);
  const [report, setReport] = useState<PreloadReport | null>(null);
  const [status, setStatus] = useState("Not started");
  const shownText = useRef<HTMLSpanElement>(null);
  const shownBar = useRef<HTMLDivElement>(null);
  const eased = useRef<EasedProgress | null>(null);

  useEffect(() => () => eased.current?.stop(), []);

  const start = () => {
    const next = run + 1;
    setRun(next);
    setStatus("Loading…");
    eased.current?.stop();
    if (shownText.current) shownText.current.textContent = "0%";
    if (shownBar.current) shownBar.current.style.transform = "scaleX(0)";
    // The shown value is written straight to the DOM: no React render per frame.
    eased.current = createEasedProgress((shown) => {
      if (shownText.current) shownText.current.textContent = pct(shown);
      if (shownBar.current)
        shownBar.current.style.transform = `scaleX(${shown})`;
    });
    const t0 = performance.now();
    const { ready, done } = preload(devManifest(next, withMissing), {
      onProgress: (r) => {
        eased.current?.set(r.progress);
        setReport(r);
      },
    });
    void ready.then(({ timedOut }) =>
      setStatus(
        `${timedOut ? "Let in after the 8 s timeout" : "Ready"} at ${Math.round(performance.now() - t0)} ms`,
      ),
    );
    void done.then(() =>
      setStatus(
        (s) =>
          `${s} · everything finished at ${Math.round(performance.now() - t0)} ms`,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={start}>Run preload</Button>
        <Chip selected={withMissing} onClick={() => setWithMissing((v) => !v)}>
          Include a missing asset (404)
        </Chip>
        <span className="text-footnote text-text-tertiary">{status}</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-6 font-mono">
          <span
            className="text-title-2 tabular-nums"
            aria-label="Displayed progress"
          >
            <span ref={shownText}>0%</span>
          </span>
          <span className="text-footnote text-text-tertiary tabular-nums">
            real {report ? pct(report.progress) : "0%"} ·{" "}
            {report ? Math.round(report.loadedWeight) : 0} /{" "}
            {report?.totalWeight ?? 0} weight
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-chip bg-border-default">
          <div
            ref={shownBar}
            className="h-full w-full origin-left bg-accent-primary"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>

      {report ? (
        <table className="w-full text-left text-caption-1 font-mono text-text-secondary">
          <thead className="text-text-tertiary">
            <tr>
              <th className="py-1 font-normal">asset</th>
              <th className="py-1 font-normal">status</th>
              <th className="py-1 font-normal">weight</th>
              <th className="py-1 font-normal">received</th>
              <th className="py-1 font-normal">url</th>
            </tr>
          </thead>
          <tbody>
            {report.items.map((i) => (
              <tr key={i.id} className="border-t border-border-default">
                <td className="py-1">{i.id}</td>
                <td className="py-1">
                  {i.status} {pct(i.fraction)}
                  {i.error ? ` (${i.error})` : ""}
                </td>
                <td className="py-1 tabular-nums">{i.weight}</td>
                <td className="py-1 tabular-nums">
                  {i.bytes ? `${(i.bytes / 1024).toFixed(1)} KB` : "—"}
                </td>
                <td className="max-w-64 truncate py-1">
                  {i.url ?? "document.fonts.ready"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
