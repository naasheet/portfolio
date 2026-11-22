"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { ViewTransition, type MouseEvent } from "react";
import { Img } from "@/components/media/Img";
import { Card } from "@/components/ui/Card";
import { coverTransitionName, navigate } from "@/lib/motion/pageTransition";
import { cn } from "@/lib/utils";

export type ProjectNavItem = {
  href: string;
  slug: string;
  title: string;
  cover: string;
};

export type ProjectNavProps = {
  prev?: ProjectNavItem;
  next?: ProjectNavItem;
  labels: { previous: string; next: string };
  className?: string;
};

/**
 * Previous and next case studies at the end of one (4.5; Case study frames): a card each, with
 * a thumbnail of the cover (on the outer side) and the title. On phones only Next shows. Like
 * the Work cards, the thumbnail morphs into the next page's hero where View Transitions exist.
 */
export function ProjectNav({ prev, next, labels, className }: ProjectNavProps) {
  const router = useRouter();
  if (!prev && !next) return null;

  const open = (href: string) => (e: MouseEvent<HTMLElement>) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(router, href, { shared: true });
  };

  const item = (p: ProjectNavItem, dir: "prev" | "next") => (
    <Card
      href={p.href}
      onClick={open(p.href)}
      className={cn(
        "flex items-center gap-6 p-2",
        dir === "next" ? "flex-row-reverse text-right" : "hidden md:flex",
      )}
    >
      <ViewTransition
        name={coverTransitionName(p.slug)}
        share="morph"
        default="none"
      >
        <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-[calc(var(--radius-card)-8px)] bg-surface-glass md:w-40">
          <Img
            src={p.cover}
            alt=""
            width={1600}
            height={1000}
            sizes="160px"
            className="h-full"
          />
        </div>
      </ViewTransition>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-1 py-4",
          dir === "next" ? "items-end pl-4" : "pr-4",
        )}
      >
        <span className="flex items-center gap-1 text-caption-1 font-mono text-text-tertiary">
          {dir === "prev" ? <ArrowLeft aria-hidden className="size-3" /> : null}
          {dir === "prev" ? labels.previous : labels.next}
          {dir === "next" ? (
            <ArrowRight aria-hidden className="size-3" />
          ) : null}
        </span>
        <span className="truncate text-title-3 font-bold">{p.title}</span>
      </div>
    </Card>
  );

  return (
    <nav
      aria-label={`${labels.previous} / ${labels.next}`}
      className={cn("grid gap-4 md:grid-cols-2", className)}
    >
      {prev ? (
        item(prev, "prev")
      ) : (
        <span aria-hidden className="hidden md:block" />
      )}
      {next ? item(next, "next") : null}
    </nav>
  );
}
