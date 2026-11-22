import { Check, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CalloutProps = {
  title: string;
  /** "lesson" (default): a teal box with a check, for a decision or a lesson. "note": neutral. */
  kind?: "lesson" | "note";
  children?: ReactNode;
};

/** A highlighted line in the body (4.5; Case study frames): a title and a sentence or two. */
export function Callout({ title, kind = "lesson", children }: CalloutProps) {
  const Icon = kind === "lesson" ? Check : Info;
  return (
    <aside
      className={cn(
        "flex gap-3 rounded-control border px-5 py-4",
        kind === "lesson"
          ? "border-accent-primary/40 bg-accent-primary/10"
          : "border-border-default bg-glass-fill",
      )}
    >
      <Icon
        aria-hidden
        className={cn(
          "mt-0.5 size-4 shrink-0",
          kind === "lesson" ? "text-accent-primary" : "text-text-secondary",
        )}
      />
      <div className="flex flex-col gap-1">
        <p className="text-subhead font-semibold text-text-primary">{title}</p>
        {children ? (
          <div className="text-subhead text-text-secondary [&_p]:m-0">
            {children}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
