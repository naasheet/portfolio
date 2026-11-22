"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { copy } from "@/content/copy";
import { colorTransition, focusRing } from "@/components/ui/controlStyles";
import { getAudioContext } from "@/lib/audio/context";
import { startMusic } from "@/lib/music";
import { initSfx } from "@/lib/sfx";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { navHeight } from "./navStyles";

/**
 * Repeat visit, sound was on last time: the browser needs a new gesture before it allows
 * audio, so a "Tap for sound" pill sits left of the circles. The visitor's first click or key
 * press anywhere starts sound (it's their saved choice) and the pill goes.
 */
export function TapForSound({ className }: { className?: string }) {
  const on = useStore((s) => s.ui.soundEnabled);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    // Sound is saved as on but nothing has created the AudioContext yet this load.
    if (!on || getAudioContext()) return;
    const start = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key === "Escape") return;
      setWaiting(false);
      if (useStore.getState().ui.soundEnabled) {
        void initSfx();
        void startMusic();
      }
    };
    const ready = window.setTimeout(() => setWaiting(true), 0);
    const opts = { capture: true, once: true } as const;
    window.addEventListener("pointerdown", start, opts);
    window.addEventListener("keydown", start, opts);
    return () => {
      window.clearTimeout(ready);
      window.removeEventListener("pointerdown", start, opts);
      window.removeEventListener("keydown", start, opts);
    };
  }, [on]);

  if (!waiting || !on) return null;
  return (
    <button
      type="button"
      data-cursor="orbit"
      onClick={() => {
        void initSfx();
        void startMusic();
      }}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-chip border-accent-primary/60 glass px-4 text-subhead text-accent-primary hover:border-accent-primary [&_svg]:size-4",
        navHeight,
        colorTransition,
        focusRing,
        className,
      )}
    >
      <Volume2 aria-hidden />
      {copy.nav.tapForSound}
    </button>
  );
}
