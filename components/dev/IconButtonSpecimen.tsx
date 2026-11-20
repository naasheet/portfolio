import { Hand, Sun, Volume2 } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";
import { DevState } from "./DevState";
import { forced } from "./devStates";

/** IconButton: every state, plus the labelled AR toggle form. */
export function IconButtonSpecimen() {
  const p = { "aria-label": "Mute sound", icon: <Volume2 /> };
  return (
    <div className="flex flex-wrap items-start gap-8">
      <DevState label="Default (live)">
        <IconButton {...p} />
      </DevState>
      <DevState label="Hover">
        <IconButton {...p} tabIndex={-1} className={forced.iconHover} />
      </DevState>
      <DevState label="Pressed">
        <IconButton
          {...p}
          tabIndex={-1}
          className={cn(forced.iconHover, forced.pressed)}
        />
      </DevState>
      <DevState label="Focus-visible">
        <IconButton {...p} tabIndex={-1} className={forced.focus} />
      </DevState>
      <DevState label="Disabled">
        <IconButton {...p} disabled />
      </DevState>
      <DevState label="Active · aria-pressed">
        <IconButton {...p} pressed />
      </DevState>
      <DevState label="With label (AR toggle)">
        <IconButton
          aria-label="Turn on hand control"
          icon={<Hand />}
          label="AR"
          indicator
        />
      </DevState>
      <DevState label="Theme">
        <IconButton aria-label="Switch theme" icon={<Sun />} />
      </DevState>
    </div>
  );
}
