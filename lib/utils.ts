import { clsx, type ClassValue } from "clsx";
import type { Ref, RefCallback } from "react";
import { extendTailwindMerge } from "tailwind-merge";

/** Custom text-style tokens from app/globals.css. Keep in sync with the @utility list there. */
const TEXT_TOKENS = [
  "stat-1",
  "stat-2",
  "stat-3",
  "large-title",
  "title-1",
  "title-2",
  "title-3",
  "headline",
  "body",
  "callout",
  "subhead",
  "footnote",
  "caption-1",
  "caption-2",
] as const;

// Without this, tailwind-merge reads `text-title-1` as a text colour and would drop it
// when merged with a real colour class like `text-foreground`.
// Radius, blur and z-index tokens from app/globals.css, so later classes win conflicts.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["card", "control", "chip", "key"],
      blur: ["glass"],
    },
    classGroups: {
      "font-size": [{ text: [...TEXT_TOKENS] }],
      z: [
        {
          z: [
            "canvas",
            "content",
            "persistent",
            "overlay",
            "toast",
            "gate",
            "cursor",
          ],
        },
      ],
    },
  },
});

/** Merge conditional class names, letting later Tailwind classes win conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Point several refs (callback or object) at one element, e.g. an internal ref plus the caller's. */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(value);
      else if (ref) (ref as { current: T | null }).current = value;
    }
  };
}
