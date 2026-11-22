/*
 * Every project (4.1): the single source for the hero numbers (lib/content/stats.ts), Work and its
 * filters, the case studies, the terminal's `projects` and `ls`, and the chatbot (CLAUDE.md §5.6).
 * Never hard-code a project or a count anywhere else. scripts/check-content.ts checks it on every
 * build: unique slugs, required fields, files in public/, a case study for each hasCaseStudy.
 */

export type Project = {
  /** URL-safe and unique: /work/[slug], content/case-studies/[slug].mdx. */
  slug: string;
  title: string;
  year: number;
  role: string;
  /** One or two sentences. */
  summary: string;
  /** What kind of work it is (Work's filters). */
  domain: string;
  stack: readonly string[];
  links: { live?: string; repo?: string };
  /** A file under public/. */
  cover: string;
  /** A short WebM loop under public/, or null until it exists. */
  preview: string | null;
  featured: boolean;
  /** content/case-studies/<slug>.mdx exists. */
  hasCaseStudy: boolean;
  /** Who built it ("Solo", "Team of 3"), shown on the case study when set (4.5). */
  team?: string;
  /** A placeholder until the real project is in: shown, but not counted in the stats. */
  placeholder?: boolean;
};

// TODO(content): replace the three placeholders with your projects.
export const projects: readonly Project[] = [1, 2, 3].map((n) => ({
  slug: `project-${n}`,
  title: `[Project ${n}]`,
  year: 2026,
  role: "[Role]",
  summary: "[One line about the project]",
  domain: "[Domain]",
  stack: ["[Tech]"],
  links: {},
  cover: "/projects/placeholder-cover.svg",
  preview: null,
  featured: n === 1,
  // TODO(content): the sample case study (4.5) lives on project 1 until your real ones exist.
  hasCaseStudy: n === 1,
  team: n === 1 ? "[Solo]" : undefined,
  placeholder: true,
}));
