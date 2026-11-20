import type { CSSProperties } from "react";
import { Card } from "@/components/ui/Card";
import { DevState } from "./DevState";
import { forced, forcedCardHover } from "./devStates";

function Body({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex h-full min-h-24 flex-col justify-between gap-4">
      <span className="text-headline">{title}</span>
      <span className="text-footnote text-text-secondary">{note}</span>
    </div>
  );
}

// Where the forced-hover spotlight sits (px from the card's top left).
const SPOT = { "--x": "200px", "--y": "40px" } as CSSProperties;

/** Card: the three variants and the interactive states, as on component sheet 2. */
export function CardSpecimen() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <DevState
        label="glass · blur 24 · 1 px border · top highlight"
        className="[&>div]:w-full"
      >
        <Card className="w-full">
          <Body title="Glass" note="Default surface" />
        </Card>
      </DevState>
      <DevState
        label="solid · surface/solid, no blur"
        className="[&>div]:w-full"
      >
        <Card variant="solid" className="w-full">
          <Body title="Solid" note="For dense content" />
        </Card>
      </DevState>
      <DevState
        label="media · edge-to-edge image or video"
        className="[&>div]:w-full"
      >
        <Card variant="media" className="w-full">
          <div className="flex h-32 flex-col justify-end bg-linear-to-br from-accent-primary/40 to-accent-secondary/30 p-4">
            <span className="text-headline">Media</span>
            <span className="text-footnote text-text-secondary">
              edge to edge · no padding
            </span>
          </div>
        </Card>
      </DevState>
      <DevState
        label="radius 24 · padding 24 · gap 16"
        className="[&>div]:w-full"
      >
        <Card className="w-full">
          <div className="rounded-control border border-dashed border-border-default">
            <Body title="Glass" note="Spec: dashed box is the padding edge" />
          </div>
        </Card>
      </DevState>

      <DevState
        label="Interactive · rest (live: hover me)"
        className="[&>div]:w-full"
      >
        <Card interactive className="w-full">
          <Body title="Interactive" note="Rest" />
        </Card>
      </DevState>
      <DevState
        label="Hover · lift 2 px, shadow, spotlight, border"
        className="[&>div]:w-full"
      >
        <Card interactive className="w-full" style={SPOT} {...forcedCardHover}>
          <Body title="Interactive" note="Hover" />
        </Card>
      </DevState>
      <DevState
        label="Focus-visible · 2 px accent ring (live: Tab)"
        className="[&>div]:w-full"
      >
        <Card href="#cards" className={`w-full ${forced.focus}`} tabIndex={-1}>
          <Body title="Interactive" note="Focus" />
        </Card>
      </DevState>
      <DevState
        label="Touch · no lift, no spotlight"
        className="[&>div]:w-full"
      >
        <Card href="#cards" className="w-full">
          <Body title="Interactive" note="On touch (live link)" />
        </Card>
      </DevState>
    </div>
  );
}
