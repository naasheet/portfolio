/*
 * The hero numbers (4.1), always derived from content/projects.ts, never typed by hand
 * (CLAUDE.md §5.6). Placeholder projects don't count.
 */
import { projects } from "@/content/projects";

export type Stats = {
  /** Real projects in the list. */
  projectsShipped: number;
  /** Distinct technologies across their stacks. */
  technologies: number;
  caseStudies: number;
  featured: number;
  /** Years from the earliest project to this year, inclusive (0 with no projects). */
  yearsActive: number;
};

export function getStats(now = new Date()): Stats {
  const real = projects.filter((p) => !p.placeholder);
  const earliest = Math.min(...real.map((p) => p.year));
  return {
    projectsShipped: real.length,
    technologies: new Set(real.flatMap((p) => p.stack.map((s) => s.toLowerCase()))).size,
    caseStudies: real.filter((p) => p.hasCaseStudy).length,
    featured: real.filter((p) => p.featured).length,
    yearsActive: real.length ? now.getFullYear() - earliest + 1 : 0,
  };
}
