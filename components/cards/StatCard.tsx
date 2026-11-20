"use client";

import { Card } from "@/components/ui/Card";
import { formatCount, useCountUp } from "@/lib/hooks/useCountUp";
import { cn } from "@/lib/utils";
import { CardEyebrow } from "./CardEyebrow";

export type StatSegment = { value: number; tone: "accent" | "amber" | "muted" };

export type StatCardProps = {
  label: string;
  value: number;
  decimals?: number;
  caption?: string;
  /** Optional breakdown bar under the number; widths are proportional to the values. */
  segments?: StatSegment[];
  className?: string;
};

const TONE: Record<StatSegment["tone"], string> = {
  accent: "bg-accent-primary",
  amber: "bg-accent-secondary",
  muted: "bg-text-tertiary",
};

/** One big number that counts up once, with a label, a caption and an optional breakdown. */
export function StatCard({
  label,
  value,
  decimals = 0,
  caption,
  segments,
  className,
}: StatCardProps) {
  const ref = useCountUp<HTMLSpanElement>(value, { decimals });

  return (
    <Card className={className}>
      <div className="flex h-full flex-col justify-between gap-4">
        <CardEyebrow>{label}</CardEyebrow>
        <div className="flex flex-col gap-2">
          <span ref={ref} className="text-stat-3 font-semibold tabular-nums">
            {formatCount(value, decimals)}
          </span>
          {caption ? (
            <p className="text-footnote text-text-secondary">{caption}</p>
          ) : null}
        </div>
        {segments && segments.length > 0 ? (
          <div aria-hidden className="flex h-1 gap-1">
            {segments.map((s, i) => (
              <span
                key={i}
                className={cn("rounded-chip", TONE[s.tone])}
                style={{ flexGrow: s.value }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
