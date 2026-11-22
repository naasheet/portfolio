"use client";

import { ArrowUp } from "lucide-react";
import { SocialButtons } from "@/components/contact/SocialButtons";
import { Wordmark } from "@/components/nav/Wordmark";
import { focusRing } from "@/components/ui/controlStyles";
import { copy } from "@/content/copy";
import { scrollTo } from "@/lib/motion/lenis";

/**
 * The footer of the content pages (4.3, About frames; 4.8 checked it against the chunk): the
 * wordmark and the easter-egg terminal hint, the social links, and "Back to top" (a Lenis glide).
 * Not on Home (the room doesn't scroll). The social links are desktop only, as drawn.
 */
export function SiteFooter() {
  return (
    <footer
      aria-label={copy.footer.label}
      className="mt-24 border-t border-border-default pt-8 pb-[calc(var(--layer-inset-bottom)+72px)]"
    >
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col items-start gap-3">
          <Wordmark />
          {/* The easter-egg line (4.8): the terminal is the site's hidden second interface. */}
          <p className="text-caption-1 font-mono text-text-tertiary">
            {copy.footer.psst}
          </p>
        </div>
        <SocialButtons className="hidden md:flex" />
        <button
          type="button"
          onClick={() => scrollTo(0)}
          className={`flex h-11 items-center gap-2 rounded-control px-2 text-subhead text-text-secondary transition-colors duration-150 ease-out hover:text-text-primary ${focusRing}`}
        >
          {copy.footer.backToTop}
          <ArrowUp aria-hidden className="size-4" />
        </button>
      </div>
    </footer>
  );
}
