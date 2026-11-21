/*
 * Canvas quality tiers (CLAUDE.md §6, chunk 3.6). The canvas starts at a tier picked from the
 * device's hardware and steps down (never up) when drei's PerformanceMonitor reports slow frames.
 * A step changes only the draw range and the DPR cap, never the geometry. Plain module: no three,
 * so DOM code (components/layer/CanvasLoader) can import it.
 */

export type TierName = "high" | "medium" | "low";

export type Tier = {
  /** Particles drawn (the draw range; the geometry always holds 40k). */
  count: number;
  /** DPR cap: the canvas renders at min(devicePixelRatio, dpr), never below 1. */
  dpr: number;
  /** Point size multiplier, so fewer particles still draw a solid shape. */
  pointScale: number;
};

export const TIERS: Record<TierName, Tier> = {
  high: { count: 40_000, dpr: 1.75, pointScale: 1 },
  medium: { count: 24_000, dpr: 1.5, pointScale: 1.1 },
  low: { count: 12_000, dpr: 1, pointScale: 1.2 },
};

/**
 * The starting tier. Low: 2 cores or fewer, or 2 GB or less. Medium: touch, 4 cores or fewer,
 * 4 GB or less, or a screen whose short side is under 500 px. Otherwise high. deviceMemory only
 * exists in Chromium; where it's missing it doesn't count.
 */
export function pickTier(): TierName {
  if (typeof window === "undefined") return "medium";
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  const touch = window.matchMedia(
    "(hover: none) and (pointer: coarse)",
  ).matches;
  const short = Math.min(window.screen.width, window.screen.height);
  if (cores <= 2 || (memory !== undefined && memory <= 2)) return "low";
  if (
    touch ||
    cores <= 4 ||
    (memory !== undefined && memory <= 4) ||
    short < 500
  )
    return "medium";
  return "high";
}

/** One tier lower (low stays low). */
export function stepDown(tier: TierName): TierName {
  return tier === "high" ? "medium" : "low";
}

let webglSupport: boolean | undefined;

/** True when the browser can make a WebGL context. Checked once per page load. */
export function hasWebGL(): boolean {
  if (webglSupport !== undefined) return webglSupport;
  if (typeof document === "undefined") return false;
  try {
    const probe = document.createElement("canvas");
    const ctx = probe.getContext("webgl2") ?? probe.getContext("webgl");
    webglSupport = ctx !== null;
    ctx?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}
