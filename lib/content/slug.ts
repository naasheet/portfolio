/** URL- and id-safe slug: "Next.js" → "next-js", "AI / ML" → "ai-ml", "The problem" → "the-problem". */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
