"use client";

import { LegendCard } from "@/components/cards/LegendCard";
import {
  LinkListCard,
  type LinkListItem,
} from "@/components/cards/LinkListCard";
import { ProgressCard } from "@/components/cards/ProgressCard";
import { SkillsCard } from "@/components/cards/SkillsCard";
import { SiteFooter } from "@/components/layer/SiteFooter";
import { Marquee } from "@/components/motion/Marquee";
import { Stagger } from "@/components/motion/Stagger";
import { BentoGrid } from "@/components/ui/BentoGrid";
import { BentoItem } from "@/components/ui/BentoItem";
import { chapterNumber, chapters } from "@/content/chapters";
import { copy } from "@/content/copy";
import { projects } from "@/content/projects";
import {
  learning,
  skillAreas,
  tools,
  usedIn,
  type UsedIn,
} from "@/content/skills";

const t = copy.skills;
const page = chapters.find((c) => c.id === "skills")!;
const workRoute = chapters.find((c) => c.id === "work")?.route ?? "/work";

/** A "where I used it" row: the project's case study, else its site or repo, else plain text. */
function toLink(item: UsedIn["items"][number]): LinkListItem {
  const p = item.project
    ? projects.find((q) => q.slug === item.project)
    : undefined;
  const href = p
    ? p.hasCaseStudy
      ? `${workRoute}/${p.slug}`
      : (p.links.live ?? p.links.repo)
    : undefined;
  return { label: item.label, href };
}

/** The marquee needs at least a screen's width of content, or its loop shows a gap. */
const MARQUEE_MIN_ITEMS = 12;
const marqueeTools = tools.length
  ? Array.from(
      { length: Math.ceil(MARQUEE_MIN_ITEMS / tools.length) },
      () => tools,
    ).flat()
  : [];

/**
 * The Skills page (4.6; Skills frames): the header, the big SkillsCard (one area per page, "n /
 * N", ←/→ when focused, swipe on phones, area chips), "Learning now" and the dot legend beside
 * it, three "Where I used it" cards and a marquee of everyday tools. Phones, as drawn: no legend,
 * no tools row, and only the first "Where I used it", as one line. Everything comes from
 * content/skills.ts. The rings sit top right (top centre on phones) through the page's `place`.
 */
export function Skills() {
  return (
    <div className="px-4 md:px-12">
      <header className="flex flex-col gap-4 pt-[calc(var(--nav-inset-top)+236px)] pb-12 md:min-h-120 md:pt-[calc(var(--nav-inset-top)+92px)]">
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
          <BentoItem data-stagger col={{ md: 6, lg: 8 }} row={{ lg: 2 }}>
            <SkillsCard
              variant="rated"
              className="h-full"
              areas={skillAreas}
              labels={{
                region: t.region,
                prev: t.prev,
                next: t.next,
                hint: t.orSwipe,
                swipeHint: t.swipeHint,
                level: t.level,
                years: t.years,
                areas: t.areas,
              }}
            />
          </BentoItem>

          <BentoItem data-stagger col={{ md: 3, lg: 4 }}>
            <ProgressCard
              hoverable
              className="h-full"
              eyebrow={t.learning}
              items={learning}
            />
          </BentoItem>

          <BentoItem
            data-stagger
            className="hidden md:block"
            col={{ md: 3, lg: 4 }}
          >
            <LegendCard
              hoverable
              className="h-full"
              eyebrow={t.legend}
              rows={t.legendRows}
            />
          </BentoItem>

          {usedIn.map((u, i) => (
            <BentoItem
              key={`${u.title}-${i}`}
              data-stagger
              className={i > 0 ? "hidden md:block" : undefined}
              col={{ md: 2, lg: 4 }}
            >
              <LinkListCard
                hoverable
                className="hidden h-full md:flex"
                eyebrow={t.usedIn}
                title={u.title}
                items={u.items.map(toLink)}
                newTabLabel={t.newTab}
              />
              {i === 0 ? (
                <LinkListCard
                  compact
                  className="md:hidden"
                  eyebrow={t.usedIn}
                  title={u.title}
                  items={u.items.map(toLink)}
                  newTabLabel={t.newTab}
                />
              ) : null}
            </BentoItem>
          ))}
        </BentoGrid>
        {/* Outside the grid: its rows are at least 160 px tall, and this strip is one line. */}
        {marqueeTools.length ? (
          <div data-stagger className="mt-4 hidden md:block">
            <div className="flex h-full items-center gap-8 rounded-card glass px-6 py-5">
              <span className="shrink-0 text-caption-1 font-mono tracking-widest text-text-secondary uppercase">
                {t.tools}
              </span>
              <div role="group" aria-label={t.tools} className="min-w-0 flex-1">
                <Marquee duration={40} gap={12}>
                  {marqueeTools.map((tool, i) => (
                    <span
                      key={i}
                      // The repeats only fill the width; read each tool once.
                      aria-hidden={i >= tools.length ? true : undefined}
                      className="flex h-10 items-center rounded-chip border border-border-default bg-glass-fill px-4 text-subhead whitespace-nowrap text-text-secondary"
                    >
                      {tool}
                    </span>
                  ))}
                </Marquee>
              </div>
            </div>
          </div>
        ) : null}
      </Stagger>

      <SiteFooter />
    </div>
  );
}
