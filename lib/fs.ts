/*
 * The terminal's virtual filesystem (6.3): a home directory generated from content/, never
 * hand-written (CLAUDE.md §9.4). Built lazily on first use (getFs()), in the terminal's chunk.
 *
 *   ~/about.md            profile: name, title, city, availability, bio, off screen
 *   ~/projects/<slug>.md  content/projects.ts, one file each
 *   ~/skills.txt          content/skills.ts
 *   ~/resume.pdf          profile.resume (opens in a new tab)
 *   ~/music/<id>.mp3      content/music.ts (open plays it)
 *   ~/contact.txt         email, socials, city
 *   ~/.secrets            hidden: the secrets found so far; reading it is a secret itself
 *
 * Paths: "~" is home and also the root ("/" means "~"); "." and ".." work and ".." stops at "~".
 * Paths are kept in the "~/a/b" form.
 */
import { chapters } from "@/content/chapters";
import { copy } from "@/content/copy";
import { terminalCopy } from "@/content/terminal";
import { tracks } from "@/content/music";
import { profile } from "@/content/profile";
import { projects, type Project } from "@/content/projects";
import { learning, skillAreas, tools } from "@/content/skills";
import { socials } from "@/content/socials";
import { island } from "@/lib/island";
import { findSecret, foundSecrets, type SecretId } from "@/lib/secrets";

export const HOME = "~";

/** What `open` does with a node. */
export type Opener =
  | { kind: "route"; href: string }
  | { kind: "url"; href: string }
  | { kind: "track"; index: number };

export type FsFile = {
  kind: "file";
  name: string;
  format: "md" | "txt" | "pdf" | "mp3";
  /** Text files: generated on each read (the secrets file changes as secrets are found). */
  text?: () => string;
  open?: Opener;
  hidden?: boolean;
  /** Shown by `ls -l` (a track's title and artist, a project's title). */
  note?: string;
  /** Called when `cat` prints it (the dotfile secret). */
  onRead?: () => void;
};

export type FsDir = {
  kind: "dir";
  name: string;
  children: FsNode[];
  open?: Opener;
  hidden?: boolean;
};

export type FsNode = FsFile | FsDir;

const f = terminalCopy.fs;
const route = (id: string) => chapters.find((c) => c.id === id)?.route ?? "/";

// --- Generated files ------------------------------------------------------------------------

function aboutMd(): string {
  return [
    `# ${profile.name}`,
    `${profile.title} · ${profile.location.city} · ${profile.availability.label}`,
    "",
    ...profile.bio.flatMap((p) => [p, ""]),
    `## ${copy.about.offScreen}`,
    profile.offScreen,
    "",
    `[${f.readMore}](${route("about")})`,
  ].join("\n");
}

function projectMd(p: Project): string {
  const links = [
    p.hasCaseStudy ? `- [${f.caseStudy}](${route("work")}/${p.slug})` : null,
    p.links.live ? `- [${f.live}](${p.links.live})` : null,
    p.links.repo ? `- [${f.repo}](${p.links.repo})` : null,
  ].filter((l): l is string => l !== null);
  return [
    `# ${p.title}`,
    [p.role, String(p.year), p.domain, p.team].filter(Boolean).join(" · "),
    "",
    p.summary,
    "",
    `## ${f.stack}`,
    ...p.stack.map((s) => `- ${s}`),
    ...(links.length ? ["", `## ${f.links}`, ...links] : []),
  ].join("\n");
}

function skillsTxt(): string {
  const lines: string[] = [];
  for (const area of skillAreas) {
    lines.push(`${area.name} — ${area.summary}`);
    const width = Math.max(...area.skills.map((s) => s.name.length));
    for (const s of area.skills) {
      // No level: empty dots, never a made-up rating (as on the Skills page).
      const dots = "●".repeat(s.level ?? 0) + "○".repeat(5 - (s.level ?? 0));
      const years = s.years ? `  ${s.years} yrs` : "";
      lines.push(`  ${s.name.padEnd(width)}  ${dots}${years}`);
    }
    lines.push("");
  }
  lines.push(`${f.learning}`);
  for (const l of learning)
    lines.push(
      `  ${l.name}${l.progress !== undefined ? `  ${l.progress}%` : ""}`,
    );
  lines.push("", `${f.tools}: ${tools.join(", ")}`);
  return lines.join("\n");
}

function contactTxt(): string {
  const rows: [string, string][] = [
    [f.email, profile.email],
    ...socials.map((s): [string, string] => [f.platforms[s.platform], s.url]),
    [f.resume, profile.resume],
    [f.based, `${profile.location.city} (${profile.location.zoneLabel})`],
  ];
  const width = Math.max(...rows.map(([label]) => label.length));
  return rows
    .map(([label, value]) => `${label.padEnd(width)}  ${value}`)
    .join("\n");
}

const KNOWN_SECRETS: SecretId[] = ["plant", "dotfile"];

function secretsMd(): string {
  const s = f.secrets;
  const found = foundSecrets();
  const total = copy.home.secrets.total;
  const lines = [s.header(found.length, total), ""];
  for (const id of KNOWN_SECRETS)
    lines.push(
      found.includes(id)
        ? `- ${s.found} ${copy.home.secrets[id]}`
        : `- ${s.missing} ${s.hints[id]}`,
    );
  for (let i = KNOWN_SECRETS.length; i < total; i++)
    lines.push(`- ${s.missing} ${s.unknown}`);
  lines.push("", `> ${s.footer}`);
  return lines.join("\n");
}

function readSecrets() {
  const found = findSecret("dotfile");
  if (found === null) return;
  island.alert({
    icon: "star",
    tone: "amber",
    text: copy.home.secrets.dotfile,
    detail: copy.home.secrets.count(found, copy.home.secrets.total),
  });
}

function build(): FsDir {
  const file = (name: string, rest: Omit<FsFile, "kind" | "name">): FsFile => ({
    kind: "file",
    name,
    ...rest,
  });
  return {
    kind: "dir",
    name: HOME,
    open: { kind: "route", href: "/" },
    children: [
      file("about.md", {
        format: "md",
        text: aboutMd,
        open: { kind: "route", href: route("about") },
      }),
      {
        kind: "dir",
        name: "projects",
        open: { kind: "route", href: route("work") },
        children: projects.map((p) =>
          file(`${p.slug}.md`, {
            format: "md",
            text: () => projectMd(p),
            note: p.title,
            open: p.hasCaseStudy
              ? { kind: "route", href: `${route("work")}/${p.slug}` }
              : p.links.live
                ? { kind: "url", href: p.links.live }
                : p.links.repo
                  ? { kind: "url", href: p.links.repo }
                  : undefined,
          }),
        ),
      },
      file("skills.txt", {
        format: "txt",
        text: skillsTxt,
        open: { kind: "route", href: route("skills") },
      }),
      file("resume.pdf", {
        format: "pdf",
        open: { kind: "url", href: profile.resume },
      }),
      {
        kind: "dir",
        name: "music",
        children: tracks.map((t, index) =>
          file(`${t.id}.mp3`, {
            format: "mp3",
            note: `${t.title} — ${t.artist}`,
            open: { kind: "track", index },
          }),
        ),
      },
      file("contact.txt", {
        format: "txt",
        text: contactTxt,
        open: { kind: "route", href: route("contact") },
      }),
      file(".secrets", {
        format: "md",
        text: secretsMd,
        hidden: true,
        onRead: readSecrets,
      }),
    ],
  };
}

// --- Paths ------------------------------------------------------------------------------------

/** Resolve `input` against `cwd` to the "~/a/b" form. Never goes above "~". */
export function resolvePath(cwd: string, input: string): string {
  const raw = input.trim();
  const fromHome = raw === "~" || raw.startsWith("~/") || raw.startsWith("/");
  const parts = fromHome || cwd === HOME ? [] : cwd.slice(2).split("/");
  const rest = fromHome ? raw.replace(/^~\/?|^\/+/, "") : raw;
  for (const segment of rest.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") parts.pop();
    else parts.push(segment);
  }
  return parts.length ? `${HOME}/${parts.join("/")}` : HOME;
}

export type VirtualFs = {
  root: FsDir;
  resolve: (cwd: string, input: string) => string;
  get: (path: string) => FsNode | null;
  /** A directory's entries, hidden ones only with `all`. */
  list: (dir: FsDir, all?: boolean) => FsNode[];
  read: (file: FsFile) => string | null;
  /** Tab: every path the word could become, as typed (directories end in "/"). */
  completePath: (
    word: string,
    cwd: string,
    options?: { dirsOnly?: boolean },
  ) => string[];
};

function createFs(): VirtualFs {
  const root = build();

  const get = (path: string): FsNode | null => {
    if (path === HOME) return root;
    let node: FsNode = root;
    for (const name of path.slice(2).split("/")) {
      if (node.kind !== "dir") return null;
      const next: FsNode | undefined = node.children.find(
        (c) => c.name === name,
      );
      if (!next) return null;
      node = next;
    }
    return node;
  };

  const list = (dir: FsDir, all = false) =>
    dir.children.filter((c) => all || !c.hidden);

  return {
    root,
    resolve: resolvePath,
    get,
    list,
    read: (file) => file.text?.() ?? null,
    completePath(word, cwd, options) {
      if (word === "~") return ["~/"];
      const slash = word.lastIndexOf("/");
      const dirPart = slash >= 0 ? word.slice(0, slash + 1) : "";
      const base = word.slice(slash + 1);
      const dir = get(dirPart ? resolvePath(cwd, dirPart) : cwd);
      if (!dir || dir.kind !== "dir") return [];
      const special = [".", ".."]
        .filter((d) => d.startsWith(base) && base.startsWith("."))
        .map((d) => `${dirPart}${d}/`);
      return [
        ...special,
        ...list(dir, base.startsWith("."))
          .filter((c) => c.name.startsWith(base))
          .filter((c) => !options?.dirsOnly || c.kind === "dir")
          .map((c) => dirPart + c.name + (c.kind === "dir" ? "/" : "")),
      ];
    },
  };
}

let fs: VirtualFs | null = null;

/** The filesystem, built on first use. */
export function getFs(): VirtualFs {
  fs ??= createFs();
  return fs;
}
