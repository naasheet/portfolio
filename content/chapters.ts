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

/**
 * How the particles behave in a chapter (3.5). Multipliers, 1 = the base look: `size` scales
 * the points, `drift` the drift's speed, `spread` how far each point wanders from its shape.
 * The canvas tweens to a chapter's mood together with its morph.
 */
export type Mood = { size: number; drift: number; spread: number };

export type Chapter = {
  id: string;
  name: string;
  /** One line under the name in the phone menu. */
  subtitle: string;
  shape: ShapeSpec;
  mood: Mood;
};

export const chapters = [
  {
    id: "home",
    name: "Home",
    subtitle: "Where the particles live",
    // 4.2 fits it into the hero's NameCard.
    shape: { kind: "text", text: profile.name },
    mood: { size: 0.9, drift: 0.6, spread: 0.5 }, // tight and slow, so the name stays crisp
  },
  {
    id: "about",
    name: "About",
    subtitle: "Who's behind this",
    shape: { kind: "sphere" },
    mood: { size: 1.1, drift: 1, spread: 1.2 }, // airy
  },
  {
    id: "work",
    name: "Work",
    subtitle: "Case studies and side projects",
    shape: { kind: "model", url: "/models/laptop.glb" },
    mood: { size: 1, drift: 0.8, spread: 0.7 }, // steady, so the laptop reads
  },
  {
    id: "skills",
    name: "Skills",
    subtitle: "What I use, and how much",
    shape: { kind: "ring" },
    mood: { size: 1, drift: 1.3, spread: 1 },
  },
  {
    id: "arcade",
    name: "Arcade",
    subtitle: "Small games to waste a minute on",
    shape: { kind: "model", url: "/models/controller.glb" },
    mood: { size: 1.1, drift: 1.6, spread: 1.1 }, // livelier
  },
  {
    id: "contact",
    name: "Contact",
    subtitle: "Say hi",
    shape: { kind: "model", url: "/models/envelope.glb" },
    mood: { size: 0.95, drift: 0.7, spread: 0.8 }, // calm
  },
] as const satisfies readonly Chapter[];

/** The shape on every other route, and before the first chapter shape is ready. */
export const fallbackShape: ShapeSpec = { kind: "scatter" };

/** The mood on every other route: small, slow and loose, so the canvas calms behind content. */
export const fallbackMood: Mood = { size: 0.85, drift: 0.35, spread: 1.3 };

/** "01" … "06". */
export const chapterNumber = (index: number) =>
  String(index + 1).padStart(2, "0");
