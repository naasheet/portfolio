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
  /** A command asked a question (ctx.prompt, 6.2): the next Enter answers it. */
  asking: string | null;
  /** The working directory (6.2; the filesystem and `cd` arrive in 6.3). */
  cwd: string;
};

let state: Session = {
  entries: [],
  running: false,
  banner: true,
  asking: null,
  cwd: "~",
};
let nextId = 1;
let controller: AbortController | null = null;
let answer: ((value: string) => void) | null = null;
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
    answer = null;
    if (state.running || state.asking) set({ running: false, asking: null });
  },
  /**
   * ctx.prompt: print the question and wait for the next line. Rejects when the command is
   * cancelled (Ctrl+C), so a waiting command ends like any other.
   */
  ask(question: string, signal: AbortSignal): Promise<string> {
    session.print({ kind: "text", text: question, tone: "accent" });
    set({ asking: question });
    return new Promise((resolve, reject) => {
      answer = (value) => {
        answer = null;
        set({ asking: null });
        resolve(value);
      };
      signal.addEventListener(
        "abort",
        () => {
          answer = null;
          set({ asking: null });
          reject(new DOMException("Cancelled", "AbortError"));
        },
        { once: true },
      );
    });
  },
  /** Enter while a question is open: true if it took the line. */
  answer(value: string): boolean {
    if (!answer) return false;
    session.print({ kind: "text", text: `> ${value}`, tone: "muted" });
    answer(value);
    return true;
  },
  setCwd(cwd: string): void {
    if (cwd !== state.cwd) set({ cwd });
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

const SERVER: Session = {
  entries: [],
  running: false,
  banner: true,
  asking: null,
  cwd: "~",
};
export function getServerSession(): Session {
  return SERVER;
}
