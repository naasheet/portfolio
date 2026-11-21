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

/** Pages outside the six (credits, dev, terminal, 404): no number, every dot dim, "Menu". */
const NONE = "none";

/*
 * Which island label shows, from html[data-page] (set before paint by ThemeScript, kept in
 * step by RouteWatcher). Generated from content/chapters.ts, so no page id is typed twice.
 * Without JS there's no data-page, and "Menu" shows.
 */
const labelCss = [
  "[data-shell-page]{display:none}",
  `html:not([data-page]) [data-shell-page="${NONE}"]`,
  ...[...chapters.map((c) => c.id), NONE].map(
    (id) => `,html[data-page="${id}"] [data-shell-page="${id}"]`,
  ),
  "{display:flex}",
].join("");

/** One island label: the number, the name and the six dots, the current one a teal dash. */
function ShellLabel({ index }: { index: number }) {
  const current = chapters[index];
  return (
    <span
      data-shell-page={current?.id ?? NONE}
      className="items-center gap-2"
    >
      {current ? (
        <span className="text-caption-2 font-mono text-island-accent">
          {chapterNumber(index)}
        </span>
      ) : null}
      <span className="text-subhead font-semibold text-island-text">
        {current?.name ?? copy.nav.menuTitle}
      </span>
      <span className="flex items-center gap-1">
        {chapters.map((c, i) => (
          <span
            key={c.id}
            className={cn(
              "h-1 rounded-chip",
              i === index
                ? "w-4 bg-island-accent"
                : "w-1 bg-island-text-secondary/50",
            )}
          />
        ))}
      </span>
    </span>
  );
}

/**
 * The nav as static HTML (server-rendered, no JS of its own): what the live NavBar looks like
 * at rest, so the first paint has the full row and the swap after hydration doesn't show.
 * The island renders every page's label and CSS shows the one for html[data-page] (R.1), so a
 * reload of any URL paints the right one. Only the wordmark works here; everything else
 * arrives with NavBar a moment later. Keep it in step with NavBar, Island (idle) and ModeSwitch.
 */
export function NavShell() {
  const wordmark = (compact: boolean) => (
    <a
      href={chapters[0].route}
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
          <style>{labelCss}</style>
          {[...chapters.keys(), -1].map((i) => (
            <ShellLabel key={i} index={i} />
          ))}
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
