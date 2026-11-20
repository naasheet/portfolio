"use client";

import { usePathname } from "next/navigation";
import type { ComponentPropsWithRef } from "react";
import { TransitionLink } from "./TransitionLink";

export type ChapterLinkProps = Omit<ComponentPropsWithRef<"a">, "href"> & {
  /** The chapter's section id (content/chapters.ts). */
  chapter: string;
};

/**
 * A link to a homepage chapter. On `/` it's a plain anchor, so SmoothScroll glides to it
 * (next/link would jump natively). On any other route it's a TransitionLink (2.5): the page
 * exits, the homepage enters at that chapter, and the persistent layer and music stay.
 */
export function ChapterLink({ chapter, ...rest }: ChapterLinkProps) {
  const pathname = usePathname();
  const href = `/#${chapter}`;
  if (pathname === "/") return <a href={href} {...rest} />;
  return <TransitionLink href={href} {...rest} />;
}
