"use client";

import type { ComponentPropsWithRef } from "react";
import { chapters, type PageId } from "@/content/chapters";
import { TransitionLink } from "./TransitionLink";

export type ChapterLinkProps = Omit<ComponentPropsWithRef<"a">, "href"> & {
  /** The page's id (content/chapters.ts). */
  chapter: PageId;
};

/**
 * A link to one of the six pages (R.1: each is its own route). A TransitionLink, so the page
 * exits with the 2.5 animation and the persistent layer and music stay.
 */
export function ChapterLink({ chapter, ...rest }: ChapterLinkProps) {
  const route = chapters.find((c) => c.id === chapter)?.route ?? "/";
  return <TransitionLink href={route} {...rest} />;
}
