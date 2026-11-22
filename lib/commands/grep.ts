/*
 * grep (6.2): the first command that reads a pipe. Keeps the lines of stdin that contain the
 * pattern (plain text, not a regex), highlighting each match.
 *   -i  ignore case    -v  keep the lines that don't match    -n  number the lines
 */
import { terminalCopy } from "@/content/terminal";
import type { Command } from "./types";

const t = terminalCopy.commands.grep;

/** Every [start, end) occurrence of `needle` in `hay` (already case-folded when -i). */
function find(hay: string, needle: string): [number, number][] {
  const marks: [number, number][] = [];
  if (!needle) return marks;
  let at = hay.indexOf(needle);
  while (at >= 0) {
    marks.push([at, at + needle.length]);
    at = hay.indexOf(needle, at + needle.length);
  }
  return marks;
}

export const grep: Command = {
  name: "grep",
  description: t.description,
  usage: t.usage,
  examples: ["help | grep music", 'echo "Hello World" | grep -i world'],
  run(args, ctx) {
    const pattern = args._[0];
    if (pattern === undefined) {
      ctx.printError(t.noPattern);
      return;
    }
    if (!ctx.piped) {
      ctx.printError(t.noInput);
      return;
    }
    const ignoreCase = args.flags.i === true;
    const invert = args.flags.v === true;
    const number = args.flags.n === true;
    const needle = ignoreCase ? pattern.toLowerCase() : pattern;

    ctx.stdin.forEach((line, i) => {
      const marks = find(ignoreCase ? line.toLowerCase() : line, needle);
      if (marks.length > 0 === invert) return;
      const prefix = number ? `${i + 1}:` : "";
      ctx.print({
        kind: "text",
        text: prefix + line,
        marks: invert
          ? undefined
          : marks.map(([a, b]) => [a + prefix.length, b + prefix.length]),
      });
    });
  },
};
