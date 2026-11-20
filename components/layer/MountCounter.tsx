"use client";

import { useEffect, useRef } from "react";

// Module scope: survives client-side navigation, so a remount of the layer shows up as > 1
// (React StrictMode double-runs effects in dev, so dev starts at 2).
let mounts = 0;

/**
 * Counts how often the persistent layer mounts (chunk 2.3's check). Writes the count to
 * `data-mounts` on its parent, so tests can read it, and logs it in development.
 */
export function MountCounter() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    mounts += 1;
    const parent = ref.current?.parentElement;
    if (parent) parent.dataset.mounts = String(mounts);
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[layer] persistent layer mounted (${mounts})`);
    }
  }, []);

  return <span ref={ref} hidden />;
}
