import { beforeEach, describe, expect, it } from "vitest";
import { projects } from "@/content/projects";
import { profile } from "@/content/profile";
import { tracks } from "@/content/music";
import { getFs, resolvePath } from "@/lib/fs";
import { useStore } from "@/lib/store";
import { getSession, session } from "@/lib/terminal/session";
import { renderMarkdown } from "@/lib/terminal/markdown";
import { execute } from "../exec";
import { complete } from "../registry";

const router = { push: () => {} };
const run = (line: string) =>
  execute(line, { router, signal: new AbortController().signal });
const texts = () =>
  getSession().entries.flatMap(({ line }) =>
    line.kind === "table"
      ? line.rows.map((r) => r.join("  "))
      : "text" in line
        ? [line.text]
        : [],
  );
const kinds = () => getSession().entries.map(({ line }) => line.kind);
const tab = (input: string, cwd = "~") =>
  complete(input, input.length, { store: useStore, fs: getFs(), cwd });

beforeEach(() => {
  session.clear();
  session.setCwd("~");
});

describe("resolvePath", () => {
  it("handles ., .., ~, / and relative paths", () => {
    expect(resolvePath("~", "projects")).toBe("~/projects");
    expect(resolvePath("~/projects", "..")).toBe("~");
    expect(resolvePath("~/projects", "../music/./")).toBe("~/music");
    expect(resolvePath("~/projects", "~")).toBe("~");
    expect(resolvePath("~/projects", "~/music")).toBe("~/music");
    expect(resolvePath("~/projects", "/music")).toBe("~/music");
    expect(resolvePath("~", "")).toBe("~");
  });
  it("never goes above home", () => {
    expect(resolvePath("~", "../../..")).toBe("~");
    expect(resolvePath("~/projects", "../../music")).toBe("~/music");
  });
});

describe("the tree comes from content/", () => {
  it("has one file per project, track, and the fixed files", () => {
    const fs = getFs();
    const names = (p: string) => {
      const n = fs.get(p);
      return n?.kind === "dir" ? fs.list(n, true).map((c) => c.name) : null;
    };
    expect(names("~")).toEqual([
      "about.md",
      "projects",
      "skills.txt",
      "resume.pdf",
      "music",
      "contact.txt",
      ".secrets",
    ]);
    expect(names("~/projects")).toEqual(projects.map((p) => `${p.slug}.md`));
    expect(names("~/music")).toEqual(tracks.map((t) => `${t.id}.mp3`));
  });
  it("hides the dotfile unless asked", () => {
    const root = getFs().root;
    expect(
      getFs()
        .list(root)
        .some((n) => n.name === ".secrets"),
    ).toBe(false);
  });
});

describe("commands", () => {
  it("cd projects && ls lists the projects", async () => {
    await run("cd projects && ls");
    expect(getSession().cwd).toBe("~/projects");
    expect(texts()).toEqual(projects.map((p) => `${p.slug}.md`));
  });
  it("&& stops after a failure, ; doesn't", async () => {
    await run("cd nowhere && pwd");
    expect(kinds()).toEqual(["error"]);
    session.clear();
    await run("cd nowhere ; pwd");
    expect(texts()[1]).toBe("/home/nasheet");
  });
  it("cat ~/about.md prints the bio", async () => {
    await run("cd projects && cat ~/about.md");
    const out = texts();
    expect(out[0]).toBe(profile.name);
    for (const paragraph of profile.bio) expect(out).toContain(paragraph);
  });
  it("cat a directory or a binary file is an error", async () => {
    await run("cat projects ; cat resume.pdf");
    expect(kinds()).toEqual(["error", "error"]);
  });
  it("ls -a shows the dotfile, . and ..", async () => {
    await run("ls -a");
    expect(texts().slice(0, 2)).toEqual([".", ".."]);
    expect(texts()).toContain(".secrets");
  });
  it("ls -l gives modes, sizes and notes", async () => {
    await run("ls -l music");
    expect(texts()[0]).toMatch(/^-rw-r--r--  –  .+\.mp3  .+ — .+$/);
  });
  it("pwd is absolute", async () => {
    await run("cd projects && pwd");
    expect(texts()).toEqual(["/home/nasheet/projects"]);
  });
  it("tree counts what it drew", async () => {
    await run("tree");
    // about.md, skills.txt, resume.pdf, contact.txt, plus a file per project and per track.
    const files = 4 + projects.length + tracks.length;
    expect(texts().at(-1)).toBe(`2 directories, ${files} files`);
  });
  it("pipes a file into grep", async () => {
    await run("cat contact.txt | grep Email");
    expect(texts()).toEqual([expect.stringContaining(profile.email)]);
  });
});

describe("Tab completes paths at any depth", () => {
  it("completes a directory with a slash and no space", () => {
    expect(tab("cd pro")).toEqual({
      kind: "replace",
      input: "cd projects/",
      caret: 12,
    });
  });
  it("goes on into the directory: lists its files, then completes one", () => {
    // Tab fills in what the names share (bash-style), then the next Tab lists them.
    let inside = tab("cat projects/");
    if (inside.kind === "replace") inside = tab(inside.input.trimEnd());
    expect(inside.kind === "list" && inside.candidates).toEqual(
      projects.map((p) => `projects/${p.slug}.md`),
    );
    const slug = projects[0]!.slug;
    expect(tab(`cat projects/${slug}`)).toEqual({
      kind: "replace",
      input: `cat projects/${slug}.md `,
      caret: `cat projects/${slug}.md `.length,
    });
  });
  it("completes from another directory with ..", () => {
    expect(tab("cat ../ab", "~/projects")).toEqual({
      kind: "replace",
      input: "cat ../about.md ",
      caret: 16,
    });
  });
  it("only offers directories to cd", () => {
    const r = tab("cd ");
    expect(r.kind === "list" && r.candidates).toEqual(["music/", "projects/"]);
  });
  it("offers hidden files once the word starts with a dot", () => {
    expect(tab("cat .se")).toEqual({
      kind: "replace",
      input: "cat .secrets ",
      caret: 13,
    });
  });
});

describe("renderMarkdown", () => {
  it("styles headings, bullets, quotes and link lines", () => {
    expect(
      renderMarkdown(
        "# Title\n- **one** `two`\n> quiet\n[Go](/about)\nsee [x](https://y.z)",
      ),
    ).toEqual([
      { kind: "text", text: "Title", tone: "accent" },
      { kind: "text", text: "  • one two" },
      { kind: "text", text: "│ quiet", tone: "muted" },
      { kind: "link", text: "Go", href: "/about" },
      { kind: "text", text: "see x (https://y.z)" },
    ]);
  });
});
