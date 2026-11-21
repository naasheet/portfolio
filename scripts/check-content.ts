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
import { existsSync } from "node:fs";
import { join } from "node:path";
import { profile as profileData, type Profile } from "../content/profile.ts";
import { projects } from "../content/projects.ts";
import { skillAreas } from "../content/skills.ts";
import { socials } from "../content/socials.ts";

const root = join(import.meta.dirname, "..");
// Checked through the declared types, not the literal ones the data narrows to.
const profile: Profile = profileData;
const errors: string[] = [];
const warnings: string[] = [];

const fail = (where: string, message: string) => errors.push(`${where}: ${message}`);
const filled = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const placeholder = (value: string) => /^\[.*\]$/.test(value.trim());

/** A site path ("/projects/a.jpg") that must exist under public/. */
function inPublic(where: string, path: string | null | undefined) {
  if (path === null || path === undefined) return;
  if (!path.startsWith("/")) {
    fail(where, `"${path}" must be a path from the site root, starting with "/"`);
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
    if (!schemes.includes(parsed.protocol)) fail(where, `"${value}" must use ${schemes.join(" or ")}`);
  } catch {
    fail(where, `"${value}" is not a valid URL`);
  }
}

// --- Profile -----------------------------------------------------------------------------

{
  const at = (field: string) => `content/profile.ts › ${field}`;
  for (const field of ["name", "title", "degree", "tagline", "offScreen", "email"] as const) {
    if (!filled(profile[field])) fail(at(field), "is required");
  }
  if (!filled(profile.location.city)) fail(at("location.city"), "is required");
  if (!filled(profile.availability.label)) fail(at("availability.label"), "is required");
  if (profile.bio.length === 0 || !profile.bio.every(filled)) {
    fail(at("bio"), "needs at least one non-empty paragraph");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.email)) {
    fail(at("email"), `"${profile.email}" doesn't look like an email address`);
  }
  inPublic(at("resume"), profile.resume);
  profile.photos.forEach((photo, i) => {
    inPublic(at(`photos[${i}].src`), photo.src);
    if (!filled(photo.alt)) fail(at(`photos[${i}].alt`), "is required (describe the photo)");
  });
  for (const field of ["tagline", "offScreen"] as const) {
    if (placeholder(profile[field])) warnings.push(`content/profile.ts › ${field} is a placeholder`);
  }
  if (profile.bio.some(placeholder)) warnings.push("content/profile.ts › bio is a placeholder");
  if (profile.photos.length === 0) warnings.push("content/profile.ts › no photos yet");
  if (profile.interests.some(placeholder)) warnings.push("content/profile.ts › interests are placeholders");
}

// --- Projects ----------------------------------------------------------------------------

{
  const seen = new Map<string, number>();
  const thisYear = new Date().getFullYear();
  projects.forEach((p, i) => {
    const at = (field: string) => `content/projects.ts › ${p.slug || `projects[${i}]`} › ${field}`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) {
      fail(at("slug"), `"${p.slug}" must be lowercase letters, digits and single hyphens`);
    }
    const first = seen.get(p.slug);
    if (first !== undefined) {
      fail(at("slug"), `duplicate slug "${p.slug}" (also projects[${first}])`);
    } else {
      seen.set(p.slug, i);
    }
    for (const field of ["title", "role", "summary", "domain", "cover"] as const) {
      if (!filled(p[field])) fail(at(field), "is required");
    }
    if (!Number.isInteger(p.year) || p.year < 1990 || p.year > thisYear + 1) {
      fail(at("year"), `${p.year} is not a plausible year`);
    }
    if (p.stack.length === 0 || !p.stack.every(filled)) fail(at("stack"), "needs at least one technology");
    url(at("links.live"), p.links.live);
    url(at("links.repo"), p.links.repo);
    inPublic(at("cover"), p.cover);
    inPublic(at("preview"), p.preview);
    if (p.hasCaseStudy && !existsSync(join(root, "content", "case-studies", `${p.slug}.mdx`))) {
      fail(at("hasCaseStudy"), `is true but content/case-studies/${p.slug}.mdx doesn't exist`);
    }
    if (p.placeholder) warnings.push(`content/projects.ts › ${p.slug} is a placeholder project`);
  });
  if (projects.length === 0) warnings.push("content/projects.ts › no projects yet");
}

// --- Skills and socials ------------------------------------------------------------------

skillAreas.forEach((area, i) => {
  const at = `content/skills.ts › ${area.name || `skillAreas[${i}]`}`;
  if (!filled(area.name)) fail(at, "name is required");
  if (area.skills.length === 0 || !area.skills.every(filled)) fail(at, "needs at least one skill");
  if (placeholder(area.name)) warnings.push(`${at} is a placeholder`);
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
  if (socials.length === 0) warnings.push("content/socials.ts › no socials yet");
}

// --- Report ------------------------------------------------------------------------------

if (warnings.length) {
  console.log(`check-content: ${warnings.length} placeholder(s), TODO(content):`);
  for (const w of warnings) console.log(`  ! ${w}`);
}
if (errors.length) {
  console.error(`\ncheck-content: ${errors.length} problem(s) in content/, build stopped:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log("check-content: content OK");
