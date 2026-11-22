/*
 * Content check (4.1), run before every build (`prebuild`) and by `npm run check-content`.
 * Fails the build with a clear message when the content is broken: a duplicate slug, a missing
 * required field, a file referenced but not in public/, or a case study missing for a project
 * that says it has one. Placeholders (TODO(content)) are listed as warnings, not failures.
 *
 * Runs on Node's built-in TypeScript support (Node 22.18+ / 24), with no extra package, so it
 * imports the content files by their .ts path. Content data files must therefore import nothing
 * but types (or other content files by a relative ".ts" path).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { profile as profileData, type Profile } from "../content/profile.ts";
import { projects } from "../content/projects.ts";
import { tracks } from "../content/music.ts";
import { learning, skillAreas, tools, usedIn } from "../content/skills.ts";
import { socials } from "../content/socials.ts";

const root = join(import.meta.dirname, "..");
// Checked through the declared types, not the literal ones the data narrows to.
const profile: Profile = profileData;
const errors: string[] = [];
const warnings: string[] = [];

const fail = (where: string, message: string) =>
  errors.push(`${where}: ${message}`);
const filled = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0;
const placeholder = (value: string) => /^\[.*\]$/.test(value.trim());

/** A site path ("/projects/a.jpg") that must exist under public/. */
function inPublic(where: string, path: string | null | undefined) {
  if (path === null || path === undefined) return;
  if (!path.startsWith("/")) {
    fail(
      where,
      `"${path}" must be a path from the site root, starting with "/"`,
    );
    return;
  }
  if (!existsSync(join(root, "public", path))) {
    fail(where, `"${path}" is not in public/ (expected public${path})`);
  }
}

function url(where: string, value: string | undefined, schemes = ["https:"]) {
  if (value === undefined) return;
  try {
    const parsed = new URL(value);
    if (!schemes.includes(parsed.protocol))
      fail(where, `"${value}" must use ${schemes.join(" or ")}`);
  } catch {
    fail(where, `"${value}" is not a valid URL`);
  }
}

// --- Profile -----------------------------------------------------------------------------

{
  const at = (field: string) => `content/profile.ts › ${field}`;
  for (const field of [
    "name",
    "title",
    "degree",
    "tagline",
    "offScreen",
    "email",
  ] as const) {
    if (!filled(profile[field])) fail(at(field), "is required");
  }
  if (!filled(profile.location.city)) fail(at("location.city"), "is required");
  if (!filled(profile.availability.label))
    fail(at("availability.label"), "is required");
  if (profile.bio.length === 0 || !profile.bio.every(filled)) {
    fail(at("bio"), "needs at least one non-empty paragraph");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.email)) {
    fail(at("email"), `"${profile.email}" doesn't look like an email address`);
  }
  inPublic(at("resume"), profile.resume);
  profile.photos.forEach((photo, i) => {
    inPublic(at(`photos[${i}].src`), photo.src);
    if (!filled(photo.alt))
      fail(at(`photos[${i}].alt`), "is required (describe the photo)");
  });
  for (const field of ["tagline", "offScreen"] as const) {
    if (placeholder(profile[field]))
      warnings.push(`content/profile.ts › ${field} is a placeholder`);
  }
  if (profile.bio.some(placeholder))
    warnings.push("content/profile.ts › bio is a placeholder");
  if (profile.photos.length === 0)
    warnings.push("content/profile.ts › no photos yet");
  if (profile.interests.some(placeholder))
    warnings.push("content/profile.ts › interests are placeholders");
}

// --- Projects ----------------------------------------------------------------------------

{
  const seen = new Map<string, number>();
  const thisYear = new Date().getFullYear();
  projects.forEach((p, i) => {
    const at = (field: string) =>
      `content/projects.ts › ${p.slug || `projects[${i}]`} › ${field}`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) {
      fail(
        at("slug"),
        `"${p.slug}" must be lowercase letters, digits and single hyphens`,
      );
    }
    const first = seen.get(p.slug);
    if (first !== undefined) {
      fail(at("slug"), `duplicate slug "${p.slug}" (also projects[${first}])`);
    } else {
      seen.set(p.slug, i);
    }
    for (const field of [
      "title",
      "role",
      "summary",
      "domain",
      "cover",
    ] as const) {
      if (!filled(p[field])) fail(at(field), "is required");
    }
    if (!Number.isInteger(p.year) || p.year < 1990 || p.year > thisYear + 1) {
      fail(at("year"), `${p.year} is not a plausible year`);
    }
    if (p.stack.length === 0 || !p.stack.every(filled))
      fail(at("stack"), "needs at least one technology");
    url(at("links.live"), p.links.live);
    url(at("links.repo"), p.links.repo);
    inPublic(at("cover"), p.cover);
    inPublic(at("preview"), p.preview);
    const mdx = join(root, "content", "case-studies", `${p.slug}.mdx`);
    if (p.hasCaseStudy && !existsSync(mdx)) {
      fail(
        at("hasCaseStudy"),
        `is true but content/case-studies/${p.slug}.mdx doesn't exist`,
      );
    } else if (
      p.hasCaseStudy &&
      !/<Section\s+[^>]*title=/.test(
        readFileSync(mdx, "utf8").replace(/\{\/\*[\s\S]*?\*\/\}/g, ""),
      )
    ) {
      // The contents and headings come from <Section title="…"> (4.5).
      fail(
        at("hasCaseStudy"),
        `content/case-studies/${p.slug}.mdx has no <Section title="…">`,
      );
    }
    if (p.team !== undefined && !filled(p.team))
      fail(at("team"), "is set but empty");
    if (p.team !== undefined && placeholder(p.team))
      warnings.push(`content/projects.ts › ${p.slug} › team is a placeholder`);
    if (p.placeholder)
      warnings.push(`content/projects.ts › ${p.slug} is a placeholder project`);
  });
  if (projects.length === 0)
    warnings.push("content/projects.ts › no projects yet");
}

// --- Music (5.1, 5.3) ------------------------------------------------------------------------
// Every track needs a licence (5.3: the queue never shows "not set"). "local" marks a file that
// may only play on Nasheet's machine: a warning locally, a FAILURE on CI / Vercel (CLAUDE.md
// §9.3), so unlicensed music can't be deployed. public/audio/ is gitignored for the same reason.
{
  const deploying = Boolean(process.env.CI || process.env.VERCEL);
  const ids = new Set<string>();
  tracks.forEach((t, i) => {
    const at = `content/music.ts › ${t.id || `tracks[${i}]`}`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.id))
      fail(at, `id "${t.id}" must be lowercase and URL-safe`);
    if (ids.has(t.id)) fail(at, `duplicate id "${t.id}"`);
    ids.add(t.id);
    for (const field of ["title", "artist"] as const)
      if (!filled(t[field])) fail(at, `${field} is required`);
    inPublic(`${at} › src`, t.src);
    inPublic(`${at} › cover`, t.cover);
    if (!(
      typeof t.duration === "number" &&
      t.duration > 0 &&
      t.duration < 3600
    ))
      fail(
        `${at} › duration`,
        "whole seconds, measured with ffprobe, is required",
      );
    if (t.license === undefined || t.license === null) {
      fail(`${at} › license`, 'is required: { source, url }, or "local"');
    } else if (t.license === "local") {
      if (deploying)
        fail(
          at,
          "has no licence: only tracks you have the rights to stream can be deployed",
        );
      else
        warnings.push(
          `${at} is a local file (no licence; a deploy build fails)`,
        );
    } else {
      if (!filled(t.license.source))
        fail(`${at} › license`, "source is required");
      url(`${at} › license.url`, t.license.url);
    }
  });
}

// --- Skills and socials ------------------------------------------------------------------

skillAreas.forEach((area, i) => {
  const at = `content/skills.ts › ${area.name || `skillAreas[${i}]`}`;
  if (!filled(area.name)) fail(at, "name is required");
  if (!filled(area.summary)) fail(at, "summary is required");
  if (area.skills.length === 0 || !area.skills.every((s) => filled(s.name)))
    fail(at, "needs at least one skill");
  area.skills.forEach((s) => {
    if (
      s.level !== undefined &&
      !(Number.isInteger(s.level) && s.level >= 1 && s.level <= 5)
    ) {
      fail(`${at} › ${s.name}`, `level ${s.level} must be 1–5`);
    }
    if (s.years !== undefined && !(s.years > 0 && s.years < 60))
      fail(`${at} › ${s.name}`, `years ${s.years} is not plausible`);
  });
  if (placeholder(area.name)) warnings.push(`${at} is a placeholder`);
  const unrated = area.skills.filter((s) => s.level === undefined).length;
  if (unrated)
    warnings.push(`${at} › ${unrated} skill(s) have no level yet (empty dots)`);
});
learning.forEach((l, i) => {
  const at = `content/skills.ts › learning › ${l.name || i}`;
  if (!filled(l.name)) fail(at, "name is required");
  if (l.progress !== undefined && !(l.progress >= 0 && l.progress <= 100))
    fail(at, `progress ${l.progress} must be 0–100`);
  if (placeholder(l.name)) warnings.push(`${at} is a placeholder`);
});
if (!tools.every(filled))
  fail("content/skills.ts › tools", "every tool needs a name");
if (tools.some(placeholder))
  warnings.push("content/skills.ts › tools are placeholders");
usedIn.forEach((u, i) => {
  const at = `content/skills.ts › usedIn › ${u.title || i}`;
  if (!filled(u.title)) fail(at, "title is required");
  u.items.forEach((item) => {
    if (!filled(item.label)) fail(at, "every item needs a label");
    if (
      item.project !== undefined &&
      !projects.some((p) => p.slug === item.project)
    ) {
      fail(at, `project "${item.project}" isn't a slug in content/projects.ts`);
    }
  });
  if (placeholder(u.title)) warnings.push(`${at} is a placeholder`);
});

{
  const seen = new Set<string>();
  socials.forEach((s, i) => {
    const at = `content/socials.ts › ${s.platform || `socials[${i}]`}`;
    if (seen.has(s.platform)) fail(at, `duplicate platform "${s.platform}"`);
    seen.add(s.platform);
    if (!filled(s.handle)) fail(at, "handle is required");
    url(at, s.url, s.platform === "email" ? ["mailto:"] : ["https:"]);
  });
  if (socials.length === 0)
    warnings.push("content/socials.ts › no socials yet");
}

// --- Report ------------------------------------------------------------------------------

if (warnings.length) {
  console.log(
    `check-content: ${warnings.length} placeholder(s), TODO(content):`,
  );
  for (const w of warnings) console.log(`  ! ${w}`);
}
if (errors.length) {
  console.error(
    `\ncheck-content: ${errors.length} problem(s) in content/, build stopped:`,
  );
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log("check-content: content OK");
