"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { CardEyebrow } from "./CardEyebrow";

export type ProgressItem = {
  name: string;
  /** 0–100; leave it out and the bar stays empty with no number. */
  progress?: number;
};

export type ProgressCardProps = {
  eyebrow: string;
  items: readonly ProgressItem[];
  /** Pass through Card's hover look. */
  hoverable?: boolean;
  className?: string;
};

/**
 * A short list with amber progress bars (4.6, Skills frames: "Learning now"). The bars grow from
 * zero once, when the card first scrolls into view (a data attribute switches a CSS transform
 * transition; no state). The amber eyebrow turns neutral in the light theme, where amber text
 * fails contrast (§8); the bars stay amber (a fill).
 */
export function ProgressCard({
  eyebrow,
  items,
  hoverable,
  className,
}: ProgressCardProps) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.dataset.shown = "";
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Card
      hoverable={hoverable}
      className={cn("flex flex-col gap-5", className)}
    >
      <CardEyebrow
        mono
        className="text-accent-secondary [:root[data-theme=light]_&]:text-text-secondary"
      >
        {eyebrow}
      </CardEyebrow>
      <ul ref={ref} className="group/progress flex flex-col gap-5">
        {items.map((item, i) => (
          <li key={`${item.name}-${i}`} className="flex flex-col gap-2">
            <span className="flex items-baseline justify-between gap-4">
              <span className="text-body text-text-primary">{item.name}</span>
              {item.progress !== undefined ? (
                <span className="text-caption-1 font-mono text-text-tertiary tabular-nums">
                  {Math.round(item.progress)}%
                </span>
              ) : null}
            </span>
            <span
              role={item.progress !== undefined ? "progressbar" : undefined}
              aria-label={item.progress !== undefined ? item.name : undefined}
              aria-valuemin={item.progress !== undefined ? 0 : undefined}
              aria-valuemax={item.progress !== undefined ? 100 : undefined}
              aria-valuenow={
                item.progress !== undefined
                  ? Math.round(item.progress)
                  : undefined
              }
              className="relative block h-1 overflow-hidden rounded-chip bg-border-default"
            >
              <span
                className="absolute inset-0 origin-left scale-x-0 rounded-chip bg-accent-secondary transition-transform duration-700 ease-out group-data-[shown]/progress:scale-x-(--p) motion-reduce:transition-none"
                style={{ "--p": (item.progress ?? 0) / 100 } as CSSProperties}
              />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
