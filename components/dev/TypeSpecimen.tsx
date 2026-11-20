"use client";

import { useEffect, useRef } from "react";

// Class names are written out in full so Tailwind's scanner generates them.
// Keep in sync with the @utility list in app/globals.css and TEXT_TOKENS in lib/utils.ts.
const TOKENS = [
  { name: "stat-1", className: "text-stat-1", sample: "1,284" },
  { name: "stat-2", className: "text-stat-2", sample: "1,284" },
  { name: "stat-3", className: "text-stat-3", sample: "1,284" },
  { name: "large-title", className: "text-large-title", sample: "Large Title" },
  {
    name: "title-1",
    className: "text-title-1",
    sample: "Title 1 — the quick brown fox",
  },
  {
    name: "title-2",
    className: "text-title-2",
    sample: "Title 2 — the quick brown fox",
  },
  {
    name: "title-3",
    className: "text-title-3",
    sample: "Title 3 — the quick brown fox",
  },
  {
    name: "headline",
    className: "text-headline",
    sample: "Headline — jumps over the lazy dog",
  },
  {
    name: "body",
    className: "text-body",
    sample: "Body — jumps over the lazy dog",
  },
  {
    name: "callout",
    className: "text-callout",
    sample: "Callout — jumps over the lazy dog",
  },
  {
    name: "subhead",
    className: "text-subhead",
    sample: "Subhead — jumps over the lazy dog",
  },
  {
    name: "footnote",
    className: "text-footnote",
    sample: "Footnote — jumps over the lazy dog",
  },
  {
    name: "caption-1",
    className: "text-caption-1",
    sample: "Caption 1 — jumps over the lazy dog",
  },
  {
    name: "caption-2",
    className: "text-caption-2",
    sample: "Caption 2 — jumps over the lazy dog",
  },
] as const;

/** "--font-sf-display" style family names → "SF Pro Display" etc., from the first family listed. */
function familyLabel(fontFamily: string): string {
  const first = (fontFamily.split(",")[0] ?? "").replace(/["']/g, "").trim();
  if (/display/i.test(first)) return "SF Pro Display";
  if (/mono/i.test(first)) return "SF Mono";
  if (/text/i.test(first)) return "SF Pro Text";
  return first;
}

function TypeRow({ name, className, sample }: (typeof TOKENS)[number]) {
  const sampleRef = useRef<HTMLParagraphElement>(null);
  const metaRef = useRef<HTMLSpanElement>(null);

  // Read what the browser actually applies, so the specimen can't drift from globals.css.
  // Writes straight to the DOM: these values never change after mount.
  useEffect(() => {
    if (!sampleRef.current || !metaRef.current) return;
    const cs = getComputedStyle(sampleRef.current);
    const size = parseFloat(cs.fontSize);
    const tracking = parseFloat(cs.letterSpacing);
    const em = Number.isNaN(tracking) ? 0 : tracking / size;
    metaRef.current.textContent = [
      familyLabel(cs.fontFamily),
      `${cs.fontSize} / ${cs.lineHeight}`,
      `tracking ${em === 0 ? "0" : `${em.toFixed(2)}em`}`,
      `weight ${cs.fontWeight}`,
    ].join(" · ");
  }, []);

  return (
    <div className="grid gap-2 border-b border-border-default py-4 md:grid-cols-[176px_1fr] md:gap-6">
      <div className="flex flex-col gap-1">
        <code className="text-footnote font-mono text-accent-primary">
          text-{name}
        </code>
        {/* Filled after mount; four lines are reserved so filling it never shifts the page. */}
        <span
          ref={metaRef}
          className="min-h-13 text-caption-2 font-mono text-text-tertiary"
        />
      </div>
      <p ref={sampleRef} className={`${className} min-w-0 break-words`}>
        {sample}
      </p>
    </div>
  );
}

export function TypeSpecimen() {
  return (
    <div className="flex flex-col">
      {TOKENS.map((token) => (
        <TypeRow key={token.name} {...token} />
      ))}
      <div className="grid gap-2 py-4 md:grid-cols-[176px_1fr] md:gap-6">
        <code className="text-footnote font-mono text-accent-primary">
          font-mono
        </code>
        <p className="text-callout font-mono">nasheet@portfolio:~$ ls --all</p>
      </div>
    </div>
  );
}
