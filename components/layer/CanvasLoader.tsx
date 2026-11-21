"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { CanvasFallback } from "@/components/ui/CanvasFallback";
import { hasWebGL } from "@/lib/quality";

// Client only and loaded after hydration (CLAUDE.md §5.7): the canvas never renders on the server.
const CanvasRoot = dynamic(
  () => import("@/canvas/CanvasRoot").then((mod) => mod.CanvasRoot),
  { ssr: false },
);

const subscribe = () => () => {};

/**
 * Mounts the canvas once in app/layout.tsx. WebGL is checked first (3.6): without it the
 * CSS gradient shows and the canvas chunk (three, R3F) is never downloaded. The server and
 * hydration render nothing ("unknown"), so there's no mismatch.
 */
export function CanvasLoader() {
  const webgl = useSyncExternalStore<boolean | null>(
    subscribe,
    hasWebGL,
    () => null,
  );
  if (webgl === null) return null;
  return webgl ? <CanvasRoot /> : <CanvasFallback />;
}
