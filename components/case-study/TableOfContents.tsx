"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { focusRing } from "@/components/ui/controlStyles";
import { copy } from "@/content/copy";
import type { TocEntry } from "@/lib/content/caseStudies";
import { cn } from "@/lib/utils";

export type TableOfContentsProps = {
  entries: readonly TocEntry[];
  /** "desktop": the sticky list (lg up). "phone": the collapsible pill (below lg). */
  variant: "desktop" | "phone";
  className?: string;
};

/**
 * The case study's contents (4.5; Case study frames). Desktop: a sticky list beside the body, the
 * current section marked with a longer teal dash. Phone: a pill ("2 / 5 Approach") that opens the
 * list. The current section is the last one whose heading has passed the upper third of the
 * window (IntersectionObserver; the state changes only when the section does). Links are plain
 * #hash links, which SmoothScroll glides to.
 */
const label = copy.caseStudy.contents;
const position = copy.caseStudy.position;

export function TableOfContents({
  entries,
  variant,
  className,
}: TableOfContentsProps) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sections = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!sections.length) return;
    // Fires whenever a section crosses the line 35% down the window; then the current section is
    // simply the last one whose top is above that line (five rects, read only on a crossing).
    const pick = () => {
      const line = window.innerHeight * 0.35;
      let current = 0;
      sections.forEach((s, i) => {
        if (s.getBoundingClientRect().top <= line) current = i;
      });
      setActive(current);
    };
    const observer = new IntersectionObserver(pick, {
      rootMargin: "0px 0px -65% 0px",
    });
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [entries]);

  if (!entries.length) return null;

  const links = (
    <ol className="flex flex-col gap-1">
      {entries.map((e, i) => (
        <li key={e.id}>
          <a
            href={`#${e.id}`}
            aria-current={i === active ? "location" : undefined}
            onClick={() => setOpen(false)}
            className={cn(
              "group/toc flex items-center gap-3 rounded-control py-1.5 text-footnote text-text-tertiary transition-colors duration-200 ease-out hover:text-text-primary aria-[current]:text-text-primary",
              focusRing,
            )}
          >
            <span
              aria-hidden
              className="h-px w-2 origin-left bg-current transition-transform duration-200 ease-out group-aria-[current]/toc:scale-x-[2.5] group-aria-[current]/toc:bg-accent-primary"
            />
            <span className="transition-transform duration-200 ease-out group-aria-[current]/toc:translate-x-2.5">
              {e.title}
            </span>
          </a>
        </li>
      ))}
    </ol>
  );

  if (variant === "desktop") {
    return (
      <nav
        aria-label={label}
        className={cn("sticky top-28 flex flex-col gap-3", className)}
      >
        <p className="text-caption-1 font-mono tracking-widest text-text-tertiary uppercase">
          {label}
        </p>
        {links}
      </nav>
    );
  }

  return (
    <nav aria-label={label} className={cn("rounded-card glass", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-14 w-full items-center gap-3 rounded-card px-5 text-left",
          focusRing,
        )}
      >
        <span className="text-footnote font-mono text-text-tertiary tabular-nums">
          {position(active + 1, entries.length)}
        </span>
        <span className="flex-1 truncate text-subhead text-text-primary">
          {entries[active]?.title}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 text-text-secondary transition-transform duration-200 ease-out",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? <div className="px-5 pb-4">{links}</div> : null}
    </nav>
  );
}
