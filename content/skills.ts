/*
 * Skills (4.1, reshaped in 4.6): SkillsCard on the Skills page, About's skills count
 * (lib/content/stats.ts), the terminal's `skills` and the chatbot. Honest dots, no logo wall.
 * scripts/check-content.ts checks it on every build.
 */

/** 1 just started · 2 getting there · 3 comfortable · 4 ship with it daily · 5 could teach it. */
export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export type Skill = {
  name: string;
  /** Leave it out until you've decided: the dots then show empty, never a made-up rating. */
  level?: SkillLevel;
  /** Years of use, shown as "[4 yrs]" on wide screens. */
  years?: number;
};

export type SkillArea = {
  name: string;
  /** One line under the area's name ("What I reach for first."). */
  summary: string;
  skills: readonly Skill[];
};

/** Something being learned now, with how far along (0–100) once you want to say. */
export type Learning = { name: string; progress?: number };

/** "Where I used it": a skill (or pairing) and where it shows up. */
export type UsedIn = {
  title: string;
  /** `project` is a slug from content/projects.ts: the row links to its case study or site. */
  items: readonly { label: string; project?: string }[];
};

// TODO(content): your real areas, skills, levels and years.
export const skillAreas: readonly SkillArea[] = [1, 2, 3].map((n) => ({
  name: `[Area ${n}]`,
  summary: "[One line about this area]",
  skills: [1, 2, 3, 4, 5, 6].map((k) => ({ name: `[Skill ${n}.${k}]` })),
}));

// TODO(content): what you're learning now (and how far along, 0–100, if you want to show it).
export const learning: readonly Learning[] = [
  { name: "[Thing you're learning]" },
  { name: "[Another one]" },
  { name: "[A third]" },
];

// TODO(content): the tools you open every day.
export const tools: readonly string[] = [
  "[Tool 1]",
  "[Tool 2]",
  "[Tool 3]",
  "[Tool 4]",
  "[Tool 5]",
  "[Tool 6]",
];

// TODO(content): where your main skills show up (project slugs from content/projects.ts).
export const usedIn: readonly UsedIn[] = [1, 2, 3].map((n) => ({
  title: `[Skill or pairing ${n}]`,
  items: [
    { label: "[Project 1]", project: "project-1" },
    { label: "[Where else]" },
  ],
}));
