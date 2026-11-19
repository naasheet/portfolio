import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ColorSwatches } from "@/components/dev/ColorSwatches";
import { DevSection } from "@/components/dev/DevSection";
import { MotionSpecimen } from "@/components/dev/MotionSpecimen";
import { RadiusSpecimen } from "@/components/dev/RadiusSpecimen";
import { ShadowSpecimen } from "@/components/dev/ShadowSpecimen";
import { ThemeToggle } from "@/components/dev/ThemeToggle";
import { TypeSpecimen } from "@/components/dev/TypeSpecimen";

/*
 * /dev — token and component specimen page. Never linked from the site.
 * Strings here are developer labels, not visitor copy, so they don't live in content/.
 * Phase 1 adds a section per component.
 */

export const metadata: Metadata = {
  title: "Dev specimen",
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { id: "type", label: "Type" },
  { id: "colours", label: "Colours" },
  { id: "radii", label: "Radii" },
  { id: "shadows", label: "Shadows" },
  { id: "motion", label: "Motion" },
] as const;

export default function DevPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_SHOW_DEV !== "1"
  ) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-16 px-4 pb-24 md:px-8">
      <header className="sticky top-0 z-content -mx-4 flex flex-wrap items-center justify-between gap-4 border-b border-border-default bg-glass-fill px-4 py-4 backdrop-blur-glass md:-mx-8 md:px-8">
        <div className="flex flex-col">
          <h1 className="text-title-1 font-bold">Specimen</h1>
          <nav aria-label="Sections" className="flex flex-wrap gap-4">
            {SECTIONS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-control text-subhead text-text-secondary transition-colors duration-150 ease-out hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
        <ThemeToggle />
      </header>

      <DevSection
        id="type"
        title="Type"
        note="Values are read from the browser, not typed in."
      >
        <TypeSpecimen />
      </DevSection>

      <DevSection
        id="colours"
        title="Colours"
        note="Every --color-* token found in the stylesheet, with its value in the current theme. Compare with CLAUDE.md §8."
      >
        <ColorSwatches />
      </DevSection>

      <DevSection id="radii" title="Radii">
        <RadiusSpecimen />
      </DevSection>

      <DevSection
        id="shadows"
        title="Shadows"
        note="On glass cards (glass fill, blur 24 px, hairline)."
      >
        <ShadowSpecimen />
      </DevSection>

      <DevSection
        id="motion"
        title="Motion"
        note="Durations use the ease-out curve; springs are Framer Motion presets. Reduced motion makes them jump."
      >
        <MotionSpecimen />
      </DevSection>
    </div>
  );
}
