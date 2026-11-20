"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentPropsWithRef } from "react";

export type ChapterLinkProps = Omit<ComponentPropsWithRef<"a">, "href"> & {
  /** The chapter's section id (content/chapters.ts). */
  chapter: string;
};

/**
 * A link to a homepage chapter. On `/` it's a plain anchor, so SmoothScroll glides to it
 * (next/link would jump natively). On any other route it's a next/link, so the persistent
 * layer and the music survive the trip home.
 */
export function ChapterLink({ chapter, ...rest }: ChapterLinkProps) {
  const pathname = usePathname();
  const href = `/#${chapter}`;
  if (pathname === "/") return <a href={href} {...rest} />;
  return <Link href={href} {...rest} />;
}
