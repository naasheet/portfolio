import { Hand } from "lucide-react";
import { RoomLinks } from "@/components/home/RoomLinks";
import { RoomOverlayLoader } from "@/components/home/RoomOverlayLoader";
import { ChapterLink } from "@/components/nav/ChapterLink";
import { Kbd } from "@/components/ui/Kbd";
import { LocalTime } from "@/components/ui/LocalTime";
import { focusRing } from "@/components/ui/controlStyles";
import { chapterNumber, chapters } from "@/content/chapters";
import { copy } from "@/content/copy";
import { profile } from "@/content/profile";

const t = copy.home;

/** The teal full stop after a title (Home board). */
const Stop = () => <span className="text-accent-primary">.</span>;

/** Hint separator. */
const Dot = () => (
  <span aria-hidden className="size-1 rounded-chip bg-text-tertiary" />
);

/**
 * Home (R.1): only the room. Until R.3 builds the room, it's the intro and the hint row from
 * the Home boards, over the canvas (which still shows the name). Exactly one screen tall, so
 * nothing on Home scrolls. Desktop (md up): status line, "Hi, I'm Nasheet.", two lines, and
 * the hint row centred at the bottom. Phone: the eyebrow, "This is my desk." and a chip row
 * to the five pages above the Ask button.
 */
export default function Home() {
  return (
    <div className="relative h-dvh overflow-hidden">
      {/* Phone (Home — phone 390). */}
      {/* Below the nav row, which sits under the notch (88 px without one). */}
      <section className="flex flex-col gap-2 px-6 pt-[calc(var(--nav-inset-top)+68px)] md:hidden">
        <p className="text-caption-1 font-mono text-text-secondary uppercase">
          {t.eyebrow}
        </p>
        <h1 className="text-title-1 font-bold">
          {t.phoneTitle}
          <Stop />
        </h1>
      </section>

      {/* Desktop (Home — particle room, desktop 1440). */}
      {/* data-room-avoid: the room's hover card keeps clear of it (R.4). */}
      <section
        data-room-avoid
        className="hidden w-fit flex-col gap-4 px-12 pt-[calc(var(--nav-inset-top)+92px)] md:flex"
      >
        <p className="flex items-center gap-2 text-subhead text-text-secondary">
          <span aria-hidden className="relative inline-flex size-2">
            <span className="absolute inset-0 animate-status-pulse rounded-chip bg-status-success" />
            <span className="relative size-2 rounded-chip bg-status-success" />
          </span>
          {t.status} · {profile.city}
          <LocalTime className="font-mono text-footnote text-text-tertiary tabular-nums" />
        </p>
        <h1 className="text-stat-3 font-bold">
          {t.title}
          <Stop />
        </h1>
        <p className="text-body text-text-secondary">
          {t.lines[0]}
          <br />
          {t.lines[1]}
        </p>
      </section>

      {/* The room for the keyboard and screen readers (R.4): visually hidden, the Tab stops. */}
      <div data-room-only>
        <RoomLinks />
      </div>

      {/* Hint row, desktop. */}
      <p
        data-room-only
        className="absolute inset-x-0 bottom-10 hidden items-center justify-center gap-3 text-footnote text-text-secondary md:flex"
      >
        {t.hints.look}
        <Dot />
        <span className="flex items-center gap-2">
          <Kbd>Tab</Kbd>
          {t.hints.or}
          <Kbd>2</Kbd>
          <span aria-hidden>–</span>
          <span className="sr-only">to</span>
          <Kbd>6</Kbd>
        </span>
        <Dot />
        <span className="flex items-center gap-2 [&_svg]:size-4">
          <Hand aria-hidden />
          {t.hints.hand}
        </span>
      </p>

      {/* The room's tags, hover card and hit areas (R.4), over the canvas. */}
      {/* Also the no-WebGL / Save-Data cards (R.5): the same objects as glass link cards. */}
      <RoomOverlayLoader />

      {/* Chip row, phone: a plain way into the five pages, above the Ask button. */}
      <nav
        data-room-only
        aria-label={t.hints.pages}
        className="absolute inset-x-0 bottom-[calc(var(--layer-inset-bottom)+80px)] flex flex-col gap-4 md:hidden"
      >
        <p className="px-6 text-subhead text-text-secondary">{t.hints.phone}</p>
        <ul className="flex gap-2 overflow-x-auto px-6 [scrollbar-width:none]">
          {chapters.slice(1).map((c, i) => (
            <li key={c.id} className="shrink-0">
              <ChapterLink
                chapter={c.id}
                className={`flex h-11 items-center gap-2 rounded-chip glass px-4 text-callout text-text-primary ${focusRing}`}
              >
                <span className="text-caption-2 font-mono text-text-tertiary">
                  {chapterNumber(i + 1)}
                </span>
                {c.name}
              </ChapterLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
