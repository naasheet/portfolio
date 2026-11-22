/*
 * Command history (6.1): the last 50 commands, saved in localStorage through the safe helpers,
 * and the ↑ / ↓ walk through them. Walking up keeps the half-typed line as a draft, and walking
 * back down past the newest entry restores it, as bash does.
 */
import { storage } from "@/lib/browser";

const KEY = "terminal-history";
export const MAX_HISTORY = 50;

function load(): string[] {
  const raw = storage.get(KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .filter((x): x is string => typeof x === "string")
          .slice(-MAX_HISTORY)
      : [];
  } catch {
    return [];
  }
}

export function createHistory() {
  let items = load();
  /** -1: editing the draft; 0: the newest entry; up to items.length - 1. */
  let index = -1;
  let draft = "";

  return {
    /** Record a command that ran (blank lines and an immediate repeat are skipped). */
    push(command: string): void {
      index = -1;
      draft = "";
      const c = command.trim();
      if (!c || items[items.length - 1] === c) return;
      items = [...items, c].slice(-MAX_HISTORY);
      storage.set(KEY, JSON.stringify(items));
    },
    /** ↑: the previous command, or null at the oldest. */
    up(current: string): string | null {
      if (index + 1 >= items.length) return null;
      if (index === -1) draft = current;
      index += 1;
      return items[items.length - 1 - index] ?? null;
    },
    /** ↓: the next command, the draft past the newest, or null if already editing the draft. */
    down(): string | null {
      if (index === -1) return null;
      index -= 1;
      return index === -1 ? draft : (items[items.length - 1 - index] ?? null);
    },
    /** Typing after walking the history edits that line as a new draft. */
    reset(): void {
      index = -1;
    },
    all(): readonly string[] {
      return items;
    },
  };
}

export type History = ReturnType<typeof createHistory>;
