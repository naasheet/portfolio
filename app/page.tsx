import { ChapterSection } from "@/components/chapters/ChapterSection";
import { chapterNumber, chapters } from "@/content/chapters";

// TODO(4.x): fake test chapters for the 2.4 nav and the 3.3 scroll morph (each
// ChapterSection's ScrollTrigger writes scroll.chapter; the island and the canvas follow it).
// Chapters 4.2–4.7 replace these sections; keep `id` and `data-chapter` on the real ones.
// TODO(content): move the placeholder line into content/copy.ts (chunk 4.1).
export default function Home() {
  return (
    <>
      {chapters.map((c, i) => (
        <ChapterSection
          key={c.id}
          id={c.id}
          index={i}
          className="flex min-h-dvh flex-col justify-center gap-2 border-b border-border-default px-6 md:px-12"
        >
          <span className="text-footnote font-mono text-text-tertiary">
            {chapterNumber(i)}
          </span>
          <h2 className="text-large-title font-bold">{c.name}</h2>
          {i === 0 ? (
            <p className="text-body text-text-secondary">
              Nasheet&apos;s portfolio is under construction.
            </p>
          ) : null}
        </ChapterSection>
      ))}
    </>
  );
}
