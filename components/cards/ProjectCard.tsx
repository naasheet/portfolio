"use client";

import { ArrowUpRight, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, type HTMLAttributes, type MouseEvent, type SyntheticEvent } from "react";
import { Img } from "@/components/media/Img";
import { LoopVideo } from "@/components/media/LoopVideo";
import { Card } from "@/components/ui/Card";
import { navigate } from "@/lib/motion/pageTransition";
import { cn } from "@/lib/utils";

export type ProjectCardLabels = {
  /** The badge on projects with a case study. */
  caseStudy: string;
  /** The pill while the preview plays with a mouse; the clip's length follows ("Preview · 0:06"). */
  preview: string;
  /** The pill while the preview plays on touch (it plays in view there). */
  playingInView: string;
};

export type ProjectCardProps = {
  href: string;
  title: string;
  role: string;
  year: number;
  /** The first four are shown. */
  stack: readonly string[];
  cover: { src: string; alt: string };
  /** A short WebM / MP4 loop under public/, or null. */
  preview?: string | null;
  caseStudy?: boolean;
  /** Bigger title and a wider cover; the grid gives it two columns. */
  featured?: boolean;
  labels: ProjectCardLabels;
  /** Responsive sizes hint for the cover. */
  sizes?: string;
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, "title" | "role" | "onClick" | "children">;

/** Cover inset: the card's 8 px padding, so the cover's radius is the card's minus 8 (concentric). */
const COVER_RADIUS = "rounded-[calc(var(--radius-card)-8px)]";

const videoType = (src: string) => (src.endsWith(".mp4") ? "video/mp4" : "video/webm");

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * A project in Work's grid (4.4; Work frames): the cover (with a "Case study" badge), title and
 * ↗, role and year, up to four stack tags. With a preview, a muted loop plays over the cover
 * while the card is hovered or focused (with a mouse) or on screen (touch), and a pill says so.
 * The playing state is a data attribute written from the video's own events (capture phase):
 * no React state. The whole card is one link that leaves through the page transition.
 */
export function ProjectCard({
  href,
  title,
  role,
  year,
  stack,
  cover,
  preview,
  caseStudy = false,
  featured = false,
  labels,
  sizes,
  className,
  ...rest
}: ProjectCardProps) {
  const router = useRouter();
  const duration = useRef<HTMLSpanElement>(null);

  const onClick = (e: MouseEvent<HTMLElement>) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(router, href);
  };

  const setPlaying = (on: boolean) => (e: SyntheticEvent<HTMLElement>) => {
    if (on) e.currentTarget.dataset.playing = "";
    else delete e.currentTarget.dataset.playing;
  };

  const onMetadata = (e: SyntheticEvent<HTMLElement>) => {
    const video = e.target as HTMLVideoElement;
    if (duration.current && Number.isFinite(video.duration)) {
      duration.current.textContent = ` · ${formatTime(video.duration)}`;
    }
  };

  return (
    <Card
      {...rest}
      href={href}
      onClick={onClick}
      data-loop-host=""
      onPlayCapture={setPlaying(true)}
      onPauseCapture={setPlaying(false)}
      onLoadedMetadataCapture={onMetadata}
      className={cn(
        "group/card flex flex-col p-2",
        "data-playing:border-accent-primary/50!",
        className,
      )}
    >
      <div
        className={cn(
          "relative aspect-video shrink-0 overflow-hidden bg-surface-glass",
          featured && "lg:aspect-[37/10]",
          COVER_RADIUS,
        )}
      >
        <Img
          src={cover.src}
          alt={cover.alt}
          width={1600}
          height={1000}
          sizes={sizes}
          className="h-full"
        />
        {preview ? (
          <LoopVideo
            sources={[{ src: preview, type: videoType(preview) }]}
            width={1600}
            height={900}
            trigger="hover"
            className="absolute inset-0 h-full opacity-0 transition-opacity duration-300 ease-out group-data-playing/card:opacity-100"
          />
        ) : null}

        {caseStudy ? (
          <span className="absolute top-3 left-3 flex h-7 items-center gap-2 rounded-chip border border-island-border bg-island-bg/80 px-3 text-footnote text-island-text">
            <span aria-hidden className="size-1.5 rounded-chip bg-island-accent" />
            {labels.caseStudy}
          </span>
        ) : null}

        {preview ? (
          <span
            aria-hidden
            className="absolute right-3 bottom-3 flex h-8 translate-y-1 items-center gap-2 rounded-chip bg-island-text px-3 text-footnote font-semibold text-island-bg opacity-0 transition-[opacity,translate] duration-200 ease-out group-data-playing/card:translate-y-0 group-data-playing/card:opacity-100"
          >
            <Play className="size-3 fill-current" />
            <span className="pointer-coarse:hidden">
              {labels.preview}
              <span ref={duration} />
            </span>
            <span className="hidden pointer-coarse:inline">{labels.playingInView}</span>
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 px-4 pt-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          <h3
            className={cn(
              "font-bold tracking-tight",
              featured ? "text-title-2" : "text-title-3",
            )}
          >
            {title}
          </h3>
          <ArrowUpRight
            aria-hidden
            className="mt-1 size-4 shrink-0 text-text-tertiary transition-[color,translate] duration-200 ease-out group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 group-hover/card:text-text-primary"
          />
        </div>
        <p className="flex items-baseline gap-2 text-subhead text-text-secondary md:justify-between">
          <span>{role}</span>
          <span aria-hidden className="md:hidden">
            ·
          </span>
          <span className="text-footnote font-mono text-text-tertiary tabular-nums">
            {year}
          </span>
        </p>
        {stack.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {stack.slice(0, 4).map((s) => (
              <li
                key={s}
                className="flex h-7 items-center rounded-chip border border-border-default px-3 text-caption-1 text-text-secondary"
              >
                {s}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Card>
  );
}
