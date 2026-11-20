/*
 * The homepage chapters, in scroll order (CLAUDE.md §2). The nav, the island, the phone menu
 * and (from 4.x) the chapter sections all read this list. `id` is the section's anchor.
 * Subtitles are from the Navigation board (2.4).
 */
export type Chapter = {
  id: string;
  name: string;
  /** One line under the name in the phone menu. */
  subtitle: string;
};

export const chapters = [
  { id: "home", name: "Home", subtitle: "Where the particles live" },
  { id: "about", name: "About", subtitle: "Who's behind this" },
  { id: "work", name: "Work", subtitle: "Case studies and side projects" },
  { id: "skills", name: "Skills", subtitle: "What I use, and how much" },
  {
    id: "arcade",
    name: "Arcade",
    subtitle: "Small games to waste a minute on",
  },
  { id: "contact", name: "Contact", subtitle: "Say hi" },
] as const satisfies readonly Chapter[];

/** "01" … "06". */
export const chapterNumber = (index: number) =>
  String(index + 1).padStart(2, "0");
