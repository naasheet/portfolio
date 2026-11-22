import { beforeEach, describe, expect, it } from "vitest";
import { execute } from "../exec";
import { complete, editDistance, suggest } from "../registry";
import { getSession, session } from "@/lib/terminal/session";
import { useStore } from "@/lib/store";

const router = { push: () => {} };
const run = (line: string) =>
  execute(line, { router, signal: new AbortController().signal });
const printed = () =>
  getSession().entries.map(({ line }) =>
    line.kind === "table"
      ? line.rows.map((r) => r.join("  "))
      : "text" in line
        ? line.text
        : "",
  );
const ctx = { store: useStore, fs: null, cwd: "~" };

beforeEach(() => session.clear());

describe("pipes", () => {
  it("feeds the left command's output to grep", async () => {
    await run('echo "Hello World" | grep -i world');
    expect(printed()).toEqual(["Hello World"]);
  });
  it("filters help's table", async () => {
    await run("help | grep grep");
    expect(printed()).toEqual([
      "grep  Keep the piped lines that match a pattern",
    ]);
  });
  it("chains more than one pipe and inverts", async () => {
    await run("help | grep -v help | grep -v grep");
    expect(printed()).toEqual([
      "3 commands. Type one to run it.",
      "echo  Print what you type after it",
    ]);
  });
  it("marks the matches", async () => {
    await run("echo abcabc | grep bc");
    const line = getSession().entries[0]!.line;
    expect(line.kind === "text" && line.marks).toEqual([
      [1, 3],
      [4, 6],
    ]);
  });
  it("numbers lines with -n", async () => {
    await run("help | grep -n echo");
    expect(printed()[0]).toMatch(/^\d+:echo/);
  });
  it("says grep needs a pipe", async () => {
    await run("grep music");
    expect(getSession().entries[0]!.line.kind).toBe("error");
  });
});

describe("help | grep music", () => {
  // Honest until 6.5 registers the music commands: nothing in help mentions music yet, and the
  // help header must never match by itself (it once did: "help | grep music" was in it).
  it("matches nothing but real command lines", async () => {
    await run("help | grep music");
    expect(printed()).toEqual([]);
  });
});

describe("errors", () => {
  it("suggests a close command", async () => {
    await run("hlep");
    expect(printed()).toEqual(["command not found: hlep — did you mean help?"]);
  });
  it("reports a syntax error", async () => {
    await run('echo "oops');
    expect(printed()[0]).toMatch(/^syntax error: unclosed double quote/);
  });
  it("finds no suggestion further than 2 edits", () => {
    expect(suggest("xyzzy")).toBeUndefined();
    expect(editDistance("kitten", "sitting")).toBe(3);
    expect(editDistance("hlep", "help")).toBe(1);
  });
});

describe("Tab completion", () => {
  it("completes a unique command name with a space", () => {
    expect(complete("gr", 2, ctx)).toEqual({
      kind: "replace",
      input: "grep ",
      caret: 5,
    });
  });
  it("completes after a pipe", () => {
    expect(complete("help | g", 8, ctx)).toEqual({
      kind: "replace",
      input: "help | grep ",
      caret: 12,
    });
  });
  it("lists every command for an empty word", () => {
    expect(complete("", 0, ctx)).toEqual({
      kind: "list",
      candidates: ["echo", "grep", "help"],
    });
  });
  it("leaves text after the caret alone", () => {
    expect(complete("ec world", 2, ctx)).toEqual({
      kind: "replace",
      input: "echo  world",
      caret: 5,
    });
  });
});
