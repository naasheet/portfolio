"use client";

import { ArrowUpRight } from "lucide-react";
import { memo } from "react";
import { TransitionLink } from "@/components/nav/TransitionLink";
import { focusRing } from "@/components/ui/controlStyles";
import type { OutputLine } from "@/lib/terminal/types";
import { cn } from "@/lib/utils";
import { Prompt } from "./Prompt";

const LINK = cn(
  "inline-flex items-center gap-0.5 rounded-key text-island-accent underline decoration-island-accent/40 underline-offset-2 hover:decoration-island-accent",
  focusRing,
);

/**
 * One output line (6.1). Memoised: an entry never changes after it's printed, so appending a
 * line renders only the new one.
 */
export const Line = memo(function Line({ line }: { line: OutputLine }) {
  switch (line.kind) {
    case "input":
      return (
        <div className="flex break-all whitespace-pre-wrap">
          <Prompt />
          <span className="text-island-text">{line.text}</span>
        </div>
      );
    case "text":
      return (
        <div
          className={cn(
            "break-words whitespace-pre-wrap",
            line.tone === "muted"
              ? "text-island-text-secondary"
              : line.tone === "accent"
                ? "text-island-accent"
                : "text-island-text",
          )}
        >
          {line.text}
        </div>
      );
    case "error":
      return (
        <div className="break-words whitespace-pre-wrap text-island-danger">
          {line.text}
        </div>
      );
    case "link": {
      const internal = line.href.startsWith("/");
      return (
        <div>
          {internal ? (
            <TransitionLink href={line.href} className={LINK}>
              {line.text}
            </TransitionLink>
          ) : (
            <a
              href={line.href}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK}
            >
              {line.text}
              <ArrowUpRight aria-hidden className="size-3" />
            </a>
          )}
        </div>
      );
    }
    case "table":
      return (
        <div className="overflow-x-auto">
          <table className="border-collapse text-left">
            {line.head ? (
              <thead>
                <tr>
                  {line.head.map((cell, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="pr-6 font-normal text-island-text-secondary"
                    >
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
            ) : null}
            <tbody>
              {line.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td
                      key={c}
                      className={cn(
                        "pr-6 align-top whitespace-pre",
                        c === 0 ? "text-island-accent" : "text-island-text",
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "ascii":
      return (
        <pre className="overflow-x-auto leading-tight text-island-text">
          {line.text}
        </pre>
      );
    case "node":
      return <div>{line.node}</div>;
  }
});
