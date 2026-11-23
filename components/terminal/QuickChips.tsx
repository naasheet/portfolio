"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore, type PointerEvent } from "react";
import { terminalCopy } from "@/content/terminal";
import { focusRing } from "@/components/ui/controlStyles";
import { runLine } from "@/lib/terminal/run";
import {
  getServerSession,
  getSession,
  subscribeSession,
} from "@/lib/terminal/session";
import { cn } from "@/lib/utils";

const t = terminalCopy.terminal.page;

/** Keep the input focused (and the phone's keyboard up) when a chip is tapped. */
const keepFocus = (e: PointerEvent<HTMLButtonElement>) => e.preventDefault();

/**
 * The full-page terminal's quick commands (6.6), a row pinned above the keyboard: one tap runs
 * each, exactly as if typed (runLine). 44 px tall for thumbs; the row scrolls sideways if it
 * doesn't fit. Off while a command runs or waits for an answer (a chip would interrupt it).
 */
export function QuickChips() {
  const router = useRouter();
  const busy = useSyncExternalStore(
    subscribeSession,
    () => {
      const s = getSession();
      return s.running || s.asking !== null;
    },
    () => getServerSession().running,
  );
  return (
    <div
      role="group"
      aria-label={t.chipsLabel}
      data-lenis-prevent
      className="flex shrink-0 [scrollbar-width:none] gap-2 overflow-x-auto overscroll-contain border-t border-island-border px-4 py-2"
    >
      {t.chips.map((command) => (
        <button
          key={command}
          type="button"
          disabled={busy}
          onPointerDown={keepFocus}
          onClick={() => void runLine(command, router)}
          className={cn(
            "h-11 shrink-0 cursor-pointer rounded-chip border border-island-border px-4 text-footnote font-mono text-island-text transition-colors duration-150 ease-out hover:border-island-accent hover:text-island-accent active:scale-97 disabled:cursor-not-allowed disabled:opacity-40",
            focusRing,
          )}
        >
          {command}
        </button>
      ))}
    </div>
  );
}
