/*
 * help / man (6.4): every command grouped by category, or one command's description, usage,
 * aliases and examples. It reads the registry lazily (the registry imports this file, so a static
 * import would be a cycle).
 */
import { terminalCopy } from "@/content/terminal";
import type { OutputLine } from "@/lib/terminal/types";
import type { Category, Command } from "./types";

const t = terminalCopy.commands.help;
const ORDER = Object.keys(terminalCopy.commands.categories) as Category[];

export const help: Command = {
  name: "help",
  aliases: ["man"],
  category: "shell",
  description: t.description,
  usage: t.usage,
  examples: ["help", "help ls", "man grep", "help | grep music"],
  async run(args, ctx) {
    const { commands, findCommand, suggest } = await import("./registry");
    const name = args._[0];

    if (name !== undefined) {
      const command = findCommand(name);
      if (!command) {
        ctx.printError(terminalCopy.terminal.notFound(name, suggest(name)));
        return;
      }
      const lines: OutputLine[] = [
        {
          kind: "text",
          text: `${command.name} — ${command.description}`,
          tone: "accent",
        },
        { kind: "text", text: `${t.usageLabel}: ${command.usage}` },
      ];
      if (command.aliases?.length)
        lines.push({
          kind: "text",
          text: `${t.aliasesLabel}: ${command.aliases.join(", ")}`,
        });
      if (command.examples?.length)
        lines.push(
          { kind: "text", text: `${t.examplesLabel}:` },
          ...command.examples.map((example): OutputLine => ({
            kind: "text",
            text: `  $ ${example}`,
            tone: "muted",
          })),
        );
      ctx.print(lines);
      return;
    }

    const lines: OutputLine[] = [
      { kind: "text", text: t.count(commands.length), tone: "muted" },
    ];
    for (const category of ORDER) {
      const group = commands
        .filter((c) => c.category === category)
        .sort((a, b) => a.name.localeCompare(b.name));
      if (group.length === 0) continue;
      lines.push(
        { kind: "text", text: " " },
        {
          kind: "text",
          text: terminalCopy.commands.categories[category],
          tone: "accent",
        },
        { kind: "table", rows: group.map((c) => [c.name, c.description]) },
      );
    }
    ctx.print(lines);
  },
};
