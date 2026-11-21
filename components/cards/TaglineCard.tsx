import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export type TaglineCardProps = {
  /** A status line on top (About: "● Open to work · Indore 03:58 IST"). */
  status: ReactNode;
  /** One big sentence. */
  tagline: string;
  /** Buttons along the bottom (About: See the work, Work with me, Resume). */
  actions: ReactNode;
  /** The card hover look without being clickable (4.3; Card `hoverable`). */
  hoverable?: boolean;
  className?: string;
};

/** One big sentence about you with its calls to action (4.3, About frame). */
export function TaglineCard({ status, tagline, actions, hoverable = false, className }: TaglineCardProps) {
  return (
    <Card hoverable={hoverable} className={className}>
      <div className="flex h-full flex-col gap-6">
        <div className="text-subhead text-text-secondary">{status}</div>
        <p className="text-title-2 font-semibold md:text-title-1">{tagline}</p>
        <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {actions}
        </div>
      </div>
    </Card>
  );
}
