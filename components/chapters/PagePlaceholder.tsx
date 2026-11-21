import { chapterNumber, chapters, type PageId } from "@/content/chapters";

/**
 * A page's stand-in until Phase 4 builds it (R.1): its number, name and subtitle from
 * content/chapters.ts.
 */
export function PagePlaceholder({ id }: { id: PageId }) {
  const index = chapters.findIndex((c) => c.id === id);
  const page = chapters[index];
  if (!page) return null;
  return (
    <section className="flex min-h-dvh flex-col justify-center gap-2 px-6 md:px-12">
      <span className="text-footnote font-mono text-text-tertiary">
        {chapterNumber(index)}
      </span>
      <h1 className="text-large-title font-bold">{page.name}</h1>
      <p className="text-body text-text-secondary">{page.subtitle}</p>
    </section>
  );
}
