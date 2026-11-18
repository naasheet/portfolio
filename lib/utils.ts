import { clsx, type ClassValue } from "clsx";
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
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...TEXT_TOKENS] }],
    },
  },
});

/** Merge conditional class names, letting later Tailwind classes win conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
