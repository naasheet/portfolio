import { PinnedSection } from "./PinnedSection";

// TEMPORARY (chunk 0.4): scroll test page with hardcoded strings. Delete in chunk 0.6.

const sections = ["one", "two", "three", "four", "five"];
const pinnedId = "three";

export default function MotionTestPage() {
  return (
    <main>
      <nav className="fixed inset-x-0 top-0 z-overlay flex justify-center gap-2 p-4">
        {sections.map((id) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-chip border border-border-default bg-glass-fill px-4 py-2 text-subhead backdrop-blur-glass hover:border-border-focus focus-visible:outline-2 focus-visible:outline-border-focus"
          >
            {id}
          </a>
        ))}
        <a
          href="#top"
          className="rounded-chip border border-border-default bg-glass-fill px-4 py-2 text-subhead backdrop-blur-glass hover:border-border-focus focus-visible:outline-2 focus-visible:outline-border-focus"
        >
          top
        </a>
      </nav>

      <div id="top" />
      {sections.map((id, i) =>
        id === pinnedId ? (
          <PinnedSection key={id} id={id} />
        ) : (
          <section
            key={id}
            id={id}
            className="flex min-h-[150vh] flex-col items-center justify-center gap-4 px-6"
          >
            <p className="text-footnote text-text-tertiary">
              Section {i + 1} of 5
            </p>
            <h2 className="text-large-title capitalize">{id}</h2>
            <p className="text-callout text-text-secondary">
              Scroll with a trackpad, a mouse wheel and the anchor links.
            </p>
          </section>
        ),
      )}
    </main>
  );
}
