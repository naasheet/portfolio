/*
 * Work's filters (4.4), always derived from content/projects.ts (CLAUDE.md §5.6): "All", then
 * every domain in first-seen order, then the six most used stack items. A filter lives in the
 * URL as ?domain=<slug> or ?stack=<slug>; one at a time.
 */
import { projects, type Project } from "@/content/projects";
import { slugify } from "@/lib/content/slug";

export type FilterKind = "domain" | "stack";
export type Filter = { kind: FilterKind; slug: string; label: string };

export { slugify };

/** How many stack items get a chip. */
export const TOP_STACK = 6;

export function getFilters(list: readonly Project[] = projects): {
  domains: Filter[];
  stack: Filter[];
} {
  const domains = new Map<string, Filter>();
  for (const p of list) {
    const slug = slugify(p.domain);
    if (slug && !domains.has(slug))
      domains.set(slug, { kind: "domain", slug, label: p.domain });
  }

  // Count each stack item; ties keep first-seen order (Map preserves insertion).
  const counts = new Map<string, { label: string; n: number }>();
  for (const p of list) {
    for (const s of p.stack) {
      const slug = slugify(s);
      if (!slug) continue;
      const hit = counts.get(slug);
      if (hit) hit.n += 1;
      else counts.set(slug, { label: s, n: 1 });
    }
  }
  const stack = [...counts.entries()]
    .map(([slug, { label, n }], i) => ({ slug, label, n, i }))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .slice(0, TOP_STACK)
    .map(({ slug, label }) => ({ kind: "stack" as const, slug, label }));

  return { domains: [...domains.values()], stack };
}

/** The active filter from the URL's search params (null = All). Unknown values still filter. */
export function filterFromParams(params: {
  get(name: string): string | null;
}): {
  kind: FilterKind;
  slug: string;
} | null {
  const domain = params.get("domain");
  if (domain) return { kind: "domain", slug: slugify(domain) };
  const stack = params.get("stack");
  if (stack) return { kind: "stack", slug: slugify(stack) };
  return null;
}

/** The query string for a filter: "?stack=react", or "" for All. */
export function filterQuery(
  filter: { kind: FilterKind; slug: string } | null,
): string {
  return filter ? `?${filter.kind}=${filter.slug}` : "";
}

export function matchesFilter(
  p: Project,
  filter: { kind: FilterKind; slug: string } | null,
): boolean {
  if (!filter) return true;
  if (filter.kind === "domain") return slugify(p.domain) === filter.slug;
  return p.stack.some((s) => slugify(s) === filter.slug);
}
