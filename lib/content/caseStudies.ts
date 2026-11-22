/*
 * Case-study data (4.5), server only (it reads content/case-studies at build time). The MDX file
 * holds only the body; everything else (title, role, year, stack, links) comes from
 * content/projects.ts. The table of contents is read from the body's <Section title="…"> tags,
 * so it never has to be written by hand. Section ids use the same slugify as the Section component.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { projects, type Project } from "@/content/projects";
import { slugify } from "@/lib/content/slug";

export type TocEntry = { id: string; title: string };

export function getCaseStudies(): Project[] {
  return projects.filter((p) => p.hasCaseStudy);
}

export function getCaseStudy(slug: string): Project | undefined {
  return getCaseStudies().find((p) => p.slug === slug);
}

const SECTION = /<Section\s+[^>]*?title=(?:"([^"]+)"|'([^']+)'|\{"([^"]+)"\})/g;

/** The sections of a case study, in order. */
export function getToc(slug: string): TocEntry[] {
  const source = readFileSync(
    join(process.cwd(), "content", "case-studies", `${slug}.mdx`),
    "utf8",
  )
    // MDX comments ({/* … */}) may mention <Section> without being one.
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
  return [...source.matchAll(SECTION)].map((m) => {
    const title = m[1] ?? m[2] ?? m[3] ?? "";
    return { id: slugify(title), title };
  });
}

/** The case studies before and after this one, in content/projects.ts order. */
export function getNeighbours(slug: string): {
  prev?: Project;
  next?: Project;
} {
  const list = getCaseStudies();
  const i = list.findIndex((p) => p.slug === slug);
  return {
    prev: i > 0 ? list[i - 1] : undefined,
    next: i >= 0 ? list[i + 1] : undefined,
  };
}
