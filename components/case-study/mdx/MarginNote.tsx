import type { ReactNode } from "react";
import { copy } from "@/content/copy";

export type MarginNoteProps = {
  /** Small mono label above the note. Default "Margin note". */
  label?: string;
  children: ReactNode;
};

/**
 * A side note (4.5; Case study frames). From 1408 px (88rem) it sits in the right margin beside
 * the paragraph it follows (absolute, in the body column's positioned box, so it keeps its
 * height in the flow); narrower, it's an inline aside with a left rule.
 */
export function MarginNote({
  label = copy.caseStudy.marginNote,
  children,
}: MarginNoteProps) {
  return (
    <aside className="border-l-2 border-border-default pl-4 min-[88rem]:absolute min-[88rem]:left-full min-[88rem]:ml-14 min-[88rem]:w-64 min-[88rem]:border-l-0 min-[88rem]:pl-0">
      <p className="text-caption-2 font-mono tracking-widest text-text-tertiary uppercase">
        {label}
      </p>
      <div className="mt-2 text-caption-1 text-text-secondary [&_p]:m-0">
        {children}
      </div>
    </aside>
  );
}
