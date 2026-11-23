/*
 * neofetch (6.4): an ASCII "NK" monogram beside key / value lines: name, role, location, the
 * site's stack, uptime since this page load, theme, and the current track. Plain ASCII on
 * purpose: block characters aren't in the subset SF Mono and would fall back and misalign.
 */
import { tracks } from "@/content/music";
import { profile } from "@/content/profile";
import { terminalCopy } from "@/content/terminal";
import type { Command } from "./types";

const t = terminalCopy.commands.neofetch;

const MONOGRAM = [
  " _   _ _  __",
  "| \\ | | |/ /",
  "|  \\| | ' / ",
  "| |\\  | . \\ ",
  "|_| \\_|_|\\_\\",
];

export const neofetch: Command = {
  name: "neofetch",
  category: "about",
  description: t.description,
  usage: t.usage,
  examples: ["neofetch"],
  run(_args, { print, store }) {
    const { audio, theme } = store.getState();
    const track = audio.playing ? tracks[audio.trackIndex] : undefined;
    const user = `${terminalCopy.terminal.user}@${terminalCopy.terminal.host}`;
    // Uptime: since this page was loaded (client navigations keep counting).
    const uptime = Math.max(0, Math.round(performance.now() / 1000));
    const info = [
      user,
      "-".repeat(user.length),
      `${t.name}: ${profile.name}`,
      `${t.role}: ${profile.title}`,
      `${t.location}: ${profile.location.city} (${profile.location.zoneLabel})`,
      `${t.stack}: ${t.stackValue}`,
      `${t.uptime}: ${t.duration(uptime)}`,
      `${t.theme}: ${t.themes[theme.mode]}`,
      `${t.track}: ${track ? `${track.title} — ${track.artist}` : t.silence}`,
    ];
    const rows = Math.max(MONOGRAM.length, info.length);
    print({
      kind: "table",
      rows: Array.from({ length: rows }, (_, i) => [
        MONOGRAM[i] ?? "",
        info[i] ?? "",
      ]),
    });
  },
};
