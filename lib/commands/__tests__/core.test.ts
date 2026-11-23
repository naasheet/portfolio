import { beforeEach, describe, expect, it } from "vitest";
import { profile } from "@/content/profile";
import { terminalCopy } from "@/content/terminal";
import { useStore } from "@/lib/store";
import { getSession, session } from "@/lib/terminal/session";
import { execute } from "../exec";
import { commands, complete } from "../registry";
import { getFs } from "@/lib/fs";

const router = { push: () => {} };
const run = (line: string, signal = new AbortController().signal) =>
  execute(line, { router, signal });
const lines = () =>
  getSession().entries.flatMap(({ line }) =>
    line.kind === "table"
      ? line.rows.map((r) => r.join("  "))
      : "text" in line
        ? [line.text]
        : [],
  );

beforeEach(() => {
  session.clear();
  session.setCwd("~");
});

describe("every command (Done when)", () => {
  it.each(commands.map((c) => [c.name, c]))(
    "%s has a description, usage, examples and a category",
    (_name, command) => {
      expect(command.description.length).toBeGreaterThan(0);
      expect(command.usage.startsWith(command.name)).toBe(true);
      expect(command.examples?.length ?? 0).toBeGreaterThan(0);
      expect(Object.keys(terminalCopy.commands.categories)).toContain(
        command.category,
      );
    },
  );

  it("help lists them all, grouped", async () => {
    await run("help");
    const out = lines();
    for (const c of commands)
      expect(out.some((l) => l.startsWith(`${c.name}  `))).toBe(true);
    for (const label of Object.values(terminalCopy.commands.categories))
      expect(out).toContain(label);
  });
});

describe("help <command>, man", () => {
  it("shows usage, aliases and examples", async () => {
    await run("help help");
    const out = lines();
    expect(out[0]).toMatch(/^help — /);
    expect(out).toContain("Usage: help [command]");
    expect(out).toContain("Also: man");
    expect(out).toContain("  $ help ls");
  });
  it("man is the same command", async () => {
    await run("man grep");
    expect(lines()[0]).toMatch(/^grep — /);
  });
  it("suggests for a typo", async () => {
    await run("help gerp");
    expect(lines()[0]).toMatch(/did you mean grep\?/);
  });
  it("completes command names", () => {
    expect(
      complete("help neo", 8, { store: useStore, fs: getFs(), cwd: "~" }),
    ).toEqual({ kind: "replace", input: "help neofetch ", caret: 14 });
  });
});

describe("the classics", () => {
  it("whoami", async () => {
    await run("whoami");
    expect(lines()[0]).toBe("visitor");
    expect(lines()[1]).toContain(profile.name);
  });
  it("neofetch has the monogram beside the facts", async () => {
    await run("neofetch");
    const out = lines();
    expect(out[0]).toMatch(/^ _ {3}_ _ {2}__ {2}nasheet@portfolio$/);
    expect(out.some((l) => l.includes(`Name: ${profile.name}`))).toBe(true);
    expect(out.some((l) => /Uptime: \d/.test(l))).toBe(true);
  });
  it("date shows both times", async () => {
    await run("date");
    expect(lines()).toHaveLength(2);
    expect(lines()[1]).toContain(profile.location.city);
  });
  it("clear empties the screen", async () => {
    await run("echo hi");
    await run("clear");
    expect(lines()).toEqual([]);
  });
  it("exit closes the terminal", async () => {
    useStore.getState().ui.setTerminalOpen(true);
    await run("exit");
    expect(useStore.getState().ui.terminalOpen).toBe(false);
  });
  it("skills is a table per area", async () => {
    await run("skills");
    expect(getSession().entries.some((e) => e.line.kind === "table")).toBe(
      true,
    );
  });
});

describe("sudo", () => {
  it("refuses anything but hire-me, differently each time", async () => {
    await run("sudo rm -rf /");
    await run("sudo make me a sandwich");
    const errors = getSession().entries.filter((e) => e.line.kind === "error");
    expect(errors).toHaveLength(2);
    expect(lines()[0]).not.toBe(lines()[1]);
  });
  it("hire-me can be cancelled mid-way, leaving one settled progress line", async () => {
    const controller = new AbortController();
    const done = run("sudo hire-me", controller.signal).catch(() => "aborted");
    await new Promise((r) => setTimeout(r, 500));
    controller.abort();
    expect(await done).toBe("aborted");
    session.end();
    const entries = getSession().entries;
    expect(entries).toHaveLength(1);
    expect(entries[0]!.live).toBeUndefined();
    expect(lines()[0]).toMatch(/^\[#+-*\] \d+% /);
    expect(useStore.getState().ui.contactSheetOpen).toBe(false);
  });
});
