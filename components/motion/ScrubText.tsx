"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

/**
 * Text whose words fade from grey to full as it scrolls through the view (4.3, About frame:
 * "words fade in from grey to white as the card scrolls in"): each word's opacity is scrubbed
 * from 0.3 to 1 in reading order, opacity only. The full text is server-rendered at full
 * opacity (no JS, reduced motion); the words are spans of one text, so screen readers read it
 * whole.
 */
export function ScrubText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const words = root.querySelectorAll<HTMLElement>("[data-word]");
    const tween = gsap.fromTo(
      words,
      { opacity: 0.3 },
      {
        opacity: 1,
        ease: "none",
        stagger: 0.1,
        scrollTrigger: { trigger: root, start: "top 85%", end: "bottom 55%", scrub: 0.4 },
      },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(words, { clearProps: "opacity" });
    };
  }, [text]);

  const words = text.split(/(\s+)/);
  return (
    <p ref={ref} className={cn(className)}>
      {words.map((w, i) =>
        /^\s+$/.test(w) ? (
          w
        ) : (
          <span key={i} data-word>
            {w}
          </span>
        ),
      )}
    </p>
  );
}
