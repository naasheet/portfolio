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

// From Nasheet's resume (public/resume.pdf), Nov 2026. Order = Work's order: each featured card
// (8 columns) pairs with a regular one (4) in a row.
// TODO(content): confirm each role and add `team`; repo / live links; real covers and preview
// loops in public/projects/ (all four use the placeholder cover for now).
const COVER = "/projects/placeholder-cover.svg";

export const projects: readonly Project[] = [
  {
    slug: "eco-waste-analyzer",
    title: "Eco Waste Analyzer",
    year: 2026,
    role: "ML and full-stack developer",
    summary:
      "Classifies waste from a photo with a MobileNetV2 model trained on ~23k images (~91% accuracy), and estimates the CO2 saved by disposing of it properly.",
    domain: "AI / ML",
    stack: ["Python", "PyTorch", "FastAPI", "React"],
    links: {},
    cover: COVER,
    preview: null,
    featured: true,
    hasCaseStudy: true,
  },
  {
    slug: "bunk-alert",
    title: "Bunk Alert",
    year: 2026,
    role: "Mobile developer",
    summary:
      "An attendance tracker that warns you before you fall short: safe-bunk limits, recovery plans, timetables, reminders and analytics, with offline sync through Firebase.",
    domain: "Mobile",
    stack: ["Flutter", "Firebase", "Riverpod", "Isar DB"],
    links: {},
    cover: COVER,
    preview: null,
    featured: false,
    hasCaseStudy: false,
  },
  {
    slug: "nmims-hostel-app",
    title: "NMIMS Hostel App",
    year: 2025,
    role: "Mobile developer",
    summary:
      "Hostel services for NMIMS residents in one app: lost & found, maintenance complaints with status tracking and the daily mess menu, plus a warden side for moderation and notices.",
    domain: "Mobile",
    stack: ["Flutter", "Dart"],
    links: {},
    cover: COVER,
    preview: null,
    featured: false,
    hasCaseStudy: false,
  },
  {
    slug: "filmly",
    title: "Filmly",
    year: 2026,
    role: "Full-stack developer",
    summary:
      "A social platform for discovering, reviewing and rating films, with watchlists, collaborative lists, real-time chat and JWT sign-in, built on TMDB and OMDB data.",
    domain: "Web",
    stack: [
      "React",
      "Node.js",
      "Express",
      "PostgreSQL",
      "Prisma",
      "Supabase",
      "Redis",
    ],
    links: {},
    cover: COVER,
    preview: null,
    featured: true,
    hasCaseStudy: false,
  },
];
