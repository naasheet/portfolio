"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

/**
 * Staggers its `[data-stagger]` descendants in, 60 ms apart (4.3), as they scroll into view:
 * opacity 0 → 1 and 16 px up, once (ScrollTrigger.batch). Before it runs, CSS hides them only
 * when JS and motion are on (globals.css), so nothing flashes; reduced motion shows them as they
 * are. Inline transforms are cleared afterwards, so card tilt and lift keep working.
 */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-stagger]"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.dataset.staggerReady = "";
      return;
    }
    gsap.set(items, { opacity: 0, y: 16 });
    root.dataset.staggerReady = "";
    const triggers = ScrollTrigger.batch(items, {
      start: "top 92%",
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power3.out",
          stagger: 0.06,
          clearProps: "transform,opacity",
        }),
    });
    return () => {
      triggers.forEach((t) => t.kill());
      gsap.set(items, { clearProps: "transform,opacity" });
    };
  }, []);

  return (
    <div ref={ref} data-stagger-group className={cn(className)}>
      {children}
    </div>
  );
}
