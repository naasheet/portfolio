/*
 * The terminal's tokenizer and argument parser (6.2). Pure: no DOM, no store (unit-tested in
 * __tests__/parser.test.ts).
 *
 *   'single quotes'    literal, nothing is special inside
 *   "double quotes"    \" and \\ escape; other backslashes stay as typed
 *   \x                 outside quotes: the next character, literally (so \| and \  work)
 *   |                  outside quotes: a pipe between commands
 *   &&  ;              outside quotes: run the next pipeline only if this one succeeded / anyway
 *                      (6.3); a lone & is an ordinary character
 *   --name=value, --flag, -f, -abc (= -a -b -c), and -- ends the flags
 */
import type { Args } from "./types";

export type Token = {
  value: string;
  /** It began with a quote or an escape: a value, never a flag. */
  literal: boolean;
};

export type Stage = { name: string; args: Args };

/** How a group joins the one before it: null for the first. */
export type Joiner = "&&" | ";" | null;

/** One pipeline (`a | b`) and how it joins the previous one. */
export type Group<T> = { op: Joiner; pipeline: T[] };

export type ParseResult =
  | { ok: true; groups: { op: Joiner; stages: Stage[] }[] }
  | { ok: false; error: string };

export type TokenizeResult =
  { ok: true; groups: Group<Token[]>[] } | { ok: false; error: string };

export const PARSE_ERRORS = {
  unclosedSingle: "unclosed single quote (')",
  unclosedDouble: 'unclosed double quote (")',
  trailingEscape: "a backslash at the end of the line escapes nothing",
  emptyStage: "a pipe needs a command on both sides",
  emptyAnd: "&& needs a command on both sides",
  emptySemicolon: "; needs a command before it",
} as const;

/** Split a line into groups of pipe stages of tokens. A blank line is zero groups. */
export function tokenize(line: string): TokenizeResult {
  const groups: Group<Token[]>[] = [];
  let pipeline: Token[][] = [];
  let op: Joiner = null;
  let stage: Token[] = [];
  let value = "";
  let literal = false;
  let inToken = false;
  let sawPipe = false;
  let i = 0;

  // Only a token that *starts* quoted or escaped is literal: --name="two words" is still a flag.
  const startLiteral = () => {
    if (!inToken) literal = true;
    inToken = true;
  };
  const endToken = () => {
    if (inToken) stage.push({ value, literal });
    value = "";
    literal = false;
    inToken = false;
  };

  while (i < line.length) {
    const ch = line[i]!;
    if (ch === "'") {
      const close = line.indexOf("'", i + 1);
      if (close < 0) return { ok: false, error: PARSE_ERRORS.unclosedSingle };
      value += line.slice(i + 1, close);
      startLiteral();
      i = close + 1;
    } else if (ch === '"') {
      i += 1;
      let closed = false;
      while (i < line.length) {
        const c = line[i]!;
        if (c === "\\" && (line[i + 1] === '"' || line[i + 1] === "\\")) {
          value += line[i + 1];
          i += 2;
        } else if (c === '"') {
          closed = true;
          i += 1;
          break;
        } else {
          value += c;
          i += 1;
        }
      }
      if (!closed) return { ok: false, error: PARSE_ERRORS.unclosedDouble };
      startLiteral();
    } else if (ch === "\\") {
      if (i + 1 >= line.length)
        return { ok: false, error: PARSE_ERRORS.trailingEscape };
      value += line[i + 1];
      startLiteral();
      i += 2;
    } else if (ch === ";" || (ch === "&" && line[i + 1] === "&")) {
      const next: Joiner = ch === ";" ? ";" : "&&";
      endToken();
      if (stage.length === 0) {
        // "a |;" is an empty pipe stage; ";" or "&&" with nothing before is its own error.
        if (pipeline.length > 0)
          return { ok: false, error: PARSE_ERRORS.emptyStage };
        return {
          ok: false,
          error:
            next === ";" ? PARSE_ERRORS.emptySemicolon : PARSE_ERRORS.emptyAnd,
        };
      }
      pipeline.push(stage);
      groups.push({ op, pipeline });
      pipeline = [];
      stage = [];
      sawPipe = false;
      op = next;
      i += next.length;
    } else if (ch === "|") {
      endToken();
      if (stage.length === 0)
        return { ok: false, error: PARSE_ERRORS.emptyStage };
      pipeline.push(stage);
      stage = [];
      sawPipe = true;
      i += 1;
    } else if (/\s/.test(ch)) {
      endToken();
      i += 1;
    } else {
      value += ch;
      inToken = true;
      i += 1;
    }
  }
  endToken();
  if (stage.length > 0) {
    pipeline.push(stage);
    groups.push({ op, pipeline });
  } else if (sawPipe) {
    return { ok: false, error: PARSE_ERRORS.emptyStage };
  } else if (op === "&&") {
    // "a &&" waits for a command that never comes; a trailing ";" is fine, as in a shell.
    return { ok: false, error: PARSE_ERRORS.emptyAnd };
  }
  return { ok: true, groups };
}

/** Turn a command's tokens (after its name) into positionals and flags. */
export function parseArgs(tokens: Token[]): Args {
  const args: Args = { _: [], flags: {}, raw: tokens.map((t) => t.value) };
  let flagsDone = false;
  for (const { value, literal } of tokens) {
    if (flagsDone || literal || value === "-" || !value.startsWith("-")) {
      args._.push(value);
    } else if (value === "--") {
      flagsDone = true;
    } else if (value.startsWith("--")) {
      const eq = value.indexOf("=");
      if (eq > 2) args.flags[value.slice(2, eq)] = value.slice(eq + 1);
      else args.flags[value.slice(2)] = true;
    } else {
      for (const letter of value.slice(1)) args.flags[letter] = true;
    }
  }
  return args;
}

/** A whole line: groups of pipe stages, each a command name and its parsed arguments. */
export function parse(line: string): ParseResult {
  const tokens = tokenize(line);
  if (!tokens.ok) return tokens;
  return {
    ok: true,
    groups: tokens.groups.map((group) => ({
      op: group.op,
      stages: group.pipeline.map(([name, ...rest]) => ({
        name: name!.value,
        args: parseArgs(rest),
      })),
    })),
  };
}
