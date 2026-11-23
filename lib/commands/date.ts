/* date (6.4): your local time and mine (content/profile.ts's time zone). */
import { profile } from "@/content/profile";
import { terminalCopy } from "@/content/terminal";
import type { Command } from "./types";

const t = terminalCopy.commands.date;

const format = (date: Date, timeZone?: string) =>
  date.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  });

export const date: Command = {
  name: "date",
  category: "shell",
  description: t.description,
  usage: t.usage,
  examples: ["date"],
  run(_args, { print }) {
    const now = new Date();
    print({
      kind: "table",
      rows: [
        [t.yours, format(now)],
        [t.mine(profile.location.city), format(now, profile.location.timeZone)],
      ],
    });
  },
};
