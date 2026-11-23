/* whoami (6.4): you're the visitor; then who I am, from content/profile.ts. */
import { profile } from "@/content/profile";
import { terminalCopy } from "@/content/terminal";
import type { Command } from "./types";

const t = terminalCopy.commands.whoami;

export const whoami: Command = {
  name: "whoami",
  category: "about",
  description: t.description,
  usage: t.usage,
  examples: ["whoami"],
  run(_args, { print }) {
    print([
      { kind: "text", text: t.you },
      {
        kind: "text",
        text: t.me(profile.name, profile.title, profile.location.city),
        tone: "muted",
      },
    ]);
  },
};
