"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import { terminalCopy } from "@/content/terminal";
import { execute } from "@/lib/commands/exec";
import { getFs } from "@/lib/fs";
import { complete } from "@/lib/commands/registry";
import { useStore } from "@/lib/store";
import { onTypingSound } from "@/lib/sfx";
import { getHistory, type History } from "@/lib/terminal/history";
import {
  getServerSession,
  getSession,
  session,
  subscribeSession,
} from "@/lib/terminal/session";
import { cn } from "@/lib/utils";
import { Line } from "./Line";
import { Prompt } from "./Prompt";
import { Welcome } from "./Welcome";

const t = terminalCopy.terminal;

/**
 * The shell (6.1; Overlays board, Drawer). SF Mono at Footnote size on the island's near-black.
 *
 *   Output    role="log", aria-live="polite": new lines are announced. The scrollback lives in
 *             lib/terminal/session.ts (500 lines max), so it survives closing the drawer.
 *   Input     a real <input> (paste, IME and phone keyboards work natively) with its own caret
 *             hidden; an amber block caret is moved to the caret position by transform (no
 *             re-render), solid and blinking while focused, hollow when not.
 *   Engine    lines run through lib/commands (6.2: parser, registry, pipes); a command's
 *             ctx.prompt() makes the next Enter an answer ("> ").
 *   Keys      Enter runs · ↑ ↓ history (last 50, localStorage) · Tab completes · Ctrl+L
 *             clears · Ctrl+C cancels a running command (or abandons the line, "^C"; with text
 *             selected it copies as usual) · Esc closes (the Drawer's).
 */
export function Terminal() {
  const router = useRouter();
  const { entries, running, banner, asking, cwd } = useSyncExternalStore(
    subscribeSession,
    getSession,
    getServerSession,
  );
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const caret = useRef<HTMLSpanElement>(null);
  const measure = useRef<HTMLSpanElement>(null);
  const history = useRef<History | null>(null);
  const charWidth = useRef(0);

  useEffect(() => {
    history.current ??= getHistory();
  }, []);

  // Keep the newest line in view: the Drawer's body is the scroller.
  useLayoutEffect(() => {
    const scroller = root.current?.parentElement;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }, [entries, running, banner]);

  /** Move the block caret to the input's caret (monospace: position × one character's width). */
  const placeCaret = () => {
    const el = input.current;
    const block = caret.current;
    if (!el || !block) return;
    if (!charWidth.current && measure.current)
      charWidth.current = measure.current.getBoundingClientRect().width / 10;
    const pos = el.selectionStart ?? el.value.length;
    block.style.transform = `translateX(${pos * charWidth.current - el.scrollLeft}px)`;
  };

  const run = async (raw: string) => {
    session.print({ kind: "input", text: raw, cwd: getSession().cwd });
    history.current?.push(raw);
    if (!raw.trim()) return;
    const signal = session.begin();
    try {
      await execute(raw, { router, signal });
    } catch (error) {
      if (signal.aborted)
        session.print({ kind: "text", text: "^C", tone: "muted" });
      else
        session.print({
          kind: "error",
          text: error instanceof Error ? error.message : String(error),
        });
    } finally {
      session.end();
      requestAnimationFrame(() =>
        input.current?.focus({ preventScroll: true }),
      );
    }
  };

  const setInput = (value: string, caretAt = value.length) => {
    const el = input.current;
    if (!el) return;
    el.value = value;
    el.setSelectionRange(caretAt, caretAt);
    placeCaret();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onTypingSound(e);
    const el = e.currentTarget;
    const ctrl = e.ctrlKey && !e.metaKey && !e.altKey;

    if (e.key === "Enter") {
      e.preventDefault();
      if (e.nativeEvent.isComposing) return;
      const value = el.value;
      // A command is waiting for an answer (ctx.prompt): this line is it.
      if (asking !== null) {
        setInput("");
        session.answer(value);
        return;
      }
      if (running) return;
      setInput("");
      void run(value);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const next =
        e.key === "ArrowUp"
          ? history.current?.up(el.value)
          : history.current?.down();
      if (next !== null && next !== undefined) setInput(next);
    } else if (e.key === "Tab" && !e.shiftKey) {
      // Shift+Tab still leaves the input (to the close button); Esc closes.
      e.preventDefault();
      if (running) return;
      const result = complete(el.value, el.selectionStart ?? el.value.length, {
        store: useStore,
        fs: getFs(),
        cwd: getSession().cwd,
      });
      if (result.kind === "replace") setInput(result.input, result.caret);
      else if (result.kind === "list")
        session.print({
          kind: "text",
          text: result.candidates.join("  "),
          tone: "muted",
        });
    } else if (ctrl && e.key.toLowerCase() === "l") {
      e.preventDefault();
      session.clear();
    } else if (ctrl && e.key.toLowerCase() === "c") {
      // Copying selected text wins, as in any text field.
      const selected =
        el.selectionStart !== el.selectionEnd ||
        (window.getSelection()?.toString() ?? "") !== "";
      if (selected) return;
      e.preventDefault();
      if (session.cancel()) return; // run() prints ^C
      session.print({ kind: "input", text: `${el.value}^C` });
      history.current?.reset();
      setInput("");
    }
    requestAnimationFrame(placeCaret);
  };

  // A click anywhere in the terminal focuses the input, unless it was a link, a button, or the
  // end of a text selection (copying output must keep working).
  const onMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    if (!(e.target instanceof Element) || e.target.closest("a, button, input"))
      return;
    if ((window.getSelection()?.toString() ?? "") !== "") return;
    input.current?.focus({ preventScroll: true });
  };

  return (
    <div
      ref={root}
      onMouseUp={onMouseUp}
      className="min-h-full cursor-text pb-4 text-footnote font-mono text-island-text"
    >
      {/* One character's width, for the block caret. */}
      <span
        ref={measure}
        aria-hidden
        className="pointer-events-none invisible absolute whitespace-pre"
      >
        0000000000
      </span>

      {banner ? <Welcome onRun={(command) => void run(command)} /> : null}

      <div role="log" aria-live="polite" aria-label={t.outputLabel}>
        {entries.map((entry) =>
          // A live status line (a progress bar redrawing) is hidden from screen readers until
          // it settles; then it's announced once.
          entry.live ? (
            <div key={entry.id} aria-hidden>
              <Line line={entry.line} />
            </div>
          ) : (
            <Line key={entry.id} line={entry.line} />
          ),
        )}
      </div>

      <div
        className={cn(
          "flex items-center",
          // No prompt while a command runs (as in a real shell); the input keeps focus.
          running && asking === null && "opacity-0",
        )}
      >
        {asking !== null ? (
          <span aria-hidden className="shrink-0 text-island-accent">
            {"> "}
          </span>
        ) : (
          <Prompt cwd={cwd} />
        )}
        <span className="relative flex min-w-0 flex-1">
          <input
            ref={input}
            data-autofocus
            type="text"
            aria-label={t.inputLabel}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            onKeyDown={onKeyDown}
            onInput={() => {
              history.current?.reset();
              placeCaret();
            }}
            onSelect={placeCaret}
            onFocus={() => {
              caret.current?.setAttribute("data-focused", "");
              placeCaret();
            }}
            onBlur={() => caret.current?.removeAttribute("data-focused")}
            className="w-full min-w-0 bg-transparent p-0 text-island-text caret-transparent outline-none"
          />
          <span
            ref={caret}
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-1/2 left-0 h-[1.3em] w-[1ch] -translate-y-1/2 rounded-[1px]",
              "outline outline-1 -outline-offset-1 outline-accent-secondary",
              // The blink (.terminal-caret[data-focused] in globals.css) stops under reduced motion.
              "terminal-caret data-focused:bg-accent-secondary",
            )}
          />
        </span>
      </div>
    </div>
  );
}
