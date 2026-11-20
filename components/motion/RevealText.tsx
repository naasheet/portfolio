"use client";

import { useRef } from "react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { gsap, loadSplitText, useGSAP } from "@/lib/motion/gsap";

type RevealTag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";

export type RevealTextProps = {
  as?: RevealTag;
  /** Split into lines (default) or words. Each piece slides up out of its own mask. */
  split?: "lines" | "words";
  /** Plain text only: SplitText rewrites the element's HTML. */
  children: string;
  /** Seconds to wait after the trigger fires. */
  delay?: number;
  className?: string;
};

/**
 * Text that slides up into place, line by line (or word by word), once, when it scrolls into
 * view. Line splits re-run on resize and font load (SplitText autoSplit) and are reverted on
 * unmount. Until the split is ready the element is hidden by CSS (`[data-reveal="pending"]`,
 * only with scripting and motion allowed), so text above the fold doesn't flash.
 * Reduced motion: no split, the text is simply there.
 */
export function RevealText({
  as = "p",
  split = "lines",
  children,
  delay = 0,
  className,
}: RevealTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  useGSAP(
    (context) => {
      const el = ref.current;
      if (!el || reduced) return;

      // SplitText loads on first use (lib/motion/gsap.ts). The split is created inside this
      // GSAP context, so reverting the context (unmount, dependency change) still reverts it.
      let cancelled = false;
      void loadSplitText().then((SplitText) => {
        if (cancelled || !context) return;
        context.add(() => {
          SplitText.create(el, {
            type: split,
            mask: split,
            autoSplit: split === "lines",
            aria: "auto",
            onSplit(self) {
              el.dataset.reveal = "ready";
              return gsap.from(split === "lines" ? self.lines : self.words, {
                yPercent: 100,
                duration: 0.7,
                ease: "power4.out",
                stagger: 0.04,
                delay,
                scrollTrigger: { trigger: el, start: "top 85%", once: true },
              });
            },
          });
        });
      });
      return () => {
        cancelled = true;
      };
    },
    { dependencies: [reduced, split, children, delay], revertOnUpdate: true },
  );

  const Tag = as as "p";
  return (
    // Keyed by the text, so React replaces the element instead of patching split DOM.
    <Tag
      key={children}
      ref={(el: HTMLElement | null) => {
        ref.current = el;
      }}
      data-reveal="pending"
      className={className}
    >
      {children}
    </Tag>
  );
}
