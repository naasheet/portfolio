import type { StaticImageData } from "next/image";
import type { ReactNode } from "react";
import { Avatar } from "@/components/media/Avatar";
import { Card } from "@/components/ui/Card";
import { StatusChip, type StatusTone } from "@/components/ui/StatusChip";

export type ProfileCardProps = {
  name: string;
  title: string;
  /** One more line, e.g. what you're studying. */
  line?: string;
  /** A photo; without one, the initials show in its place. Decorative: the name is visible. */
  photo?: { src: StaticImageData | string; blurDataURL?: string };
  initials: string;
  status: { text: string; tone?: StatusTone };
  /** A small mono line under the title (About: "Indore · 03:58 IST"). */
  meta?: ReactNode;
  /** Buttons along the bottom (About: GitHub, LinkedIn, email). */
  actions?: ReactNode;
  /**
   * "hero" (About frame, 4.3): on md and up the avatar sits top left with the status top right,
   * then the name, title, meta and actions; on phones the avatar sits beside the name, with the
   * status and actions on one row below.
   */
  variant?: "default" | "hero";
  /** The card hover look without being clickable (4.3; Card `hoverable`). */
  hoverable?: boolean;
  className?: string;
};

/** Who I am at a glance: photo, name, title, a line, and a status chip. */
export function ProfileCard({
  name,
  title,
  line,
  photo,
  initials,
  status,
  meta,
  actions,
  variant = "default",
  hoverable = false,
  className,
}: ProfileCardProps) {
  if (variant === "hero") {
    const chip = <StatusChip tone={status.tone}>{status.text}</StatusChip>;
    return (
      <Card hoverable={hoverable} className={className}>
        <div className="flex h-full flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 md:block">
              <Avatar initials={initials} photo={photo} size="lg" />
              <div className="flex min-w-0 flex-col md:hidden">
                <h3 className="text-title-3 font-semibold">{name}</h3>
                <p className="text-footnote text-text-secondary">{title}</p>
              </div>
            </div>
            <div className="hidden md:block">{chip}</div>
          </div>
          <div className="hidden flex-col gap-1 md:flex">
            <h3 className="text-title-1 font-semibold">{name}</h3>
            <p className="text-callout text-text-secondary">{title}</p>
            {meta ? <p className="text-caption-1 font-mono text-text-tertiary">{meta}</p> : null}
          </div>
          <div className="mt-auto flex items-center justify-between gap-4 md:justify-start">
            <div className="md:hidden">{chip}</div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card hoverable={hoverable} className={className}>
      <div className="flex h-full flex-col justify-between gap-6">
        <div className="flex items-center gap-4">
          <Avatar initials={initials} photo={photo} size="md" />
          <div className="flex min-w-0 flex-col">
            <h3 className="text-title-2 font-semibold">{name}</h3>
            <p className="text-subhead text-text-secondary">{title}</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-4">
          {line ? (
            <p className="text-footnote text-text-tertiary">{line}</p>
          ) : null}
          <StatusChip tone={status.tone}>{status.text}</StatusChip>
        </div>
      </div>
    </Card>
  );
}
