import type { MDXComponents } from "mdx/types";
import type { ComponentPropsWithoutRef } from "react";
import { Callout } from "@/components/case-study/mdx/Callout";
import { Compare } from "@/components/case-study/mdx/Compare";
import { Figure } from "@/components/case-study/mdx/Figure";
import { Gallery } from "@/components/case-study/mdx/Gallery";
import { MarginNote } from "@/components/case-study/mdx/MarginNote";
import { Metric } from "@/components/case-study/mdx/Metric";
import { Metrics } from "@/components/case-study/mdx/Metrics";
import { Section } from "@/components/case-study/mdx/Section";
import { TransitionLink } from "@/components/nav/TransitionLink";
import { focusRing } from "@/components/ui/controlStyles";
import { cn } from "@/lib/utils";

const link = cn(
  "rounded-[2px] text-text-primary underline decoration-accent-primary decoration-1 underline-offset-4 transition-colors duration-150 ease-out hover:decoration-2",
  focusRing,
);

/** Body links: site paths go through the page transition; everything else opens in a new tab. */
function A({ href = "", children, ...rest }: ComponentPropsWithoutRef<"a">) {
  if (href.startsWith("/")) {
    return (
      <TransitionLink href={href} className={link} {...rest}>
        {children}
      </TransitionLink>
    );
  }
  if (href.startsWith("#")) {
    return (
      <a href={href} className={link} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={link}
      {...rest}
    >
      {children}
    </a>
  );
}

/*
 * Every MDX body (content/case-studies/*.mdx, 4.5) gets these: the case-study components
 * without importing them, and the plain Markdown elements in the site's type scale. Required by
 * @next/mdx with the App Router.
 */
const components: MDXComponents = {
  Section,
  Figure,
  Gallery,
  Callout,
  Metric,
  Metrics,
  Compare,
  MarginNote,
  h2: (p) => <h2 className="text-title-1 font-bold" {...p} />,
  h3: (p) => <h3 className="text-title-3 font-semibold" {...p} />,
  p: (p) => <p className="text-body text-text-secondary" {...p} />,
  a: A,
  strong: (p) => <strong className="font-semibold text-text-primary" {...p} />,
  ul: (p) => (
    <ul
      className="list-disc space-y-2 pl-5 text-body text-text-secondary marker:text-text-tertiary"
      {...p}
    />
  ),
  ol: (p) => (
    <ol
      className="list-decimal space-y-2 pl-5 text-body text-text-secondary marker:text-text-tertiary"
      {...p}
    />
  ),
  blockquote: (p) => (
    <blockquote
      className="border-l-2 border-accent-primary pl-4 text-title-3 text-text-primary [&_p]:text-inherit"
      {...p}
    />
  ),
  code: (p) => (
    <code
      className="rounded-[6px] bg-surface-glass px-1.5 py-0.5 text-footnote font-mono text-text-primary"
      {...p}
    />
  ),
  pre: (p) => (
    <pre
      data-lenis-prevent
      className="overflow-x-auto overscroll-x-contain rounded-control glass p-4 text-footnote font-mono [&_code]:bg-transparent [&_code]:p-0"
      {...p}
    />
  ),
  hr: () => <hr className="border-border-default" />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
