/*
 * projects (6.5): every project in content/projects.ts as a table, filtered like the Work page
 * (one --stack or --domain, matched by slug, so "next.js", "Next.js" and "next-js" all work).
 */
import { projects as all } from "@/content/projects";
import { terminalCopy } from "@/content/terminal";
import { slugify } from "@/lib/content/slug";
import type { Command } from "./types";

const t = terminalCopy.commands.projects;

const unique = (values: string[]) => [...new Set(values)];

export const projects: Command = {
  name: "projects",
  category: "navigate",
  description: t.description,
  usage: t.usage,
  examples: ["projects", "projects --stack react", "projects | grep 2026"],
  complete: () => ["--stack=", "--domain="],
  run(args, ctx) {
    // `--stack react` parses as a flag and a positional, `--stack=react` as one value.
    const pick = (flag: "stack" | "domain"): string | null | undefined => {
      const value = args.flags[flag];
      if (value === undefined) return undefined;
      if (value === true) return args._[0] ?? null;
      return value;
    };
    const stack = pick("stack");
    const domain = pick("domain");
    if (stack === null || domain === null) {
      ctx.printError(t.flagValue(stack === null ? "stack" : "domain"));
      return;
    }
    const shown = all.filter(
      (p) =>
        (stack === undefined ||
          p.stack.some((s) => slugify(s) === slugify(stack))) &&
        (domain === undefined || slugify(p.domain) === slugify(domain)),
    );
    if (shown.length === 0) {
      const options =
        stack !== undefined
          ? unique(all.flatMap((p) => p.stack))
          : unique(all.map((p) => p.domain));
      ctx.printError(
        t.none(
          stack !== undefined ? `--stack ${stack}` : `--domain ${domain}`,
          options.map(slugify).join(", "),
        ),
      );
      return;
    }
    ctx.print([
      {
        kind: "table",
        head: [...t.head],
        rows: shown.map((p) => [
          p.slug,
          p.title,
          String(p.year),
          p.stack.join(", "),
        ]),
      },
      { kind: "text", text: t.count(shown.length, all.length), tone: "muted" },
    ]);
  },
};
