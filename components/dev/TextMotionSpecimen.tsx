"use client";

import { RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Marquee } from "@/components/motion/Marquee";
import { RevealText } from "@/components/motion/RevealText";
import { ScrambleText } from "@/components/motion/ScrambleText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { formatCount, useCountUp } from "@/lib/hooks/useCountUp";

const PARAGRAPH =
  "A long paragraph to show the line split. Resize the window and the lines re-split to match the new width, without a jump. Each line slides up out of its own mask, 40 ms after the one above it.";

const LABELS = [
  "nasheet@portfolio",
  "loading shaders",
  "hand found",
  "26 skills",
];

function Row({
  title,
  onReplay,
  children,
}: {
  title: string;
  onReplay?: () => void;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-caption-1 text-text-tertiary">{title}</span>
        {onReplay ? (
          <Button
            size="sm"
            variant="ghost"
            leadingIcon={<RotateCcw />}
            onClick={onReplay}
          >
            Replay
          </Button>
        ) : null}
      </div>
      {children}
    </Card>
  );
}

function Stat({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useCountUp<HTMLSpanElement>(value, { decimals });
  return (
    <span ref={ref} className="text-stat-2 font-bold tabular-nums">
      {formatCount(value, decimals)}
    </span>
  );
}

/** RevealText, useCountUp, ScrambleText and Marquee, each with a replay (remount). */
export function TextMotionSpecimen() {
  const [reveal, setReveal] = useState(0);
  const [mounted, setMounted] = useState(true);
  const [count, setCount] = useState(0);
  const [scramble, setScramble] = useState(0);
  const [label, setLabel] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <Row
        title="RevealText · lines and words"
        onReplay={() => setReveal((n) => n + 1)}
      >
        <div id="reveal-demo" className="flex min-h-48 flex-col gap-4">
          {mounted ? (
            <div key={reveal} className="flex flex-col gap-4">
              <RevealText
                as="h3"
                split="words"
                className="text-large-title font-bold"
              >
                Design first, then the code to match.
              </RevealText>
              <RevealText className="max-w-2xl text-body text-text-secondary">
                {PARAGRAPH}
              </RevealText>
            </div>
          ) : null}
        </div>
        <div>
          <Chip selected={!mounted} onClick={() => setMounted((m) => !m)}>
            Unmount (should leave no split spans)
          </Chip>
        </div>
      </Row>

      <Row
        title="useCountUp · tabular numbers, width locked"
        onReplay={() => setCount((n) => n + 1)}
      >
        <div key={count} className="flex flex-wrap items-end gap-8">
          <div className="flex flex-col gap-1">
            <Stat value={26} />
            <span className="text-footnote text-text-secondary">skills</span>
          </div>
          <div className="flex flex-col gap-1">
            <Stat value={1280} />
            <span className="text-footnote text-text-secondary">
              four digits
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <Stat value={98.6} decimals={1} />
            <span className="text-footnote text-text-secondary">
              one decimal
            </span>
          </div>
          <span className="text-footnote text-text-tertiary">
            ← text after the numbers must not move
          </span>
        </div>
      </Row>

      <Row
        title="ScrambleText · SF Mono, about 600 ms"
        onReplay={() => setScramble((n) => n + 1)}
      >
        <div
          key={scramble}
          className="flex flex-col gap-2 text-callout text-accent-primary"
        >
          <ScrambleText text="nasheet@portfolio:~$ help" />
          <ScrambleText text="30 commands. Try play, ar on or sudo hire-me" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setLabel((n) => (n + 1) % LABELS.length)}
          >
            Next label
          </Button>
          <ScrambleText
            trigger="mount"
            text={LABELS[label] ?? ""}
            className="text-footnote text-text-secondary"
          />
        </div>
      </Row>

      <Row title="Marquee · pauses on hover and focus, static under reduced motion">
        <Marquee duration={24} className="text-title-3 text-text-secondary">
          {[
            "React",
            "Next.js",
            "Three.js",
            "GLSL",
            "GSAP",
            "TypeScript",
            "Tailwind",
            "Web Audio",
            "MediaPipe",
            "Zustand",
            "Framer Motion",
          ].map((t) => (
            <span key={t} className="whitespace-nowrap">
              {t}
            </span>
          ))}
        </Marquee>
        <Marquee
          duration={32}
          reverse
          className="text-footnote text-text-tertiary"
        >
          {[
            "reverse",
            "slower",
            "same seam",
            "no JS",
            "transform only",
            "inert copy",
            "pauses on hover",
            "pauses on focus",
            "static when reduced",
            "duplicated content",
            "CSS keyframes",
          ].map((t) => (
            <span key={t} className="whitespace-nowrap">
              {t}
            </span>
          ))}
        </Marquee>
      </Row>
    </div>
  );
}
