/*
 * The homepage chapters, in scroll order (CLAUDE.md §2). The nav, the island, the phone menu
 * and (from 4.x) the chapter sections all read this list. `id` is the section's anchor.
 * Subtitles are from the Navigation board (2.4).
 */

/**
 * The particle shape a chapter morphs into (canvas/shapes/registry.ts computes them).
 * Plain data: text is drawn in SF Pro Display Bold; models are GLBs in public/models/.
 */
export type ShapeSpec =
  | { kind: "text"; text: string }
  | { kind: "model"; url: string }
  /** The particle room (R.3): room.glb's nodes plus ambience, screen code and steam. */
  | { kind: "room"; url: string }
  | { kind: "sphere" | "grid" | "ring" | "scatter" };

/**
 * How the particles behave in a chapter (3.5). Multipliers, 1 = the base look: `size` scales
 * the points, `drift` the drift's speed, `spread` how far each point wanders from its shape.
 * The canvas tweens to a chapter's mood together with its morph.
 */
export type Mood = { size: number; drift: number; spread: number };

export type Chapter = {
  id: string;
  /** Its URL. */
  route: string;
  /** Deeper URLs count as this page too (/work/[slug], /arcade/slice). */
  nested?: boolean;
  name: string;
  /** One line under the name in the phone menu. */
  subtitle: string;
  shape: ShapeSpec;
  mood: Mood;
};

export const chapters = [
  {
    id: "home",
    route: "/",
    name: "Home",
    subtitle: "Where the particles live",
    // The particle room (R.3); the name shape is still registered as "name".
    shape: { kind: "room", url: "/models/room.glb" },
    mood: { size: 0.9, drift: 0.6, spread: 0.5 }, // tight and slow, so the name stays crisp
  },
  {
    id: "about",
    route: "/about",
    name: "About",
    subtitle: "Who's behind this",
    shape: { kind: "sphere" },
    mood: { size: 1.1, drift: 1, spread: 1.2 }, // airy
  },
  {
    id: "work",
    route: "/work",
    nested: true,
    name: "Work",
    subtitle: "Case studies and side projects",
    shape: { kind: "model", url: "/models/laptop.glb" },
    mood: { size: 1, drift: 0.8, spread: 0.7 }, // steady, so the laptop reads
  },
  {
    id: "skills",
    route: "/skills",
    name: "Skills",
    subtitle: "What I use, and how much",
    shape: { kind: "ring" },
    mood: { size: 1, drift: 1.3, spread: 1 },
  },
  {
    id: "arcade",
    route: "/arcade",
    nested: true,
    name: "Arcade",
    subtitle: "Small games to waste a minute on",
    shape: { kind: "model", url: "/models/controller.glb" },
    mood: { size: 1.1, drift: 1.6, spread: 1.1 }, // livelier
  },
  {
    id: "contact",
    route: "/contact",
    name: "Contact",
    subtitle: "Say hi",
    shape: { kind: "model", url: "/models/envelope.glb" },
    mood: { size: 0.95, drift: 0.7, spread: 0.8 }, // calm
  },
] as const satisfies readonly Chapter[];

/** The shape on every other route, and before the first chapter shape is ready. */
export const fallbackShape: ShapeSpec = { kind: "scatter" };

/**
 * How far the scatter is pulled toward the background on every other route (uFade, R.2):
 * 0 = full strength, 1 = gone.
 */
export const SCATTER_FADE = 0.6;

/** The mood on every other route: small, slow and loose, so the canvas calms behind content. */
export const fallbackMood: Mood = { size: 0.85, drift: 0.35, spread: 1.3 };

/** "01" … "06". */
export const chapterNumber = (index: number) =>
  String(index + 1).padStart(2, "0");

export type PageId = (typeof chapters)[number]["id"];

/**
 * The route table, [id, route, nested], shared by RouteWatcher and the inline head script
 * (ThemeScript embeds it as JSON), so the two can't disagree.
 */
export const routeTable: readonly (readonly [PageId, string, boolean])[] =
  chapters.map((c) => [c.id, c.route, "nested" in c && c.nested] as const);

/** The page a path belongs to, or null (credits, dev, terminal, 404). Same rule as the head script. */
export function pageFromPath(path: string): PageId | null {
  for (const [id, route, nested] of routeTable) {
    if (path === route || (nested && path.startsWith(route + "/"))) return id;
  }
  return null;
}

/**
 * The page whose shape the canvas shows (R.2): only a page's own route, never deeper ones, so a
 * case study or a game shows the scatter even though the island counts it as Work / Arcade.
 */
export function shapePageAt(path: string): Chapter | undefined {
  return chapters.find((c) => c.route === path);
}
