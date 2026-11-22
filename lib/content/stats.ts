/*
 * The hero numbers (4.1), always derived from content/projects.ts, never typed by hand
 * (CLAUDE.md §5.6). Placeholder projects don't count.
 */
import { projects } from "@/content/projects";
import { skillAreas } from "@/content/skills";

export type Stats = {
  /** Real projects in the list. */
  projectsShipped: number;
  /** Distinct technologies across their stacks. */
  technologies: number;
  /** Distinct skills in content/skills.ts (placeholders like "[Skill]" don't count). */
  skills: number;
  caseStudies: number;
  featured: number;
};

const real = () => projects.filter((p) => !p.placeholder);

/**
 * Years from the earliest project to `now`'s year, inclusive (0 with no projects). Separate from
 * getStats() and takes the date explicitly: `new Date()` during a render breaks Next's prerender
 * (cacheComponents), so callers pass a date from where it's allowed.
 */
export function getYearsActive(now: Date): number {
  const list = real();
  if (!list.length) return 0;
  return now.getFullYear() - Math.min(...list.map((p) => p.year)) + 1;
}

export function getStats(): Stats {
  const list = real();
  return {
    projectsShipped: list.length,
    technologies: new Set(
      list.flatMap((p) => p.stack.map((s) => s.toLowerCase())),
    ).size,
    skills: new Set(
      skillAreas
        .flatMap((a) => a.skills.map((s) => s.name))
        .filter((s) => !/^\[.*\]$/.test(s.trim()))
        .map((s) => s.toLowerCase()),
    ).size,
    caseStudies: list.filter((p) => p.hasCaseStudy).length,
    featured: list.filter((p) => p.featured).length,
  };
}
