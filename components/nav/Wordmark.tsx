import { copy } from "@/content/copy";
import { chapters } from "@/content/chapters";
import { focusRing } from "@/components/ui/controlStyles";
import { cn } from "@/lib/utils";
import { ChapterLink } from "./ChapterLink";
import { navHeight } from "./navStyles";

/** The two brand dots, teal and amber (the same mark as the entry gate). */
export function LogoDots({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("flex gap-1", className)}>
      <span className="size-2 rounded-chip bg-accent-primary" />
      <span className="size-2 rounded-chip bg-accent-secondary" />
    </span>
  );
}

/**
 * "nasheet." with the logo, linking home. `compact` is the phone version: the logo alone in a
 * circle (the name stays for screen readers).
 */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <ChapterLink
      chapter={chapters[0].id}
      className={cn(
        "flex items-center gap-2 rounded-chip glass text-headline text-text-primary",
        "transition-[border-color] duration-150 ease-out hover:border-text-tertiary",
        navHeight,
        compact ? "w-11 justify-center" : "px-4",
        focusRing,
      )}
    >
      <LogoDots />
      <span className={cn(compact && "sr-only")}>{copy.nav.wordmark}</span>
    </ChapterLink>
  );
}
