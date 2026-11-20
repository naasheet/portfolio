"use client";

import Image from "next/image";
import type { PointerEvent } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const MAX_TILT = 8; // degrees

export type PhotoCardProps = {
  /** Without an image, a token-gradient placeholder shows. */
  image?: { src: string; alt: string };
  caption: string;
  subcaption?: string;
  className?: string;
};

function setTilt(el: HTMLElement, rx: number, ry: number) {
  el.style.setProperty("--rx", `${rx}deg`);
  el.style.setProperty("--ry", `${ry}deg`);
}

/**
 * An image with a caption. On hover it tilts toward the pointer (max 8°) through --rx / --ry,
 * written straight to the element; on leave it springs back (CSS, see .photo-tilt).
 * Mouse only; no tilt under reduced motion.
 */
export function PhotoCard({
  image,
  caption,
  subcaption,
  className,
}: PhotoCardProps) {
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    el.dataset.tilting = "";
    setTilt(el, -ny * 2 * MAX_TILT, nx * 2 * MAX_TILT);
  };

  const onPointerLeave = (e: PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    delete el.dataset.tilting;
    setTilt(el, 0, 0);
  };

  return (
    <Card
      as="figure"
      interactive
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn("photo-tilt flex flex-col gap-4 p-2", className)}
    >
      <div className="relative min-h-32 flex-1 overflow-hidden rounded-control">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-br from-accent-primary/40 to-accent-secondary/30"
          />
        )}
      </div>
      <figcaption className="flex flex-col px-2 pb-2">
        <span className="text-subhead">{caption}</span>
        {subcaption ? (
          <span className="text-caption-1 text-text-tertiary">
            {subcaption}
          </span>
        ) : null}
      </figcaption>
    </Card>
  );
}
