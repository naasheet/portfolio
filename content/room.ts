/*
 * The particle room on Home (R.3; Home boards in stuff/reference/home/). One entry per node in
 * public/models/room.glb, in a fixed order: an object's index here is its `aObject` id (0–8)
 * in the canvas. Shares are the states board's table and, with the ambience, add up to 1.
 *
 * Geometry numbers are in the model's own units (Y up, the desk at y = 0, about 12 × 5.3);
 * canvas/shapes/room.ts fits the whole room into the view afterwards.
 */
import type { PageId } from "./chapters";

export type RoomObjectId =
  | "about"
  | "music"
  | "now"
  | "work"
  | "skills"
  | "arcade"
  | "lights"
  | "contact"
  | "plant";

/** What clicking the object does (R.4): a page, or one of the in-place actions. */
export type RoomOpens =
  | { kind: "page"; page: PageId }
  | { kind: "music" | "theme" | "now" | "plant" };

/** Where an object stands in the phone layout: its centre on the desk (x, z) and a scale. */
export type PhonePlace = { x: number; z: number; scale: number };

export type RoomObject = {
  id: RoomObjectId;
  /** The node's name in room.glb. */
  node: string;
  /** The tag next to the object. Plant has none (it's a secret). */
  label: string | null;
  opens: RoomOpens;
  /** Its keyboard shortcut, if any. */
  key: string | null;
  /** Share of all the particles (0–1). */
  share: number;
  /** Idle motion (built in later R chunks; steam is in R.3). */
  idle: string;
  /** Phone layout (under 768 px), three rows; null = not shown (the lamp). */
  phone: PhonePlace | null;
};

export const roomObjects: readonly RoomObject[] = [
  {
    id: "about",
    node: "about",
    label: "About",
    opens: { kind: "page", page: "about" },
    key: "2",
    share: 0.07,
    idle: "Photo frame. The silhouette can become your photo later.",
    phone: { x: 0, z: -3.7, scale: 1 },
  },
  {
    id: "music",
    node: "music",
    label: "Music",
    opens: { kind: "music" },
    key: null,
    share: 0.07,
    idle: "Pulses to the beat while music plays",
    phone: { x: -1.95, z: 3.1, scale: 0.7 },
  },
  {
    id: "now",
    node: "mug",
    label: "Now",
    opens: { kind: "now" },
    key: null,
    share: 0.05,
    idle: "Steam rises and curls, always",
    phone: { x: -2.3, z: 0.1, scale: 1 },
  },
  {
    id: "work",
    node: "work",
    label: "Work",
    opens: { kind: "page", page: "work" },
    key: "3",
    share: 0.23,
    idle: "Code on the screen types itself; the amber cursor blinks",
    phone: { x: 0.55, z: 0.3, scale: 0.95 },
  },
  {
    id: "skills",
    node: "skills",
    label: "Skills",
    opens: { kind: "page", page: "skills" },
    key: "4",
    share: 0.06,
    idle: "Pencils sway a little",
    phone: { x: 1.95, z: -3.7, scale: 1 },
  },
  {
    id: "arcade",
    node: "arcade",
    label: "Arcade",
    opens: { kind: "page", page: "arcade" },
    key: "5",
    share: 0.08,
    idle: "Buttons blink amber once every ~8 s",
    phone: { x: 0.1, z: 3.2, scale: 0.7 },
  },
  {
    id: "lights",
    node: "lamp",
    label: "Lights",
    opens: { kind: "theme" },
    key: "T",
    share: 0.06,
    idle: "The bulb flickers on when the room assembles",
    phone: null,
  },
  {
    id: "contact",
    node: "contact",
    label: "Contact",
    opens: { kind: "page", page: "contact" },
    key: "6",
    share: 0.07,
    idle: "Flap lifts 2° on hover",
    phone: { x: 2.05, z: 3.1, scale: 0.7 },
  },
  {
    id: "plant",
    node: "plant",
    label: null,
    opens: { kind: "plant" },
    key: null,
    share: 0.06,
    idle: "Leaves sway",
    phone: { x: -1.95, z: -3.7, scale: 1 },
  },
];

/**
 * Everything that isn't an object: 25% of the particles (desk dust, the bright front edge,
 * the lamp's light pool and cone, floating motes). Shares are of all the particles.
 */
export const roomAmbience = {
  dust: 0.15,
  edge: 0.025,
  pool: 0.045,
  cone: 0.02,
  motes: 0.01,
} as const;

/** Model-space geometry the ambience and the details are built around. */
export const roomGeometry = {
  /** The desk surface (x and z ranges), at y = 0; the front edge is its +z side. */
  desk: { x: [-5.8, 6.9], z: [-3.4, 2.3] },
  /** Phone desk (three rows), at y = 0. */
  phoneDesk: { x: [-3, 3], z: [-4.1, 4.1] },
  /** The light pool on the desk under the lamp's shade, and the shade's mouth above it. */
  pool: { centre: [3.95, 0, -0.95], radius: 1.25 },
  shade: { centre: [4.2, 0.87, -1.2], radius: 0.42 },
  /** The laptop screen's inner face: bottom-left corner, the right and up edges. */
  screen: {
    origin: [-1.45, 0.275, -1.315],
    right: [2.9, 0, 0],
    up: [0, 1.712, -0.556],
    /** Share of the laptop's particles drawn as code (the rest form the laptop). */
    share: 0.25,
  },
  /** Steam over the mug: three wisps from the rim, rising this high. */
  steam: { origin: [-1.75, 0.66, 1.55], height: 0.95, wisps: 3, share: 0.4 },
} as const;
