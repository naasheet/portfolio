/*
 * The terminal's session (6.1): the scrollback and whether a command is running. It lives
 * outside React so it survives closing the drawer (the panel unmounts; the session doesn't) and
 * so commands (6.2) can print without holding a component. Read it with
 * useSyncExternalStore(subscribeSession, getSession).
 */
import type { Entry, OutputLine } from "./types";

/** Scrollback cap (6.1): the oldest lines drop past this. */
export const MAX_LINES = 500;

export type Session = {
  entries: Entry[];
  running: boolean;
  /** The welcome banner (6.1): there from the first open of a visit until Ctrl+L clears it. */
  banner: boolean;
};

let state: Session = { entries: [], running: false, banner: true };
let nextId = 1;
let controller: AbortController | null = null;
const listeners = new Set<() => void>();

function set(partial: Partial<Session>) {
  state = { ...state, ...partial };
  for (const l of listeners) l();
}

export const session = {
  print(line: OutputLine | OutputLine[]): void {
    const lines = Array.isArray(line) ? line : [line];
    if (lines.length === 0) return;
    const added = lines.map((l) => ({ id: nextId++, line: l }));
    const entries = [...state.entries, ...added];
    set({ entries: entries.slice(Math.max(0, entries.length - MAX_LINES)) });
  },
  /** Ctrl+L / `clear`: the scrollback and the banner go. */
  clear(): void {
    set({ entries: [], banner: false });
  },
  /** Start a command; returns its signal. */
  begin(): AbortSignal {
    controller?.abort();
    controller = new AbortController();
    set({ running: true });
    return controller.signal;
  },
  end(): void {
    controller = null;
    if (state.running) set({ running: false });
  },
  /** Ctrl+C: true if a running command was cancelled. */
  cancel(): boolean {
    if (!controller) return false;
    controller.abort();
    return true;
  },
};

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSession(): Session {
  return state;
}

const SERVER: Session = { entries: [], running: false, banner: true };
export function getServerSession(): Session {
  return SERVER;
}
