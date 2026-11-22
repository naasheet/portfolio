/*
 * The playlist (5.1): the audio engine (lib/audio/engine.ts), the player and the island (5.2),
 * the terminal's play / next / prev (6.x) and /credits (11.2). Track 1 plays first; the rest are
 * shuffled once per visit.
 *
 * LICENCES (CLAUDE.md §9.3): only tracks Nasheet has the rights to stream may ship. The files in
 * public/audio/ are gitignored, so nothing here is committed or deployed until it's licensed.
 * scripts/check-content.ts warns about a track without a licence locally and FAILS the build on
 * CI / Vercel (11.1), so an unlicensed track can't reach production.
 */

export type TrackLicense = {
  /** Who grants the right to stream it ("Pixabay Content License", "CC BY 4.0, artist's site"). */
  source: string;
  /** Where that licence or permission is written down. */
  url: string;
};

export type Track = {
  /** URL-safe and unique. */
  id: string;
  title: string;
  artist: string;
  /** A file under public/audio/ (MP3, 128–192 kbps: `npm run compress-media`). */
  src: string;
  /** Square cover art under public/audio/. */
  cover: string;
  /** null until the right to stream it is confirmed. */
  license: TrackLicense | null;
};

// TODO(content): local development tracks (commercial releases, not licensed for the site).
// Replace them with tracks you can stream (your own, Pixabay Music, the YouTube Audio Library,
// Free Music Archive CC-BY…) and fill in `license` before deploying (11.1).
export const tracks: readonly Track[] = [
  {
    id: "worlds-end-rhapsody",
    title: "World's End Rhapsody",
    artist: "Nujabes",
    src: "/audio/worlds_end_rhapsody.mp3",
    cover: "/audio/worlds_end_rhapsody.jpg",
    license: null,
  },
  {
    id: "gehra",
    title: "Gehra",
    artist: "DARZI",
    src: "/audio/gehra.mp3",
    cover: "/audio/gehra.jpg",
    license: null,
  },
  {
    id: "new-drop",
    title: "New Drop",
    artist: "Don Toliver",
    src: "/audio/new_drop.mp3",
    cover: "/audio/new_drop.jpg",
    license: null,
  },
  {
    id: "silk-and-cologne",
    title: "Silk and Cologne",
    artist: "Metro Boomin, EI8HT, Offset",
    src: "/audio/silk_and_cologne.mp3",
    cover: "/audio/silk_and_cologne.jpg",
    license: null,
  },
  {
    id: "smells-like-teen-spirit",
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    src: "/audio/smells_like_teen_spirit.mp3",
    cover: "/audio/smells_like_teen_spirit.jpg",
    license: null,
  },
  {
    id: "tv-off",
    title: "tv off",
    artist: "Kendrick Lamar",
    src: "/audio/tv_off.mp3",
    cover: "/audio/tv_off.jpg",
    license: null,
  },
];
