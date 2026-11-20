"use client";

import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Kbd } from "@/components/ui/Kbd";
import { cn } from "@/lib/utils";

export type TerminalPreview = {
  /** e.g. "nasheet@portfolio:~$" */
  prompt: string;
  command: string;
  /** Output lines; `code` spans render bright, the rest dim. */
  output: { text: string; code?: boolean }[][];
};

export type TerminalCardProps = {
  eyebrow: string;
  /** The key that opens the terminal, shown as a Kbd. */
  shortcut: string;
  preview: TerminalPreview;
  actionLabel: string;
  /** Opens the terminal. A prop for now; chunk 6.1 opens the drawer with it. */
  onOpen?: () => void;
  className?: string;
};

/**
 * A static peek at the terminal: an inset panel with the help line and a blinking amber cursor
 * (one of the loops §8 allows; solid under reduced motion), and an "Open the terminal" row.
 * The row is the real button; its ::after stretches over the card, so the whole card opens it.
 */
export function TerminalCard({
  eyebrow,
  shortcut,
  preview,
  actionLabel,
  onOpen,
  className,
}: TerminalCardProps) {
  return (
    <Card
      interactive
      className={cn("group flex flex-col gap-2 p-2", className)}
    >
      <div className="flex flex-1 flex-col gap-2 rounded-control border border-border-default bg-bg-base p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-footnote text-text-secondary">{eyebrow}</span>
          <Kbd>{shortcut}</Kbd>
        </div>
        <div aria-hidden className="text-caption-2 font-mono leading-5">
          <p>
            <span className="text-accent-primary">{preview.prompt}</span>{" "}
            <span className="text-text-primary">{preview.command}</span>
          </p>
          {preview.output.map((line, i) => (
            <p key={i} className="text-text-secondary">
              {line.map((part, j) => (
                <span
                  key={j}
                  className={cn(part.code && "font-semibold text-text-primary")}
                >
                  {part.text}
                </span>
              ))}
            </p>
          ))}
          <p>
            <span className="text-accent-primary">{preview.prompt}</span>{" "}
            <span className="terminal-cursor inline-block h-3.5 w-2 translate-y-0.5 bg-accent-secondary" />
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="flex h-11 cursor-pointer items-center justify-between rounded-control px-4 text-subhead font-medium transition-colors duration-150 ease-out outline-none group-hover:bg-surface-glass after:absolute after:inset-0 after:rounded-card focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-border-focus"
      >
        {actionLabel}
        <ArrowUpRight aria-hidden className="size-4" />
      </button>
    </Card>
  );
}
