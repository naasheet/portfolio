import {
  Hand,
  MousePointer2,
  SquareTerminal,
  Sun,
  VolumeX,
} from "lucide-react";
import { chapterNumber, chapters } from "@/content/chapters";
import { copy } from "@/content/copy";
import { cn } from "@/lib/utils";
import { NavRow } from "./NavRow";
import { LogoDots } from "./Wordmark";
import { navCircle, navHeight } from "./navStyles";

const circle = cn(
  navCircle,
  "flex items-center justify-center text-text-primary [&_svg]:size-4.5",
);

/**
 * The nav as static HTML (server-rendered, no JS of its own): what the live NavBar looks like
 * at rest, so the first paint has the full row and the swap after hydration doesn't show.
 * Only the home links work here; everything else arrives with NavBar a moment later.
 * Keep it in step with NavBar, Island (idle) and ModeSwitch.
 */
export function NavShell() {
  const home = chapters[0];
  const wordmark = (compact: boolean) => (
    <a
      href={`/#${home.id}`}
      className={cn(
        "flex items-center gap-2 rounded-chip glass text-headline text-text-primary",
        navHeight,
        compact ? "w-11 justify-center" : "px-4",
      )}
    >
      <LogoDots />
      <span className={cn(compact && "sr-only")}>{copy.nav.wordmark}</span>
    </a>
  );

  return (
    <NavRow
      left={wordmark(true)}
      leftDesktop={
        <>
          {wordmark(false)}
          <span
            aria-hidden
            className={cn(
              "flex items-center gap-1 rounded-chip glass p-1 text-subhead",
              navHeight,
            )}
          >
            <span className="flex h-full items-center gap-2 rounded-chip bg-text-primary px-4 text-bg-base [&_svg]:size-4">
              <MousePointer2 />
              {copy.nav.mouse}
            </span>
            <span className="flex h-full items-center gap-2 px-4 text-text-secondary [&_svg]:size-4">
              <Hand />
              {copy.nav.hand}
            </span>
          </span>
        </>
      }
      centre={
        <span
          aria-hidden
          className="flex h-11 items-center gap-2 rounded-[22px] border border-island-border bg-island-bg px-4 shadow-lift"
        >
          <span className="text-caption-2 font-mono text-island-accent">
            {chapterNumber(0)}
          </span>
          <span className="text-subhead font-semibold text-island-text">
            {home.name}
          </span>
          <span className="flex items-center gap-1">
            {chapters.map((c, i) => (
              <span
                key={c.id}
                className={cn(
                  "h-1 rounded-chip",
                  i === 0
                    ? "w-4 bg-island-accent"
                    : "w-1 bg-island-text-secondary/50",
                )}
              />
            ))}
          </span>
        </span>
      }
      rightDesktop={
        <>
          <span aria-hidden className={circle}>
            <SquareTerminal />
          </span>
          <span aria-hidden className={circle}>
            <Sun />
          </span>
        </>
      }
      right={
        <span aria-hidden className={circle}>
          <VolumeX />
        </span>
      }
    />
  );
}
