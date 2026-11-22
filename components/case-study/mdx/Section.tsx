import type { ReactNode } from "react";
import { slugify } from "@/lib/content/slug";

export type SectionProps = {
  /** The heading, and the table-of-contents entry (lib/content/caseStudies.ts reads it). */
  title: string;
  children: ReactNode;
};

/**
 * A top-level part of a case study (4.5): an h2 and its content. The id comes from the title,
 * so the contents link to it. A block (not flex) container on purpose: a MarginNote inside is
 * absolutely positioned on wide screens and must keep its place in the flow.
 */
export function Section({ title, children }: SectionProps) {
  const id = slugify(title);
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-28 space-y-5"
    >
      <h2 id={`${id}-heading`} className="text-title-1 font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}
