"use client";

import { ScrambleText } from "@/components/motion/ScrambleText";

/**
 * The gate's current loading line, scrambled in on every change (ScrambleText, trigger "mount";
 * the key remounts it). Loaded after hydration by EntryGate, which renders the first line as the
 * fallback, so ScrambleText stays out of first-load JS on `/`.
 */
export function GateLine({ text }: { text: string }) {
  return (
    <span key={text} className="gate-line">
      <ScrambleText text={text} trigger="mount" />
    </span>
  );
}
