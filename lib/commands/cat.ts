/*
 * cat (6.3): print files; Markdown is styled (lib/terminal/markdown.ts), text prints as is. The
 * PDF and tracks are binary: it points to `open`. With no file and a pipe, it passes stdin on.
 */
import { terminalCopy } from "@/content/terminal";
import { renderMarkdown } from "@/lib/terminal/markdown";
import type { Command } from "./types";

const t = terminalCopy.commands.cat;

export const cat: Command = {
  name: "cat",
  category: "navigate",
  description: t.description,
  usage: t.usage,
  examples: [
    "cat about.md",
    "cat projects/filmly.md",
    "cat skills.txt | grep Area",
  ],
  complete: (args, { fs, cwd }) =>
    fs.completePath(args[args.length - 1] ?? "", cwd),
  run(args, { fs, cwd, print, printError, stdin, piped }) {
    if (args._.length === 0) {
      if (piped) print(stdin.map((text) => ({ kind: "text" as const, text })));
      else printError(t.missing);
      return;
    }
    for (const target of args._) {
      const node = fs.get(fs.resolve(cwd, target));
      if (!node) {
        printError(terminalCopy.commands.notFound("cat", target));
        continue;
      }
      if (node.kind === "dir") {
        printError(t.isDir(target));
        continue;
      }
      // Before reading: ~/.secrets lists itself as found on the read that finds it.
      node.onRead?.();
      const text = fs.read(node);
      if (text === null) {
        printError(t.binary(target));
        continue;
      }
      print(
        node.format === "md"
          ? renderMarkdown(text)
          : text
              .split("\n")
              .map((line) => ({ kind: "text" as const, text: line || " " })),
      );
    }
  },
};
