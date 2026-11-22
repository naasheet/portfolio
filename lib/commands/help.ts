/*
 * help (6.2, minimal): every registered command with its description, so `help | grep x` finds
 * one. 6.4 adds the `man` alias and per-command help. It reads the registry lazily (the registry
 * imports this file, so a static import would be a cycle).
 */
import { copy } from "@/content/copy";
import type { Command } from "./types";

const t = copy.commands.help;

export const help: Command = {
  name: "help",
  description: t.description,
  usage: t.usage,
  async run(_args, ctx) {
    const { commands } = await import("./registry");
    const sorted = [...commands].sort((a, b) => a.name.localeCompare(b.name));
    ctx.print([
      { kind: "text", text: t.count(sorted.length), tone: "muted" },
      { kind: "table", rows: sorted.map((c) => [c.name, c.description]) },
    ]);
  },
};
