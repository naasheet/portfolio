"use client";

import { ArrowUpRight, Volume2, VolumeX } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/IconButton";
import { initSfx } from "@/lib/sfx";
import { useStore } from "@/lib/store";

function Tile({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <figure className="flex flex-col gap-2">
      <div className="flex h-44 items-center justify-center rounded-card border border-border-default bg-bg-base p-6">
        {children}
      </div>
      <figcaption className="flex flex-col">
        <span className="text-subhead font-semibold">{title}</span>
        <span className="text-caption-1 text-text-tertiary">{note}</span>
      </figcaption>
    </figure>
  );
}

/** One tile per cursor state from the Cursor board, plus the UI-sound controls. */
export function CursorSpecimen() {
  const soundEnabled = useStore((s) => s.ui.soundEnabled);
  const setSoundEnabled = useStore((s) => s.ui.setSoundEnabled);
  const [filter, setFilter] = useState("All");

  // Temporary stand-in for the entry gate (2.1): the AudioContext must be created in a click.
  const toggleSound = () => {
    if (soundEnabled) {
      setSoundEnabled(false);
      return;
    }
    setSoundEnabled(true);
    void initSfx();
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          title="Default"
          note="6 px dot on the pointer, 32 px ring 0.15 s behind"
        >
          <span className="text-footnote text-text-tertiary">
            Move the mouse here
          </span>
        </Tile>
        <Tile
          title="Hover"
          note='data-cursor="hover": ring 56 px with a 12% fill, dot hides'
        >
          <Button variant="secondary" trailingIcon={<ArrowUpRight />}>
            Work with me
          </Button>
        </Tile>
        <Tile
          title="Pressed"
          note="Hold the mouse button: the ring shrinks to 24 px"
        >
          <Button variant="ghost">Press and hold</Button>
        </Tile>
        <Tile
          title="Text"
          note='data-cursor="text" or any input: a 2 × 22 px bar'
        >
          <p data-cursor="text" className="text-subhead text-text-secondary">
            I design interfaces, then build them, with motion, 3D and an
            unhealthy interest in easing curves.
          </p>
        </Tile>
        <Tile
          title="Magnetic"
          note="IconButtons and primary buttons: 60 px radius, 8 px max pull"
        >
          <div className="flex items-center gap-6">
            <IconButton aria-label="Mute sound" icon={<Volume2 />} />
            <Button>Primary</Button>
          </div>
        </Tile>
        <Tile
          title="Label"
          note='data-cursor="view" with data-cursor-label: an 80 px disc'
        >
          <div
            data-cursor="view"
            data-cursor-label="View"
            className="flex size-full items-center justify-center rounded-control bg-linear-to-br from-accent-primary/40 to-accent-secondary/30"
          />
        </Tile>
        <Tile title="Input" note="Inputs and textareas always get the text bar">
          <input
            aria-label="Sample field"
            placeholder="Type here"
            className="h-11 w-full rounded-control border border-border-default bg-surface-solid px-4 text-subhead text-text-primary placeholder:text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          />
        </Tile>
        <Tile title="Disabled" note="No hover state, no magnet, no sound">
          <Button disabled>Disabled</Button>
        </Tile>
      </div>

      <div className="flex flex-col gap-4 rounded-card border border-border-default p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant="secondary"
            sound={false}
            leadingIcon={soundEnabled ? <Volume2 /> : <VolumeX />}
            onClick={toggleSound}
            aria-pressed={soundEnabled}
          >
            {soundEnabled ? "Sound on" : "Sound off"}
          </Button>
          <span className="text-footnote text-text-tertiary">
            Stand-in for the entry gate (2.1). After a reload, turn it off and
            on again: the browser needs a click before it plays audio.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button>Click sound</Button>
          <Button variant="ghost" sound={false}>
            sound={"{false}"}
          </Button>
          {["All", "Web", "3D"].map((f) => (
            <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>
              {f}
            </Chip>
          ))}
        </div>
        <Card interactive className="max-w-sm">
          <span className="text-subhead">
            Interactive card: hover tick and click
          </span>
        </Card>
      </div>
    </div>
  );
}
