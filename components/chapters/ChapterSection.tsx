"use client";

import { useRef, type ReactNode } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { useStore } from "@/lib/store";

type Props = {
  /** The chapter's anchor (`content/chapters.ts` id). */
  id: string;
  /** Its index in `chapters`: written to scroll.chapter and `data-chapter`. */
  index: number;
  className?: string;
  children: ReactNode;
};

/**
 * One homepage chapter (CLAUDE.md §2). Its ScrollTrigger is the only writer of scroll.chapter:
 * the chapter crossing the middle of the viewport is current (enter and enter-back). It also
 * writes scroll.progress (0–1 through the current chapter) through getState(), so nothing
 * re-renders. The canvas watches scroll.chapter and morphs (canvas/ScrollMorph.tsx); this file
 * never imports canvas code (CLAUDE.md §5.1, and three stays out of first-load JS). No cn():
 * it would pull tailwind-merge into first-load JS on `/`.
 */
export function ChapterSection({ id, index, className, children }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const enter = () => {
        const { scroll } = useStore.getState();
        if (scroll.chapter !== index) scroll.setChapter(index);
      };
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top center",
        end: "bottom center",
        onEnter: enter,
        onEnterBack: enter,
        onUpdate: (self) => {
          const { scroll } = useStore.getState();
          if (scroll.chapter === index) scroll.setProgress(self.progress);
        },
      });
    },
    { scope: ref, dependencies: [index] },
  );

  return (
    <section ref={ref} id={id} data-chapter={index} className={className}>
      {children}
    </section>
  );
}
