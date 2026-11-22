/* cd (6.3): change directory; no argument goes home. The prompt shows where you are. */
import { terminalCopy } from "@/content/terminal";
import { HOME } from "@/lib/fs";
import type { Command } from "./types";

const t = terminalCopy.commands.cd;

export const cd: Command = {
  name: "cd",
  description: t.description,
  usage: t.usage,
  examples: ["cd projects", "cd ..", "cd ~"],
  complete: (args, { fs, cwd }) =>
    fs.completePath(args[args.length - 1] ?? "", cwd, { dirsOnly: true }),
  run(args, { fs, cwd, setCwd, printError }) {
    const target = args._[0] ?? HOME;
    const path = fs.resolve(cwd, target);
    const node = fs.get(path);
    if (!node) printError(terminalCopy.commands.notFound("cd", target));
    else if (node.kind !== "dir") printError(t.notDir(target));
    else setCwd(path);
  },
};
