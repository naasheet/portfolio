"use client";

import { terminalCopy } from "@/content/terminal";
import { ScrambleText } from "@/components/motion/ScrambleText";
import { focusRing } from "@/components/ui/controlStyles";
import { cn } from "@/lib/utils";

const t = terminalCopy.terminal;

/**
 * The first open of a visit (6.1): the "Type help to start" banner, scrambled in, and three
 * commands as chips that run on click (none without `onRun`: /terminal has its own row, 6.6).
 */
export function Welcome({ onRun }: { onRun?: (command: string) => void }) {
  return (
    <div className="mb-3 flex flex-col gap-2">
      <ScrambleText
        text={t.banner}
        trigger="mount"
        className="text-island-accent"
      />
      {onRun ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-island-text-secondary">
            {t.suggestionsLabel}
          </span>
          {t.suggestions.map((command) => (
            <button
              key={command}
              type="button"
              data-cursor="orbit"
              onClick={() => onRun(command)}
              className={cn(
                "h-7 cursor-pointer rounded-chip border border-island-border px-3 font-normal text-island-text transition-colors duration-150 ease-out hover:border-island-accent hover:text-island-accent active:scale-97",
                focusRing,
              )}
            >
              {command}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
