/*
 * The homepage chapters, in scroll order (CLAUDE.md §2). The nav, the island, the phone menu
 * and (from 4.x) the chapter sections all read this list. `id` is the section's anchor.
 * Subtitles are from the Navigation board (2.4).
 */
import { profile } from "./profile";

/**
 * The particle shape a chapter morphs into (canvas/shapes/registry.ts computes them).
 * Plain data: text is drawn in SF Pro Display Bold; models are GLBs in public/models/.
 */
export type ShapeSpec =
  | { kind: "text"; text: string }
  | { kind: "model"; url: string }
  | { kind: "sphere" | "grid" | "ring" | "scatter" };

export type Chapter = {
  id: string;
  name: string;
  /** One line under the name in the phone menu. */
  subtitle: string;
  shape: ShapeSpec;
};

export const chapters = [
  {
    id: "home",
    name: "Home",
    subtitle: "Where the particles live",
    // 4.2 fits it into the hero's NameCard.
    shape: { kind: "text", text: profile.name },
  },
  {
    id: "about",
    name: "About",
    subtitle: "Who's behind this",
    shape: { kind: "sphere" },
  },
  {
    id: "work",
    name: "Work",
    subtitle: "Case studies and side projects",
    shape: { kind: "model", url: "/models/laptop.glb" },
  },
  {
    id: "skills",
    name: "Skills",
    subtitle: "What I use, and how much",
    shape: { kind: "ring" },
  },
  {
    id: "arcade",
    name: "Arcade",
    subtitle: "Small games to waste a minute on",
    shape: { kind: "model", url: "/models/controller.glb" },
  },
  {
    id: "contact",
    name: "Contact",
    subtitle: "Say hi",
    shape: { kind: "model", url: "/models/envelope.glb" },
  },
] as const satisfies readonly Chapter[];

/** The shape on every other route, and before the first chapter shape is ready. */
export const fallbackShape: ShapeSpec = { kind: "scatter" };

/** "01" … "06". */
export const chapterNumber = (index: number) =>
  String(index + 1).padStart(2, "0");
