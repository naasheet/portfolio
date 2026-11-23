/*
 * The command registry (6.2). Every command is imported here by hand (no glob): adding a
 * command means one file in lib/commands/ and one line below. Every command shows in `help`.
 * Also: lookup by name or alias, "did you mean" suggestions, and Tab completion.
 */
import { ar } from "./ar";
import { ask } from "./ask";
import { contact } from "./contact";
import { goto } from "./goto";
import { next } from "./next";
import { particles } from "./particles";
import { pause } from "./pause";
import { play } from "./play";
import { prev } from "./prev";
import { projects } from "./projects";
import { sound } from "./sound";
import { theme } from "./theme";
import { vol } from "./vol";
import { cat } from "./cat";
import { cd } from "./cd";
import { clear } from "./clear";
import { date } from "./date";
import { echo } from "./echo";
import { exit } from "./exit";
import { grep } from "./grep";
import { help } from "./help";
import { history } from "./history";
import { ls } from "./ls";
import { neofetch } from "./neofetch";
import { open } from "./open";
import { pwd } from "./pwd";
import { skills } from "./skills";
import { sudo } from "./sudo";
import { tree } from "./tree";
import { whoami } from "./whoami";
import type { Command, CommandContext } from "./types";

export const commands: readonly Command[] = [
  // Shell
  help,
  history,
  clear,
  echo,
  grep,
  date,
  exit,
  // Getting around (6.3)
  ls,
  cd,
  pwd,
  cat,
  tree,
  open,
  goto,
  projects,
  // The site (6.5)
  theme,
  particles,
  ar,
  ask,
  contact,
  // Music (6.5)
  play,
  pause,
  next,
  prev,
  vol,
  sound,
  // About me
  whoami,
  skills,
  neofetch,
  // Just for fun
  sudo,
];

const byName = new Map<string, Command>();
for (const command of commands) {
  for (const name of [command.name, ...(command.aliases ?? [])]) {
    if (byName.has(name))
      throw new Error(`lib/commands: "${name}" is registered twice`);
    byName.set(name, command);
  }
}

export function findCommand(name: string): Command | undefined {
  return byName.get(name);
}

/** Every name a visitor can type (names and aliases), sorted. */
export function commandNames(): string[] {
  return [...byName.keys()].sort();
}

/**
 * Edit distance with adjacent swaps counted as one edit (optimal string alignment), so the
 * commonest typo, two letters swapped ("hlep"), is 1 away from what was meant.
 */
export function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(
        d[i - 1]![j]! + 1,
        d[i]![j - 1]! + 1,
        d[i - 1]![j - 1]! + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        v = Math.min(v, d[i - 2]![j - 2]! + 1);
      d[i]![j] = v;
    }
  }
  return d[a.length]![b.length]!;
}

/** The closest command name within 2 edits, for "did you mean …?". */
export function suggest(name: string): string | undefined {
  let best: string | undefined;
  let bestDistance = 3;
  for (const candidate of commandNames()) {
    const d = editDistance(name.toLowerCase(), candidate);
    if (d < bestDistance) {
      best = candidate;
      bestDistance = d;
    }
  }
  return best;
}

export type Completion =
  /** Replace the input with this (and put the caret at `caret`). */
  | { kind: "replace"; input: string; caret: number }
  /** Several candidates share no more prefix: list them. */
  | { kind: "list"; candidates: string[] }
  | { kind: "none" };

/** The longest common prefix of the candidates. */
function commonPrefix(words: string[]): string {
  let prefix = words[0] ?? "";
  for (const w of words)
    while (!w.startsWith(prefix)) prefix = prefix.slice(0, -1);
  return prefix;
}

/**
 * Tab (6.2): complete the word before the caret: a command name at the start of a pipe stage,
 * else an argument through that command's own `complete`. One candidate fills in (plus a space);
 * several fill in their common prefix, or are listed when there's nothing more to add.
 */
export function complete(
  input: string,
  caret: number,
  ctx: Pick<CommandContext, "store" | "fs" | "cwd">,
): Completion {
  const before = input.slice(0, caret);
  const stage = before.slice(before.lastIndexOf("|") + 1);
  const words = stage.trimStart().split(/\s+/);
  const word = words[words.length - 1] ?? "";
  let pool: string[];
  if (words.length <= 1) {
    pool = commandNames();
  } else {
    const command = findCommand(words[0]!);
    // help / man complete command names (help can't import the registry: a cycle).
    pool =
      command === help
        ? commandNames()
        : (command?.complete?.(words.slice(1), ctx) ?? []);
  }
  const candidates = [...new Set(pool.filter((c) => c.startsWith(word)))];
  if (candidates.length === 0) return { kind: "none" };

  const fill = (text: string) => {
    const head = before.slice(0, before.length - word.length) + text;
    return {
      kind: "replace" as const,
      input: head + input.slice(caret),
      caret: head.length,
    };
  };
  // A directory ends in "/" and takes no space, so Tab can go on into it (6.3).
  if (candidates.length === 1) {
    const only = candidates[0]!;
    return fill(only.endsWith("/") ? only : `${only} `);
  }
  const prefix = commonPrefix(candidates);
  if (prefix.length > word.length) return fill(prefix);
  return { kind: "list", candidates: candidates.sort() };
}
