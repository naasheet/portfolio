/* tree (6.3): the folders drawn with box-drawing lines, then a count. -a shows hidden files. */
import { terminalCopy } from "@/content/terminal";
import type { FsDir } from "@/lib/fs";
import type { Command } from "./types";

const t = terminalCopy.commands.tree;

export const tree: Command = {
  name: "tree",
  category: "navigate",
  description: t.description,
  usage: t.usage,
  examples: ["tree", "tree -a", "tree projects"],
  complete: (args, { fs, cwd }) =>
    fs.completePath(args[args.length - 1] ?? "", cwd, { dirsOnly: true }),
  run(args, { fs, cwd, print, printError }) {
    const target = args._[0] ?? ".";
    const all = args.flags.a === true;
    const node = fs.get(fs.resolve(cwd, target));
    if (!node) {
      printError(terminalCopy.commands.notFound("tree", target));
      return;
    }
    const lines = [target === "." ? cwd : target];
    let dirs = 0;
    let files = 0;
    const walk = (dir: FsDir, indent: string) => {
      const entries = fs.list(dir, all);
      entries.forEach((entry, i) => {
        const last = i === entries.length - 1;
        lines.push(
          `${indent}${last ? "└── " : "├── "}${entry.name}${entry.kind === "dir" ? "/" : ""}`,
        );
        if (entry.kind === "dir") {
          dirs += 1;
          walk(entry, indent + (last ? "    " : "│   "));
        } else files += 1;
      });
    };
    if (node.kind === "dir") walk(node, "");
    else files = 1;
    print([
      { kind: "ascii", text: lines.join("\n") },
      { kind: "text", text: " " },
      { kind: "text", text: t.summary(dirs, files), tone: "muted" },
    ]);
  },
};
