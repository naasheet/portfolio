/*
 * The terminal's output model (6.1). Commands (6.2+) print these through ctx.print; Line.tsx
 * draws each kind. Plain data except `node`, the escape hatch for rich output.
 */
import type { ReactNode } from "react";

export type OutputLine =
  /** A command as it was typed, after the prompt. */
  | { kind: "input"; text: string }
  | {
      kind: "text";
      text: string;
      tone?: "muted" | "accent";
      /** Ranges to highlight ([start, end) in `text`), e.g. grep's matches. */
      marks?: [number, number][];
    }
  | { kind: "error"; text: string }
  /** Site paths ("/work") navigate in place; anything else opens in a new tab. */
  | { kind: "link"; text: string; href: string }
  | { kind: "table"; head?: string[]; rows: string[][] }
  /** Pre-formatted art (neofetch, banners): kept exactly, scrolls sideways if too wide. */
  | { kind: "ascii"; text: string }
  | { kind: "node"; node: ReactNode };

export type EntryId = number;
export type Entry = { id: EntryId; line: OutputLine };
