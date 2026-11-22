import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BentoSpecimen } from "@/components/dev/BentoSpecimen";
import { ButtonSpecimen } from "@/components/dev/ButtonSpecimen";
import { CardKitSpecimen } from "@/components/dev/CardKitSpecimen";
import { CardSpecimen } from "@/components/dev/CardSpecimen";
import { ChipSpecimen } from "@/components/dev/ChipSpecimen";
import { CursorSpecimen } from "@/components/dev/CursorSpecimen";
import { ColorSwatches } from "@/components/dev/ColorSwatches";
import { DevSection } from "@/components/dev/DevSection";
import { IconButtonSpecimen } from "@/components/dev/IconButtonSpecimen";
import { IslandSpecimen } from "@/components/dev/IslandSpecimen";
import { KbdTooltipDividerSpecimen } from "@/components/dev/KbdTooltipDividerSpecimen";
import { MediaSpecimen } from "@/components/dev/MediaSpecimen";
import { MotionSpecimen } from "@/components/dev/MotionSpecimen";
import { OverlaySpecimen } from "@/components/dev/OverlaySpecimen";
import { PreloadSpecimen } from "@/components/dev/PreloadSpecimen";
import { ProjectCardSpecimen } from "@/components/dev/ProjectCardSpecimen";
import { RadiusSpecimen } from "@/components/dev/RadiusSpecimen";
import { ShadowSpecimen } from "@/components/dev/ShadowSpecimen";
import { StatusChipSpecimen } from "@/components/dev/StatusChipSpecimen";
import { TextMotionSpecimen } from "@/components/dev/TextMotionSpecimen";
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
  { id: "buttons", label: "Button" },
  { id: "icon-buttons", label: "IconButton" },
  { id: "chips", label: "Chip" },
  { id: "status-chips", label: "StatusChip" },
  { id: "kbd-tooltip-divider", label: "Kbd · Tooltip · Divider" },
  { id: "cards", label: "Card" },
  { id: "bento", label: "Bento" },
  { id: "text-motion", label: "Text motion" },
  { id: "card-kit", label: "Card kit" },
  { id: "project-card", label: "ProjectCard" },
  { id: "overlays", label: "Overlays" },
  { id: "media", label: "Media" },
  { id: "cursor", label: "Cursor and sound" },
  { id: "preload", label: "Preloader" },
  { id: "gate", label: "Entry gate" },
  { id: "island", label: "Nav island" },
] as const;

export default function DevPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_SHOW_DEV !== "1"
  ) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-16 px-4 pt-22 pb-24 md:px-8">
      <header className="sticky top-22 z-content -mx-4 flex flex-wrap items-center justify-between gap-4 border-b border-border-default bg-glass-fill px-4 py-4 backdrop-blur-glass md:-mx-8 md:px-8">
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

      <DevSection
        id="buttons"
        title="Button"
        note="Default is the live control; hover, pressed and focus cells fake their state with classes so they sit side by side like the sheet. Hover and press change only colour or scale. Loading keeps the width."
      >
        <ButtonSpecimen />
      </DevSection>

      <DevSection
        id="icon-buttons"
        title="IconButton"
        note="44 × 44, radius 12. aria-label is required by the type."
      >
        <IconButtonSpecimen />
      </DevSection>

      <DevSection
        id="chips"
        title="Chip"
        note="Selectable filter pill with aria-pressed. Selected adds a check, a teal tint and a teal border."
      >
        <ChipSpecimen />
      </DevSection>

      <DevSection
        id="status-chips"
        title="StatusChip"
        note="The dot carries the state; the text stays text/secondary. The pulse is CSS and keeps running under reduced motion."
      >
        <StatusChipSpecimen />
      </DevSection>

      <DevSection
        id="kbd-tooltip-divider"
        title="Kbd, Tooltip, Divider"
        note="Kbd is SF Mono 12/16 on surface/solid. Tooltip opens 300 ms after hover, instantly on keyboard focus; Esc closes it."
      >
        <KbdTooltipDividerSpecimen />
      </DevSection>

      <DevSection
        id="cards"
        title="Card"
        note="Glass, solid and media. Interactive cards lift 2 px, gain the lift shadow and a pointer spotlight, and the border turns text/tertiary. Mouse only: touch gets none of it. The hover cell is forced with data-state."
      >
        <CardSpecimen />
      </DevSection>

      <DevSection
        id="bento"
        title="Bento"
        note="1 column on phones, 6 on tablets (768+), 12 on desktop (1024+). 16 px gap, rows at least 160 px. Spans are CSS variables, not generated class names."
      >
        <BentoSpecimen />
      </DevSection>

      <DevSection
        id="text-motion"
        title="Text motion"
        note="RevealText, useCountUp, ScrambleText and Marquee. Replay remounts each demo. Under reduced motion every one of them shows its final state at once."
      >
        <TextMotionSpecimen />
      </DevSection>

      <DevSection
        id="card-kit"
        title="Card kit"
        note="Every card from the kit in one bento, fed by components/dev/fixtures.ts (placeholders, TODO(content)). Toggle the theme in the header to check both. The CTA button form and the terminal row log their clicks above; the CTA also toggles the now-playing bars."
      >
        <CardKitSpecimen />
      </DevSection>

      <DevSection
        id="project-card"
        title="ProjectCard"
        note="Work's card (4.4): cover, Case study badge, title and arrow, role and year, up to four stack tags. With a preview, the dev loop plays while the card is hovered or focused (mouse) or on screen (touch), with a pill and the clip's length."
      >
        <ProjectCardSpecimen />
      </DevSection>

      <DevSection
        id="overlays"
        title="Overlays"
        note="Sheet, modal, top drawer and toasts. Everything works by keyboard: Tab stays inside, Esc closes the topmost overlay, focus goes back to its button, and the page behind never scrolls."
      >
        <OverlaySpecimen />
      </DevSection>

      <DevSection
        id="media"
        title="Media"
        note="Img (blur placeholder, 300 ms fade-in, width and height required), LoopVideo (plays only on screen and with the tab visible; never under reduced motion or Save-Data), Avatar and the icon sizes. All media here is a dev placeholder."
      >
        <MediaSpecimen />
      </DevSection>

      <DevSection
        id="cursor"
        title="Cursor and sound"
        note="The custom cursor (mouse only; off on touch and with reduced motion), magnetic controls and UI sounds. Sounds are silent until sound is turned on below."
      >
        <CursorSpecimen />
      </DevSection>

      <DevSection
        id="preload"
        title="Preloader"
        note="lib/preload.ts on the dev placeholder assets. Set DevTools to Slow 4G and compare the received column with the Network tab. The big number is the eased value the gate will show: it never passes the real one."
      >
        <PreloadSpecimen />
      </DevSection>

      <DevSection
        id="gate"
        title="Entry gate"
        note="Shown once per visitor; repeat visits skip it. ?gate in the URL forces it. A plain link, so the page fully reloads."
      >
        <a
          href="/dev?gate"
          className="self-start rounded-control text-subhead text-accent-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          Replay the gate
        </a>
      </DevSection>

      <DevSection
        id="island"
        title="Nav island"
        note="The real island in the nav (2.4). Hover it (desktop) for the links; click the art or the bars to expand; Esc or a click outside collapses. Success and info toasts become island alerts; errors with an action stay in the corner. Press ? for the shortcuts."
      >
        <IslandSpecimen />
      </DevSection>
    </div>
  );
}
