"use client";

import { formatCount, useCountUp } from "@/lib/hooks/useCountUp";

export type MetricProps = {
  /**
   * A number counts up once when it scrolls into view (with `prefix`, `suffix`, `decimals`).
   * A string is shown as written ("[−42%]" placeholders, "3×").
   */
  value: number | string;
  label: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
};

function CountUp({ value, decimals }: { value: number; decimals: number }) {
  const ref = useCountUp<HTMLSpanElement>(value, { decimals });
  return (
    <span ref={ref} className="tabular-nums">
      {formatCount(value, decimals)}
    </span>
  );
}

/** A big number with a label (4.5; Case study frames). Put several in <Metrics>. */
export function Metric({
  value,
  label,
  prefix,
  suffix,
  decimals = 0,
}: MetricProps) {
  return (
    <div className="flex flex-col gap-1 rounded-card glass px-5 py-4">
      <span className="text-stat-3 font-bold text-accent-primary">
        {prefix}
        {typeof value === "number" ? (
          <CountUp value={value} decimals={decimals} />
        ) : (
          value
        )}
        {suffix}
      </span>
      <span className="text-caption-1 text-text-secondary">{label}</span>
    </div>
  );
}
