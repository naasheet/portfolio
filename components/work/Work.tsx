"use client";

import { AnimatePresence, m, type Variants } from "framer-motion";
import {
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { SiteFooter } from "@/components/layer/SiteFooter";
import { Stagger } from "@/components/motion/Stagger";
import { BentoGrid } from "@/components/ui/BentoGrid";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Divider } from "@/components/ui/Divider";
import { chapterNumber, chapters } from "@/content/chapters";
import { copy } from "@/content/copy";
import { projects } from "@/content/projects";
import {
  filterFromParams,
  filterQuery,
  getFilters,
  matchesFilter,
  type Filter,
} from "@/lib/content/projectFilters";
import { gsap } from "@/lib/motion/gsap";
import { coverTransitionName } from "@/lib/motion/pageTransition";
import { easeOutPoints, spring } from "@/lib/motion/tokens";

const t = copy.work;
const page = chapters.find((c) => c.id === "work")!;
const { domains, stack } = getFilters();
const caseStudies = projects.filter((p) => p.hasCaseStudy).length;

/*
 * The filter lives in the URL's query (?stack=react). A tiny external store over
 * location.search: the server and hydration see "" (the All grid is prerendered, so the page
 * stays static), then the client reads the real query. Changes go through replaceState (no
 * reload, no history entry per click; Next keeps its router in sync with it).
 */
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  window.addEventListener("popstate", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("popstate", fn);
  };
};
const getSearch = () => window.location.search;
const getServerSearch = () => "";

function setSearch(query: string) {
  window.history.replaceState(
    window.history.state,
    "",
    `${page.route}${query}${window.location.hash}`,
  );
  listeners.forEach((fn) => fn());
}

/** Bento spans (Work frames): three cards a row on desktop, featured ones take two. */
const span = (featured: boolean) =>
  ({
    "--col-md": featured ? 6 : 3,
    "--col-lg": featured ? 8 : 4,
  }) as CSSProperties;

const INSTANT = { duration: 0 } as const;

/*
 * Card motion. `custom` is the "animate" flag: AnimatePresence hands its current `custom` to
 * leaving cards (their own props are frozen at their last render, from before the click, which
 * would make every exit instant).
 */
const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  shown: (animate: boolean) => ({
    opacity: 1,
    scale: 1,
    transition: animate
      ? { ...spring.soft, opacity: { duration: 0.2 } }
      : INSTANT,
  }),
  exit: (animate: boolean) => ({
    opacity: 0,
    scale: 0.96,
    transition: animate ? { duration: 0.2, ease: easeOutPoints } : INSTANT,
  }),
};

/**
 * The Work page (4.4; Work frames): the header, a row of filter chips (All, the domains, the six
 * most used stack items), and the project grid. Filtering animates with Framer layout and
 * AnimatePresence "popLayout"; the first sync from the URL after hydration is instant. Every
 * project, filter and count comes from content/projects.ts. The laptop sits top right (top
 * centre on phones) through the page's `place` (content/chapters.ts).
 */
export function Work() {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  const filter = filterFromParams(new URLSearchParams(search));
  const shown = projects.filter((p) => matchesFilter(p, filter));
  // Animate only after the visitor has filtered: a reload on ?stack=… settles without motion.
  const [animate, setAnimate] = useState(false);
  const grid = useRef<HTMLDivElement>(null);

  const choose = (next: Filter | null) => {
    // Cards still waiting for their scroll-in stagger would move into view while invisible:
    // show them now, then let the layout animation take over.
    const pending =
      grid.current?.querySelectorAll<HTMLElement>("[data-stagger]");
    if (pending?.length) {
      gsap.killTweensOf(pending);
      gsap.set(pending, { clearProps: "transform,opacity" });
    }
    setAnimate(true);
    setSearch(filterQuery(next));
  };

  const isSelected = (f: Filter | null) =>
    f === null
      ? filter === null
      : filter?.kind === f.kind && filter.slug === f.slug;

  const chip = (f: Filter) => (
    <Chip
      key={`${f.kind}-${f.slug}`}
      tone="solid"
      selected={isSelected(f)}
      onClick={() => choose(f)}
    >
      {f.label}
    </Chip>
  );

  const layoutTransition = animate ? spring.soft : INSTANT;

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
        <p className="hidden text-footnote font-mono text-text-tertiary tabular-nums md:block">
          {t.counts(projects.length, caseStudies)}
        </p>
      </header>

      <div className="mb-4 flex items-center gap-4">
        <div
          role="group"
          aria-label={t.filters}
          className="-mx-4 flex min-w-0 flex-1 [scrollbar-width:none] items-center gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
        >
          <Chip
            tone="solid"
            selected={isSelected(null)}
            onClick={() => choose(null)}
          >
            {t.all}
          </Chip>
          {domains.map(chip)}
          {stack.length > 0 ? (
            <Divider
              decorative
              orientation="vertical"
              className="mx-2 my-1.5"
            />
          ) : null}
          {stack.map(chip)}
        </div>
        <span
          aria-hidden
          className="hidden shrink-0 text-footnote font-mono text-text-tertiary lg:block"
        >
          {page.route}
          {filterQuery(filter)}
        </span>
      </div>

      <p className="sr-only" aria-live="polite">
        {animate ? t.showing(shown.length) : ""}
      </p>

      <div ref={grid}>
        <Stagger>
          <BentoGrid className="relative">
            <AnimatePresence mode="popLayout" initial={false} custom={animate}>
              {shown.map((p) => (
                <m.div
                  key={p.slug}
                  layout
                  custom={animate}
                  variants={cardVariants}
                  initial="hidden"
                  animate="shown"
                  exit="exit"
                  transition={layoutTransition}
                  className="bento-item min-w-0"
                  style={span(p.featured)}
                >
                  <div data-stagger className="h-full">
                    <ProjectCard
                      className="h-full"
                      href={
                        p.hasCaseStudy
                          ? `${page.route}/${p.slug}`
                          : (p.links.live ?? p.links.repo)
                      }
                      newTabLabel={t.card.newTab}
                      coverTransition={
                        p.hasCaseStudy ? coverTransitionName(p.slug) : undefined
                      }
                      title={p.title}
                      role={p.role}
                      year={p.year}
                      stack={p.stack}
                      cover={{ src: p.cover, alt: "" }}
                      preview={p.preview}
                      caseStudy={p.hasCaseStudy}
                      featured={p.featured}
                      labels={t.card}
                      sizes={
                        p.featured
                          ? "(min-width: 1024px) 66vw, 100vw"
                          : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      }
                    />
                  </div>
                </m.div>
              ))}
            </AnimatePresence>
          </BentoGrid>
        </Stagger>

        <AnimatePresence initial={false}>
          {shown.length === 0 ? (
            <m.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={layoutTransition}
              className="flex flex-col items-start gap-4 rounded-card glass p-6 md:flex-row md:items-center md:justify-between"
            >
              <p className="text-body text-text-secondary">{t.empty}</p>
              <Button variant="secondary" onClick={() => choose(null)}>
                {t.showAll}
              </Button>
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>

      <SiteFooter />
    </div>
  );
}
