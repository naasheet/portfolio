/*
 * Critical assets the entry gate waits for (lib/preload.ts). Each has a weight; the gate shows
 * loadedWeight / totalWeight. Weights are each asset's size in KB, so the percentage tracks
 * bytes the way DevTools' Network tab does.
 */
import type { StaticImageData } from "next/image";

type Base = {
  /** Shown in progress reports and errors. */
  id: string;
  /** Roughly the asset's size in KB. */
  weight: number;
  /** "sound": only when the visitor chose sound before (localStorage "sound" = "1"). */
  when?: "always" | "sound";
};

export type PreloadEntry = Base &
  (
    | {
        /** Wait for document.fonts.ready (the preloaded SF Pro Text files). */
        kind: "fonts";
      }
    | {
        /** Fetch a URL as is; `range` fetches only those bytes (e.g. a track's first chunk). */
        kind: "url";
        url: string;
        range?: [start: number, end: number];
      }
    | {
        /**
         * An image the page shows through next/image: the preloader requests the same optimized
         * URL the page will (same width, height and sizes), so it is already cached at the gate.
         */
        kind: "image";
        src: StaticImageData | string;
        width: number;
        height: number;
        /** Must match the `sizes` the page passes to the image. */
        sizes: string;
        /** Share of the viewport width it renders at, used to pick the srcset candidate. */
        vw: number;
      }
  );

export const preloadManifest: PreloadEntry[] = [
  // SF Pro Text 400/500/600/700, the only fonts preloaded in app/fonts.ts (~258 KB together).
  { id: "fonts", kind: "fonts", weight: 258 },

  // TODO(content): the hero photo (chunk 4.2), once it exists, e.g.
  // { id: "hero-photo", kind: "image", src: heroPhoto, width: 1200, height: 1500,
  //   sizes: "(min-width: 1024px) 33vw, 100vw", vw: 0.33, weight: 120 },

  // The particle shapes' models (chunk 3.2), so canvas/shapes/registry.ts reads them from cache.
  // The particle room on Home (R.3); 102 KB gzipped over the wire.
  { id: "model-room", kind: "url", url: "/models/room.glb", weight: 102 },
  { id: "model-sphere", kind: "url", url: "/models/sphere.glb", weight: 32 },
  { id: "model-laptop", kind: "url", url: "/models/laptop.glb", weight: 13 },
  { id: "model-rings", kind: "url", url: "/models/rings.glb", weight: 45 },
  {
    id: "model-controller",
    kind: "url",
    url: "/models/controller.glb",
    weight: 52,
  },
  { id: "model-envelope", kind: "url", url: "/models/envelope.glb", weight: 4 },

  // TODO(content): the first track's first chunk (chunk 5.1), only if sound was chosen before, e.g.
  // { id: "track-1", kind: "url", url: "/audio/[track].mp3", range: [0, 262143], weight: 256,
  //   when: "sound" },
];
