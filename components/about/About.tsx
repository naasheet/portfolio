"use client";

import { ArrowUpRight, ChevronDown, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import {
  ARCard,
  type ARCardCopy,
  type ARState,
} from "@/components/cards/ARCard";
import { NowPlayingCard } from "@/components/cards/NowPlayingCard";
import { PhotoCard } from "@/components/cards/PhotoCard";
import { ProfileCard } from "@/components/cards/ProfileCard";
import { StatCard } from "@/components/cards/StatCard";
import { TaglineCard } from "@/components/cards/TaglineCard";
import { TerminalCard } from "@/components/cards/TerminalCard";
import { TextCard } from "@/components/cards/TextCard";
import { SocialButtons } from "@/components/contact/SocialButtons";
import { SiteFooter } from "@/components/layer/SiteFooter";
import { Marquee } from "@/components/motion/Marquee";
import { Stagger } from "@/components/motion/Stagger";
import { BentoGrid } from "@/components/ui/BentoGrid";
import { BentoItem } from "@/components/ui/BentoItem";
import { Button } from "@/components/ui/Button";
import { LocalTime } from "@/components/ui/LocalTime";
import { chapterNumber, chapters } from "@/content/chapters";
import { copy } from "@/content/copy";
import { profile } from "@/content/profile";
import { getStats } from "@/lib/content/stats";
import { navigate } from "@/lib/motion/pageTransition";
import { setHandMode } from "@/lib/shortcuts";
import { useStore } from "@/lib/store";

const t = copy.about;
const page = chapters.find((c) => c.id === "about")!;
const route = (id: string) => chapters.find((c) => c.id === id)?.route ?? "/";

const arCopy: ARCardCopy = {
  title: t.ar.title,
  off: { body: t.ar.body, action: t.ar.action },
  on: {
    chip: t.ar.on.chip,
    body: t.ar.on.body,
    hint: { before: "Press", key: "A", after: "to stop." },
    action: t.ar.on.action,
  },
  blocked: t.ar.blocked,
};

const initials = profile.name
  .split(/\s+/)
  .map((w) => w[0])
  .join("")
  .slice(0, 2);

/** The status line: a live dot, "Open to work · Indore" and the local time. */
function Availability() {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className="relative inline-flex size-2">
        {profile.availability.open ? (
          <span className="absolute inset-0 animate-status-pulse rounded-chip bg-status-success" />
        ) : null}
        <span className="relative size-2 rounded-chip bg-status-success" />
      </span>
      {profile.availability.label} · {profile.location.city}
      <LocalTime className="text-footnote font-mono text-text-tertiary tabular-nums" />
    </span>
  );
}

/**
 * The About page (4.3; About frames). First screen: the cards from the old hero (profile, the
 * two dot-digit numbers, the tagline with its calls to action, Hand mode and the terminal), then
 * the personal part (the short version, the now-playing card (5.5), two photos, off the screen,
 * interests). Everything comes from content/; the numbers are counted (lib/content/stats.ts).
 * Cards stagger in 60 ms apart; the sphere sits top right (top centre on phones) through the
 * page's `place` (content/chapters.ts).
 */
export function About() {
  const router = useRouter();
  const stats = getStats();
  const openTerminal = () => useStore.getState().ui.setTerminalOpen(true);
  // 8.5: the Hand card follows Hand mode: on, blocked (the camera was refused), else off.
  const arState: ARState = useStore((s) =>
    s.ar.enabled ? "on" : s.ar.status === "denied" ? "blocked" : "off",
  );
  const toggleHand = () => setHandMode(arState !== "on");

  // Button links go through the page transition (CLAUDE.md: every in-site navigation).
  const go = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
      return;
    e.preventDefault();
    navigate(router, href);
  };

  const photos =
    profile.photos.length > 0
      ? profile.photos.map((p) => ({
          image: { src: p.src, alt: p.alt },
          caption: p.caption,
          label: undefined,
        }))
      : t.photoCaptions.map((caption, i) => ({
          image: undefined,
          caption,
          label: t.photo(i + 1),
        }));

  return (
    <div className="px-4 md:px-12">
      <header className="flex flex-col gap-4 pt-[calc(var(--nav-inset-top)+236px)] pb-12 md:min-h-140 md:pt-[calc(var(--nav-inset-top)+92px)]">
        <span className="text-footnote font-mono text-accent-primary">
          {chapterNumber(chapters.indexOf(page))}
        </span>
        <h1 className="text-stat-2 font-bold md:text-stat-1">
          {page.name}
          <span className="text-accent-primary">.</span>
        </h1>
        <p className="max-w-xl text-body text-text-secondary">
          <span className="md:hidden">{t.ledeShort}</span>
          <span className="hidden md:inline">{t.lede}</span>
        </p>
      </header>

      <Stagger>
        <BentoGrid>
          <BentoItem data-stagger col={{ md: 6, lg: 4 }} row={{ lg: 2 }}>
            <ProfileCard
              variant="hero"
              hoverable
              className="h-full"
              name={profile.name}
              title={profile.degree}
              initials={initials}
              status={{
                text: t.available,
                tone: profile.availability.open ? "live" : "idle",
              }}
              meta={
                <>
                  {profile.location.city} · <LocalTime />
                </>
              }
              actions={<SocialButtons />}
            />
          </BentoItem>

          <BentoItem data-stagger col={{ md: 6, lg: 2 }} row={{ lg: 2 }}>
            <div className="grid h-full grid-cols-2 gap-4 lg:grid-cols-1">
              <StatCard
                hoverable
                className="h-full"
                label={t.skills}
                value={stats.skills}
                display="dots"
                monoEyebrow
              />
              <StatCard
                hoverable
                className="h-full"
                label={t.projects}
                value={stats.projectsShipped}
                display="dots"
                monoEyebrow
              />
            </div>
          </BentoItem>

          <BentoItem data-stagger col={{ md: 6, lg: 6 }} row={{ lg: 2 }}>
            <TaglineCard
              hoverable
              className="h-full"
              status={<Availability />}
              tagline={profile.tagline}
              actions={
                <>
                  <Button
                    href={route("work")}
                    onClick={go(route("work"))}
                    size="lg"
                    trailingIcon={<ChevronDown />}
                  >
                    {t.seeWork}
                  </Button>
                  <Button
                    href={route("contact")}
                    onClick={go(route("contact"))}
                    size="lg"
                    variant="secondary"
                    trailingIcon={<ArrowUpRight />}
                  >
                    {t.workWithMe}
                  </Button>
                  <Button
                    href={profile.resume}
                    download
                    size="lg"
                    variant="ghost"
                    leadingIcon={<Download />}
                  >
                    {t.resume}
                  </Button>
                </>
              }
            />
          </BentoItem>

          <BentoItem data-stagger col={{ md: 6, lg: 6 }} row={{ lg: 2 }}>
            <TextCard
              hoverable
              className="h-full"
              eyebrow={t.shortVersion}
              body={[...profile.bio]}
              tone="lead"
              monoEyebrow
              footnote={t.source("bio")}
            />
          </BentoItem>

          {/* Phones: the now-playing card right after the short version (About phone frame). */}
          <BentoItem data-stagger className="md:hidden">
            <NowPlayingCard />
          </BentoItem>

          <BentoItem data-stagger col={{ md: 3, lg: 3 }} row={{ lg: 2 }}>
            <ARCard
              hoverable
              className="hidden h-full md:flex"
              state={arState}
              copy={arCopy}
              helpHref="/about"
              onToggle={toggleHand}
            />
            <ARCard
              className="md:hidden"
              state={arState}
              copy={arCopy}
              helpHref="/about"
              compact={{ body: t.ar.bodyShort }}
              onToggle={toggleHand}
            />
          </BentoItem>

          <BentoItem
            data-stagger
            className="hidden md:block"
            col={{ md: 3, lg: 3 }}
            row={{ lg: 2 }}
          >
            <TerminalCard
              className="h-full"
              eyebrow={`~ ${t.terminal.eyebrow}`}
              shortcut="`"
              preview={{
                prompt: "$",
                command: "whoami",
                output: [
                  [{ text: t.terminal.whoami }],
                  [{ text: "$ " }, { text: t.terminal.ls, code: true }],
                  [{ text: t.terminal.files }],
                ],
              }}
              actionLabel={t.terminal.action}
              onOpen={openTerminal}
            />
          </BentoItem>

          <BentoItem data-stagger col={{ md: 6, lg: 6 }} row={{ lg: 2 }}>
            <div className="-mx-4 flex h-full snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0">
              {photos.slice(0, 2).map((p, i) => (
                <PhotoCard
                  key={i}
                  className="h-72 w-[66vw] shrink-0 snap-start md:h-full md:w-auto"
                  image={p.image}
                  caption={p.caption}
                  placeholderLabel={p.label}
                />
              ))}
            </div>
          </BentoItem>

          {/* Desktop and tablet: in place of the third photo (About desktop frame, 5.5). */}
          <BentoItem
            data-stagger
            className="hidden md:block"
            col={{ md: 3, lg: 3 }}
            row={{ lg: 2 }}
          >
            <NowPlayingCard className="h-full" />
          </BentoItem>

          <BentoItem data-stagger col={{ md: 3, lg: 3 }} row={{ lg: 2 }}>
            <TextCard
              hoverable
              className="h-full"
              eyebrow={t.offScreen}
              body={profile.offScreen}
              tone="callout"
              monoEyebrow
              footnote={t.source("offScreen")}
            />
          </BentoItem>
        </BentoGrid>
      </Stagger>

      <div
        className="mt-4 hidden md:block"
        aria-label={t.interests}
        role="group"
      >
        <Marquee duration={40} gap={12}>
          {profile.interests.map((interest, i) => (
            <span
              key={i}
              className="flex h-10 items-center rounded-chip border border-border-default bg-glass-fill px-4 text-subhead whitespace-nowrap text-text-secondary"
            >
              {interest}
            </span>
          ))}
        </Marquee>
      </div>

      <SiteFooter />
    </div>
  );
}
