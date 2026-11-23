/*
 * Shared by the site-control commands (6.5): pages, tracks and the sound switch. Not a command
 * (registry.ts lists the commands by hand).
 */
import { chapterNumber, chapters } from "@/content/chapters";
import { tracks } from "@/content/music";
import { slugify } from "@/lib/content/slug";
import { initSfx } from "@/lib/sfx";
import type { CommandContext } from "./types";

/** "about", "2", "02", "/about" or "About" → that page. */
export function findPage(word: string) {
  const w = word.trim().toLowerCase();
  const n = Number(w);
  return chapters.find(
    (c, i) =>
      c.id === w ||
      c.route === w ||
      c.name.toLowerCase() === w ||
      (Number.isInteger(n) && n === i + 1),
  );
}

export const pageNames = () => chapters.map((c) => c.id).join(", ");

export const pageNumber = (id: string) =>
  chapterNumber(chapters.findIndex((c) => c.id === id));

/**
 * A track by its number in the playlist (1-based, as `ls music/` lists them), its id, its file
 * name, or the start of its title ("gehra", "worlds end"). -1 if none.
 */
export function findTrack(word: string): number {
  const w = word
    .trim()
    .toLowerCase()
    .replace(/\.mp3$/, "");
  const n = Number(w);
  if (Number.isInteger(n) && n >= 1 && n <= tracks.length) return n - 1;
  const slug = slugify(w);
  if (!slug) return -1;
  const exact = tracks.findIndex(
    (t) => t.id === slug || slugify(t.title) === slug,
  );
  if (exact >= 0) return exact;
  return tracks.findIndex((t) => slugify(t.title).startsWith(slug));
}

/**
 * Sound on without the island alert's music start (the caller starts a specific track). Enter
 * is a user gesture, so creating the AudioContext here is allowed.
 */
export function soundOnQuietly(ctx: CommandContext): void {
  const ui = ctx.store.getState().ui;
  if (ui.soundEnabled) return;
  ui.setSoundEnabled(true);
  void initSfx();
}

/** The track the store says is current. */
export function currentTrack(ctx: CommandContext) {
  return tracks[ctx.store.getState().audio.trackIndex];
}
