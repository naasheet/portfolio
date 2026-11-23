/*
 * ls (6.3): one entry per line (so `ls | grep md` works), directories in teal with a "/".
 *   -l  a table: mode, size (text files: their real size; the PDF and tracks: "–"), name, note
 *   -a  hidden entries too, with . and ..
 */
import { terminalCopy } from "@/content/terminal";
import type { FsDir, FsNode } from "@/lib/fs";
import type { OutputLine } from "@/lib/terminal/types";
import type { Command } from "./types";

const t = terminalCopy.commands.ls;

function size(node: FsNode, read: (n: FsNode) => string | null): string {
  if (node.kind === "dir") return "–";
  const text = read(node);
  if (text === null) return "–";
  const bytes = new TextEncoder().encode(text).length;
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} K`;
}

export const ls: Command = {
  name: "ls",
  category: "navigate",
  description: t.description,
  usage: t.usage,
  examples: ["ls", "ls -la", "ls projects"],
  complete: (args, { fs, cwd }) =>
    fs.completePath(args[args.length - 1] ?? "", cwd),
  run(args, { fs, cwd, print, printError }) {
    const all = args.flags.a === true;
    const long = args.flags.l === true;
    const targets = args._.length ? args._ : ["."];
    const read = (n: FsNode) => (n.kind === "file" ? fs.read(n) : null);

    targets.forEach((target, i) => {
      const node = fs.get(fs.resolve(cwd, target));
      if (!node) {
        printError(terminalCopy.commands.notFound("ls", target));
        return;
      }
      if (targets.length > 1) {
        if (i > 0) print({ kind: "text", text: " " });
        print({ kind: "text", text: `${target}:`, tone: "muted" });
      }
      const entries: { name: string; node: FsNode }[] =
        node.kind === "file"
          ? [{ name: target, node }]
          : [
              ...(all
                ? [
                    { name: ".", node },
                    { name: "..", node: node as FsDir },
                  ]
                : []),
              ...fs.list(node, all).map((n) => ({ name: n.name, node: n })),
            ];

      if (long) {
        print({
          kind: "table",
          rows: entries.map(({ name, node: n }) => [
            n.kind === "dir" ? "drwxr-xr-x" : "-rw-r--r--",
            size(n, read),
            n.kind === "dir" && name !== "." && name !== ".."
              ? `${name}/`
              : name,
            n.kind === "file" ? (n.note ?? "") : "",
          ]),
        });
        return;
      }
      print(
        entries.map(({ name, node: n }): OutputLine =>
          n.kind === "dir"
            ? {
                kind: "text",
                text: name === "." || name === ".." ? name : `${name}/`,
                tone: "accent",
              }
            : { kind: "text", text: name },
        ),
      );
    });
  },
};
