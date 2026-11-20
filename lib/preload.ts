/*
 * The preloader behind the entry gate (CLAUDE.md §9.1): a real 0–100% from actual downloads.
 *
 *   const { ready, done } = preload(preloadManifest, { onProgress });
 *   await ready;   // everything loaded, or 8 s passed (the visitor gets in either way)
 *   await done;    // everything has really finished (keeps going in the background)
 *
 * createEasedProgress() turns the real value into the number the gate shows: it eases toward
 * the real value on the shared GSAP ticker, never passes it and never goes backwards.
 */
import { getImageProps } from "next/image";
import type { PreloadEntry } from "@/content/preload";
import { storage } from "@/lib/browser";
import { gsap } from "@/lib/motion/gsap";

export type PreloadItemStatus = "pending" | "loading" | "done" | "failed";

export type PreloadItem = {
  id: string;
  weight: number;
  status: PreloadItemStatus;
  /** 0–1 of this asset. */
  fraction: number;
  /** Bytes received so far (fetched assets only). */
  bytes: number;
  url?: string;
  error?: string;
};

export type PreloadReport = {
  loadedWeight: number;
  totalWeight: number;
  /** loadedWeight / totalWeight, 0–1. */
  progress: number;
  items: PreloadItem[];
};

export type PreloadOptions = {
  /** Called whenever a byte arrives or an asset finishes. */
  onProgress?: (report: PreloadReport) => void;
  /** Let the visitor in after this long even if something hangs. Default 8000 ms. */
  timeoutMs?: number;
  /** Include `when: "sound"` entries. Default: the saved choice (localStorage "sound" = "1"). */
  soundChosen?: boolean;
};

export type PreloadRun = {
  /** Resolves when everything has loaded or the timeout passed, whichever is first. */
  ready: Promise<{ timedOut: boolean; report: PreloadReport }>;
  /** Resolves when every asset has finished (loaded or failed). */
  done: Promise<PreloadReport>;
};

const DEFAULT_TIMEOUT_MS = 8000;

/** The optimized next/image URL the browser will request for this entry on this screen. */
function imageUrl(entry: Extract<PreloadEntry, { kind: "image" }>): string {
  const { props } = getImageProps({
    src: entry.src,
    alt: "",
    width: entry.width,
    height: entry.height,
    sizes: entry.sizes,
  });
  const candidates = (props.srcSet ?? "")
    .split(",")
    .map((part) => {
      const [url, w] = part.trim().split(/\s+/);
      return { url: url ?? "", w: parseInt(w ?? "", 10) };
    })
    .filter((c) => c.url && Number.isFinite(c.w))
    .sort((a, b) => a.w - b.w);
  if (candidates.length === 0) return props.src;
  const needed = window.innerWidth * entry.vw * (window.devicePixelRatio || 1);
  return (candidates.find((c) => c.w >= needed) ??
    candidates[candidates.length - 1])!.url;
}

/** Fetch a URL, reading the body as a stream so progress moves with every chunk. */
async function fetchStreaming(
  url: string,
  range: [number, number] | undefined,
  onFraction: (fraction: number, bytes: number) => void,
): Promise<void> {
  const res = await fetch(url, {
    headers: range ? { Range: `bytes=${range[0]}-${range[1]}` } : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const total = Number(res.headers.get("content-length")) || 0;
  if (!res.body) {
    await res.arrayBuffer();
    onFraction(1, total);
    return;
  }
  const reader = res.body.getReader();
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    // Without a Content-Length there's nothing to divide by: it jumps to 1 when it ends.
    // (A compressed body can decode to more bytes than its length: clamp.)
    if (total > 0) onFraction(Math.min(1, received / total), received);
  }
  onFraction(1, received);
}

/** Fetch every critical asset and report real, weighted progress. Browser only. */
export function preload(
  manifest: PreloadEntry[],
  {
    onProgress,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    soundChosen = storage.get("sound") === "1",
  }: PreloadOptions = {},
): PreloadRun {
  const entries = manifest.filter((e) => e.when !== "sound" || soundChosen);
  const items: PreloadItem[] = entries.map((e) => ({
    id: e.id,
    weight: e.weight,
    status: "pending",
    fraction: 0,
    bytes: 0,
  }));
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);

  const report = (): PreloadReport => {
    const loadedWeight = items.reduce(
      (sum, i) => sum + i.weight * i.fraction,
      0,
    );
    return {
      loadedWeight,
      totalWeight,
      progress: totalWeight > 0 ? loadedWeight / totalWeight : 1,
      items: items.map((i) => ({ ...i })),
    };
  };
  const emit = () => onProgress?.(report());

  const loadOne = async (entry: PreloadEntry, item: PreloadItem) => {
    item.status = "loading";
    emit();
    try {
      if (entry.kind === "fonts") {
        await document.fonts.ready;
      } else {
        const url = entry.kind === "image" ? imageUrl(entry) : entry.url;
        item.url = url;
        await fetchStreaming(
          url,
          entry.kind === "url" ? entry.range : undefined,
          (fraction, bytes) => {
            item.fraction = fraction;
            item.bytes = bytes;
            emit();
          },
        );
      }
      item.status = "done";
    } catch (err) {
      // A missing or blocked asset must not freeze the bar: count it as finished, keep the error.
      item.status = "failed";
      item.error = err instanceof Error ? err.message : String(err);
    }
    item.fraction = 1;
    emit();
  };

  const done = Promise.all(entries.map((e, i) => loadOne(e, items[i]!))).then(
    report,
  );

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<{ timedOut: boolean; report: PreloadReport }>(
    (resolve) => {
      timer = setTimeout(
        () => resolve({ timedOut: true, report: report() }),
        timeoutMs,
      );
    },
  );
  const ready = Promise.race([
    done.then((r) => ({ timedOut: false, report: r })),
    timeout,
  ]).finally(() => clearTimeout(timer));

  emit();
  return { ready, done };
}

export type EasedProgress = {
  /** Feed the latest real progress (0–1). Lower values are ignored: it never goes back. */
  set: (real: number) => void;
  /** The number currently shown (0–1). */
  readonly value: number;
  stop: () => void;
};

/**
 * The displayed percentage: eases toward the real progress on gsap.ticker (no loop of its own),
 * never passes it and never goes backwards. onFrame receives the shown value (0–1) only when it
 * changes. Call stop() when the gate is gone.
 */
export function createEasedProgress(
  onFrame: (shown: number) => void,
  /** Time constant of the ease (s): about a third of the time it takes to catch up. */
  tau = 0.2,
): EasedProgress {
  let real = 0;
  let shown = 0;
  const tick = (_time: number, deltaMs: number) => {
    if (shown >= real) return;
    const k = 1 - Math.exp(-Math.min(deltaMs, 100) / 1000 / tau);
    let next = shown + (real - shown) * k;
    // Finish the last sliver instead of creeping toward it forever.
    if (real - next < 0.001) next = real;
    shown = Math.min(next, real);
    onFrame(shown);
  };
  gsap.ticker.add(tick);
  return {
    set: (value) => {
      real = Math.max(real, Math.min(1, Math.max(0, value)));
    },
    get value() {
      return shown;
    },
    stop: () => gsap.ticker.remove(tick),
  };
}
