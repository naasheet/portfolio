import { describe, expect, it } from "vitest";
import { PARSE_ERRORS, parse, parseArgs, tokenize } from "../parser";

/** The token values of a line's first group (a pipeline), stage by stage. */
const words = (line: string) => {
  const r = tokenize(line);
  if (!r.ok) throw new Error(r.error);
  return (r.groups[0]?.pipeline ?? []).map((stage) =>
    stage.map((t) => t.value),
  );
};

const stages = (line: string) => {
  const r = parse(line);
  if (!r.ok) throw new Error(r.error);
  return r.groups[0]?.stages ?? [];
};

/** Each group's operator and its stages' command names. */
const groups = (line: string) => {
  const r = parse(line);
  if (!r.ok) throw new Error(r.error);
  return r.groups.map((g) => [g.op, g.stages.map((s) => s.name).join("|")]);
};

const error = (line: string) => {
  const r = parse(line);
  return r.ok ? null : r.error;
};

describe("tokenize: words and whitespace", () => {
  it("splits on any whitespace and ignores the ends", () => {
    expect(words("  ls   -la\tcontent  ")).toEqual([["ls", "-la", "content"]]);
  });
  it("gives no stages for a blank line", () => {
    expect(words("")).toEqual([]);
    expect(words("   ")).toEqual([]);
  });
});

describe("tokenize: quotes", () => {
  it("keeps double-quoted spaces in one token", () => {
    expect(words('echo "hello world"')).toEqual([["echo", "hello world"]]);
  });
  it("keeps single-quoted text literally, backslashes included", () => {
    expect(words("echo 'a \\n b'")).toEqual([["echo", "a \\n b"]]);
  });
  it('unescapes \\" and \\\\ inside double quotes, and leaves other backslashes', () => {
    expect(words('echo "say \\"hi\\" \\\\ \\n"')).toEqual([
      ["echo", 'say "hi" \\ \\n'],
    ]);
  });
  it("joins quoted and unquoted parts of one word", () => {
    expect(words(`echo ab"c d"'e'f`)).toEqual([["echo", "abc def"]]);
  });
  it("keeps an empty quoted argument", () => {
    expect(words('echo ""')).toEqual([["echo", ""]]);
  });
  it("lets the other quote appear inside", () => {
    expect(words(`echo "it's" 'say "x"'`)).toEqual([
      ["echo", "it's", 'say "x"'],
    ]);
  });
});

describe("tokenize: escapes outside quotes", () => {
  it("escapes a space, a quote and a pipe", () => {
    expect(words("echo a\\ b \\' \\|")).toEqual([["echo", "a b", "'", "|"]]);
  });
});

describe("tokenize: pipes", () => {
  it("splits stages on an unquoted pipe, with or without spaces", () => {
    expect(words("help | grep music")).toEqual([["help"], ["grep", "music"]]);
    expect(words("help|grep music|grep -i x")).toEqual([
      ["help"],
      ["grep", "music"],
      ["grep", "-i", "x"],
    ]);
  });
  it("does not split on a quoted pipe", () => {
    expect(words('grep "a|b"')).toEqual([["grep", "a|b"]]);
    expect(words("grep 'a|b'")).toEqual([["grep", "a|b"]]);
  });
});

describe("parseArgs: flags", () => {
  const args = (line: string) => stages(line)[0]!.args;

  it("reads --name=value, --flag and -f", () => {
    expect(args("cmd --max=3 --verbose -i file").flags).toEqual({
      max: "3",
      verbose: true,
      i: true,
    });
    expect(args("cmd --max=3 --verbose -i file")._).toEqual(["file"]);
  });
  it("splits combined short flags", () => {
    expect(args("ls -la").flags).toEqual({ l: true, a: true });
  });
  it("keeps an empty --name= value and = signs after the first", () => {
    expect(args("cmd --q= --eq=a=b").flags).toEqual({ q: "", eq: "a=b" });
  });
  it("lets a flag value be quoted", () => {
    expect(args('cmd --name="two words"').flags).toEqual({ name: "two words" });
  });
  it("treats quoted or escaped dashes as values, not flags", () => {
    expect(args('grep "-v" \\-x').flags).toEqual({});
    expect(args('grep "-v" \\-x')._).toEqual(["-v", "-x"]);
  });
  it("stops reading flags after --", () => {
    const a = args("grep -i -- -v --x");
    expect(a.flags).toEqual({ i: true });
    expect(a._).toEqual(["-v", "--x"]);
  });
  it("treats a lone - as a value", () => {
    expect(args("cat -")._).toEqual(["-"]);
  });
  it("keeps every token in raw", () => {
    expect(args('grep -i "now playing"').raw).toEqual(["-i", "now playing"]);
  });
  it("parses tokens directly too", () => {
    expect(parseArgs([{ value: "-n", literal: false }]).flags).toEqual({
      n: true,
    });
  });
});

describe("parse: stages", () => {
  it("names each stage and parses its arguments", () => {
    const s = stages("help | grep -i music");
    expect(s.map((x) => x.name)).toEqual(["help", "grep"]);
    expect(s[1]!.args).toEqual({
      _: ["music"],
      flags: { i: true },
      raw: ["-i", "music"],
    });
  });
});

describe("parse: && and ;", () => {
  it("splits groups and records the operator", () => {
    expect(groups("cd projects && ls")).toEqual([
      [null, "cd"],
      ["&&", "ls"],
    ]);
    expect(groups("pwd; ls -a ;help|grep x")).toEqual([
      [null, "pwd"],
      [";", "ls"],
      [";", "help|grep"],
    ]);
  });
  it("works without spaces and keeps each group's arguments", () => {
    expect(groups("cd ~&&ls")).toEqual([
      [null, "cd"],
      ["&&", "ls"],
    ]);
    const r = parse("cd projects && ls -l");
    expect(r.ok && r.groups[1]!.stages[0]!.args.flags).toEqual({ l: true });
  });
  it("allows a trailing ;", () => {
    expect(groups("ls;")).toEqual([[null, "ls"]]);
  });
  it("keeps quoted or escaped operators, and a lone &, as text", () => {
    expect(words('echo "a && b" \\; c&d')).toEqual([
      ["echo", "a && b", ";", "c&d"],
    ]);
  });
});

describe("parse: bad input", () => {
  it("rejects unclosed quotes", () => {
    expect(error('echo "hi')).toBe(PARSE_ERRORS.unclosedDouble);
    expect(error("echo 'hi")).toBe(PARSE_ERRORS.unclosedSingle);
  });
  it("rejects a trailing backslash", () => {
    expect(error("echo hi\\")).toBe(PARSE_ERRORS.trailingEscape);
  });
  it("rejects && or ; with nothing before, and && with nothing after", () => {
    expect(error("&& ls")).toBe(PARSE_ERRORS.emptyAnd);
    expect(error("ls &&")).toBe(PARSE_ERRORS.emptyAnd);
    expect(error("; ls")).toBe(PARSE_ERRORS.emptySemicolon);
    expect(error("ls && && pwd")).toBe(PARSE_ERRORS.emptyAnd);
    expect(error("help | && ls")).toBe(PARSE_ERRORS.emptyStage);
  });
  it("rejects empty pipe stages", () => {
    expect(error("| grep x")).toBe(PARSE_ERRORS.emptyStage);
    expect(error("help |")).toBe(PARSE_ERRORS.emptyStage);
    expect(error("help || grep x")).toBe(PARSE_ERRORS.emptyStage);
    expect(error("help |   | grep x")).toBe(PARSE_ERRORS.emptyStage);
  });
});
