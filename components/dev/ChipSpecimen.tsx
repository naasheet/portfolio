"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { DevState } from "./DevState";
import { forced } from "./devStates";

const FILTERS = ["All", "Web", "3D", "Games"] as const;

/** Chip: every state, plus a live filter group. */
export function ChipSpecimen() {
  const [active, setActive] = useState<string>("All");
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start gap-8">
        <DevState label="Default">
          <Chip tabIndex={-1}>Web</Chip>
        </DevState>
        <DevState label="Hover">
          <Chip tabIndex={-1} className={forced.chipHover}>
            Web
          </Chip>
        </DevState>
        <DevState label="Selected · aria-pressed">
          <Chip tabIndex={-1} selected>
            Web
          </Chip>
        </DevState>
        <DevState label="Selected + hover">
          <Chip tabIndex={-1} selected className={forced.chipSelectedHover}>
            Web
          </Chip>
        </DevState>
        <DevState label="Focus-visible">
          <Chip tabIndex={-1} className={forced.focus}>
            Web
          </Chip>
        </DevState>
        <DevState label="Disabled">
          <Chip disabled>Web</Chip>
        </DevState>
        <DevState label="With count">
          <Chip tabIndex={-1} selected count={9}>
            All
          </Chip>
        </DevState>
      </div>
      <DevState label="Live: click, or Tab then Space">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Chip
              key={f}
              selected={active === f}
              onClick={() => setActive(f)}
              count={f === "All" ? 9 : undefined}
            >
              {f}
            </Chip>
          ))}
        </div>
      </DevState>
    </div>
  );
}
