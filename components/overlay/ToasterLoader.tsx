"use client";

import dynamic from "next/dynamic";
import { copy } from "@/content/copy";

// Loaded after hydration, so it costs nothing in first-load JS. toast() calls made before it
// arrives wait in the queue (lib/toast.ts) and show as soon as it mounts.
const Toaster = dynamic(() => import("./Toast").then((mod) => mod.Toaster), {
  ssr: false,
});

/** Mounts the Toaster once in app/layout.tsx. */
export function ToasterLoader() {
  return <Toaster dismissLabel={copy.ui.dismiss} />;
}
