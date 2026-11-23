import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/content/copy";
import { projects as allProjects } from "@/content/projects";
import { terminalCopy } from "@/content/terminal";
import { useStore } from "@/lib/store";
import { getSession, session } from "@/lib/terminal/session";
import { execute } from "../exec";
import { findTrack } from "../helpers";

const router = { push: vi.fn() };
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
const errors = () =>
  getSession()
    .entries.filter((e) => e.line.kind === "error")
    .map((e) => ("text" in e.line ? e.line.text : ""));

/** Wait until the command asks something, then answer it. */
async function answer(value: string) {
  for (let i = 0; i < 50 && !getSession().asking; i++)
    await new Promise((r) => setTimeout(r, 0));
  expect(getSession().asking).not.toBeNull();
  session.answer(value);
}

beforeEach(() => {
  session.clear();
  session.setCwd("~");
  vi.stubGlobal("window", {
    location: { pathname: "/about" },
    matchMedia: () => ({ matches: false }),
    scrollTo: vi.fn(),
  });
  useStore.getState().particles.setShape(null);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("projects", () => {
  it("lists every project with the count", async () => {
    await run("projects");
    for (const p of allProjects)
      expect(lines().some((l) => l.startsWith(p.slug))).toBe(true);
    expect(lines().at(-1)).toBe(
      terminalCopy.commands.projects.count(
        allProjects.length,
        allProjects.length,
      ),
    );
  });
  it("filters by stack, either flag form, by slug", async () => {
    const tech = allProjects[0]!.stack[0]!;
    await run(`projects --stack ${tech}`);
    await run(`projects --stack="${tech.toUpperCase()}"`);
    expect(errors()).toEqual([]);
  });
  it("says so when nothing matches", async () => {
    await run("projects --stack cobol");
    expect(errors()[0]).toMatch(/No projects match --stack cobol/);
  });
});

describe("goto", () => {
  it("rejects an unknown page and lists the real ones", async () => {
    await run("goto narnia");
    expect(errors()[0]).toMatch(/home, about, work/);
  });
  it("on the same page, closes the terminal and scrolls to the top", async () => {
    useStore.getState().ui.setTerminalOpen(true);
    await run("goto 2");
    expect(useStore.getState().ui.terminalOpen).toBe(false);
    expect(lines()[0]).toBe(terminalCopy.commands.goto.here("About"));
  });
});

describe("particles", () => {
  it("sets a shape for this page through the store", async () => {
    await run("particles laptop");
    const p = useStore.getState().particles;
    expect([p.shape, p.path]).toEqual(["work", "/about"]);
    await run("particles --reset");
    expect(useStore.getState().particles.shape).toBeNull();
  });
  it("--explode counts up", async () => {
    const before = useStore.getState().particles.explodes;
    await run("particles --explode");
    expect(useStore.getState().particles.explodes).toBe(before + 1);
  });
  it("rejects an unknown shape", async () => {
    await run("particles donut");
    expect(errors()[0]).toMatch(/isn't one of: room, sphere/);
  });
});

describe("music and features still to come", () => {
  it("finds tracks by number, id and title prefix", () => {
    expect(findTrack("1")).toBe(0);
    expect(findTrack("gehra")).toBe(1);
    expect(findTrack("World's End")).toBe(0);
    expect(findTrack("nope")).toBe(-1);
  });
  it("vol sets the store before the engine exists, and rejects 101", async () => {
    await run("vol 40");
    expect(useStore.getState().audio.volume).toBeCloseTo(0.4);
    await run("vol 101");
    expect(errors()).toHaveLength(1);
  });
  it("pause / next with no music say how to start it", async () => {
    await run("pause");
    await run("next");
    expect(lines()).toEqual([
      terminalCopy.commands.pause.nothing,
      terminalCopy.commands.noMusic,
    ]);
  });
  it("play slice, ask and ar on say the feature is on its way", async () => {
    await run("play slice");
    await run("ask what are you working on?");
    expect(lines()[0]).toMatch(/Slice game is on its way \(phase 9\)/);
    expect(lines()[1]).toMatch(/chatbot is on its way \(phase 7\)/);
  });
});

describe("contact", () => {
  it("asks, re-asks a bad email, confirms and posts", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const done = run("contact --topic=collab");
    await answer("Riya");
    await answer("riya@studio");
    await answer("riya@studio.dev");
    await answer("Loved the particles.");
    await answer("maybe");
    await answer("y");
    await done;
    expect(errors()).toEqual([copy.contact.sheet.errors.emailUnfinished]);
    expect(lines()).toContain(terminalCopy.commands.contact.yesNo);
    expect(lines().at(-1)).toBe(terminalCopy.commands.contact.sent);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("/api/contact");
    expect(JSON.parse(init.body as string)).toEqual({
      topic: "collab",
      name: "Riya",
      email: "riya@studio.dev",
      message: "Loved the particles.",
      website: "",
    });
  });
  it("n sends nothing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const done = run("contact");
    for (const a of ["A", "a@b.co", "hi", "n"]) await answer(a);
    await done;
    expect(fetchMock).not.toHaveBeenCalled();
    expect(lines().at(-1)).toBe(terminalCopy.commands.contact.cancelled);
  });
  it("Ctrl+C at a prompt cancels", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    const done = run("contact", controller.signal).catch(() => "aborted");
    await answer("Riya");
    for (let i = 0; i < 50 && !getSession().asking; i++)
      await new Promise((r) => setTimeout(r, 0));
    controller.abort();
    expect(await done).toBe("aborted");
    expect(getSession().asking).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("shows the server's rate limit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ ok: false, error: "rateLimited" }, { status: 429 }),
      ),
    );
    const done = run("contact");
    for (const a of ["A", "a@b.co", "hi", "yes"]) await answer(a);
    await done;
    expect(errors()).toEqual([copy.contact.sheet.errors.rateLimited]);
  });
  it("rejects an unknown topic", async () => {
    await run("contact --topic=spam");
    expect(errors()[0]).toMatch(/isn't one of: project, collab, hi/);
  });
});
