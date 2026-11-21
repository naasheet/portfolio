"use client";

import { useState } from "react";
import { LocalTime } from "@/components/ui/LocalTime";
import { copy } from "@/content/copy";
import { now } from "@/content/now";

/**
 * The mug's Now card (R.5, Home states board "The mug: Now"), shown as the island's expanded
 * shape: what's being built, the chunk and its progress, coffee today and the last commit, all
 * from content/now.ts. Island colours (near-black in both themes).
 */
export function NowCard() {
  const t = copy.home.now;
  const share = now.chunksDone / now.chunksTotal;
  // Measured once when the card opens (it's short-lived).
  const [ago] = useState(() => t.ago(Date.now() - new Date(now.lastCommit.at).getTime()));
  return (
    <div className="flex flex-col gap-4 text-island-text">
      <div className="flex items-center justify-between text-caption-1 font-mono text-island-text-secondary uppercase">
        <span>
          {t.title} · <LocalTime />
        </span>
        <span className="flex items-center gap-1 text-island-accent normal-case">
          <span aria-hidden className="size-1.5 rounded-chip bg-island-accent" />
          {t.live}
        </span>
      </div>
      <p className="text-headline">{now.headline}</p>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-caption-1 font-mono">
          <span className="text-island-text-secondary">{t.chunk(now.chunk)}</span>
          <span className="text-island-text-secondary">
            <span className="text-island-accent">{now.chunksDone}</span> / {now.chunksTotal}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={now.chunksTotal}
          aria-valuenow={now.chunksDone}
          aria-label={t.chunk(now.chunk)}
          className="h-1 overflow-hidden rounded-chip bg-island-border"
        >
          <div
            className="h-full origin-left rounded-chip bg-island-accent"
            style={{ transform: `scaleX(${share})` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1 rounded-control border border-island-border p-3">
          <span className="text-caption-2 font-mono text-island-text-secondary uppercase">
            {t.coffee}
          </span>
          <span className="text-title-3 font-semibold">{now.coffeeToday}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-control border border-island-border p-3">
          <span className="text-caption-2 font-mono text-island-text-secondary uppercase">
            {t.lastCommit}
          </span>
          <span className="text-subhead font-semibold" title={now.lastCommit.message}>
            {ago}
          </span>
        </div>
      </div>
    </div>
  );
}
