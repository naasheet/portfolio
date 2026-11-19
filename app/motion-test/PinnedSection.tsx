"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";

// TEMPORARY (chunk 0.4): scroll test page. Delete with app/motion-test in chunk 0.6.
export function PinnedSection({ id }: { id: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        barRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none", // scrubbed: follows the scroll position, so no easing
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=150%",
            pin: true,
            scrub: true,
          },
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id={id}
      className="flex min-h-screen flex-col items-center justify-center gap-6 border-y border-border-default bg-surface-solid px-6"
    >
      <h2 className="text-large-title">Pinned section</h2>
      <p className="text-callout text-text-secondary">
        Stays put for 150% of the viewport while the bar fills. Watch for
        jitter.
      </p>
      <div className="h-2 w-full max-w-md overflow-hidden rounded-chip bg-border-default">
        <div
          ref={barRef}
          className="h-full w-full origin-left bg-accent-primary"
        />
      </div>
    </section>
  );
}
