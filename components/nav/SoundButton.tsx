"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { copy } from "@/content/copy";
import { IconButton } from "@/components/ui/IconButton";
import { Kbd } from "@/components/ui/Kbd";
import { Tooltip } from "@/components/ui/Tooltip";
import { toggleSound } from "@/lib/shortcuts";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { EqBars } from "./EqBars";
import { navCircle } from "./navStyles";

const HINT_DELAY_MS = 900;
const HINT_MS = 4000;

/**
 * The sound circle: a muted speaker when off, a speaker when on, live equalizer bars while
 * music plays. On a first visit (the gate ran this load) it pulses once and shows its tooltip,
 * "Sound is off · M", for 4 s after the visitor gets in (the 2.2 carry-over).
 */
export function SoundButton() {
  const on = useStore((s) => s.ui.soundEnabled);
  const playing = useStore((s) => s.audio.playing);
  const entered = useStore((s) => s.ui.entered);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if (!entered) return;
    const firstVisit = document.documentElement.dataset.gate === "done";
    if (!firstVisit || useStore.getState().ui.soundEnabled) return;
    const show = window.setTimeout(() => setHint(true), HINT_DELAY_MS);
    const hide = window.setTimeout(
      () => setHint(false),
      HINT_DELAY_MS + HINT_MS,
    );
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [entered]);

  const label = on ? copy.nav.soundOn : copy.nav.soundOff;

  return (
    <Tooltip
      side="bottom"
      align="end"
      forceOpen={hint && !on}
      content={
        <>
          {label}
          <Kbd>M</Kbd>
        </>
      }
    >
      <IconButton
        aria-label={copy.shortcuts.sound}
        pressed={on}
        data-pulse={hint ? "" : undefined}
        onClick={() => {
          setHint(false);
          toggleSound();
        }}
        icon={
          playing ? (
            <EqBars className="text-island-accent" />
          ) : on ? (
            <Volume2 />
          ) : (
            <VolumeX />
          )
        }
        className={cn(navCircle, "sound-pulse")}
      />
    </Tooltip>
  );
}
