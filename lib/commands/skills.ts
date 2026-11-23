/*
 * skills (6.4): content/skills.ts as a table, area by area. A skill without a level shows empty
 * dots, never a made-up rating (as on the Skills page).
 */
import { learning, skillAreas } from "@/content/skills";
import { terminalCopy } from "@/content/terminal";
import type { OutputLine } from "@/lib/terminal/types";
import type { Command } from "./types";

const t = terminalCopy.commands.skills;

export const skills: Command = {
  name: "skills",
  category: "about",
  description: t.description,
  usage: t.usage,
  examples: ["skills", "skills | grep React"],
  run(_args, { print }) {
    const lines: OutputLine[] = [];
    for (const area of skillAreas) {
      lines.push(
        {
          kind: "text",
          text: `${area.name} — ${area.summary}`,
          tone: "accent",
        },
        {
          kind: "table",
          head: [...t.head],
          rows: area.skills.map((s) => [
            s.name,
            "●".repeat(s.level ?? 0) + "○".repeat(5 - (s.level ?? 0)),
            s.years ? t.years(s.years) : "",
          ]),
        },
        { kind: "text", text: " " },
      );
    }
    lines.push(
      { kind: "text", text: t.learning, tone: "accent" },
      ...learning.map((l): OutputLine => ({
        kind: "text",
        text: `  ${l.name}${l.progress !== undefined ? `  ${l.progress}%` : ""}`,
      })),
    );
    print(lines);
  },
};
