"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentPropsWithRef, MouseEvent } from "react";
import { navigate } from "@/lib/motion/pageTransition";

export type TransitionLinkProps = Omit<
  ComponentPropsWithRef<typeof Link>,
  "href"
> & {
  href: string;
};

/**
 * A next/link (prefetching included) that leaves the page with the 2.5 exit animation before
 * pushing the route. New tabs, modified clicks, other origins and same-page links behave
 * as normal.
 */
export function TransitionLink({
  href,
  onClick,
  ...rest
}: TransitionLinkProps) {
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (rest.target && rest.target !== "_self") return;
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname) return;
    e.preventDefault();
    navigate(router, url.pathname + url.search + url.hash);
  };

  return <Link href={href} {...rest} onClick={handleClick} />;
}
