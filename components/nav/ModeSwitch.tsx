"use client";

import { Hand, MousePointer2 } from "lucide-react";
import { m } from "framer-motion";
import { useId } from "react";
import { copy } from "@/content/copy";
import { colorTransition, focusRing } from "@/components/ui/controlStyles";
import { spring } from "@/lib/motion/tokens";
import { setHandMode } from "@/lib/shortcuts";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { navHeight } from "./navStyles";

const OPTIONS = [
  { hand: false, label: copy.nav.mouse, Icon: MousePointer2 },
  { hand: true, label: copy.nav.hand, Icon: Hand },
] as const;

/**
 * Mouse | Hand. Hand is the AR toggle (shortcut A): it flips ar.enabled; phase 8 turns the
 * camera on from that flag. The current option is a solid light pill that slides across.
 */
export function ModeSwitch({
  compact = false,
  className,
}: {
  /** Tighter pills (the phone menu's control row). */
  compact?: boolean;
  className?: string;
}) {
  const handOn = useStore((s) => s.ar.enabled);
  const pillId = useId();

  return (
    <div
      role="group"
      aria-label={copy.nav.mode}
      className={cn(
        "flex items-center gap-1 rounded-chip glass p-1",
        navHeight,
        className,
      )}
    >
      {OPTIONS.map(({ hand, label, Icon }) => {
        const current = handOn === hand;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={current}
            data-cursor="orbit"
            onClick={() => setHandMode(hand)}
            className={cn(
              "relative flex h-full cursor-pointer items-center rounded-chip text-subhead select-none",
              compact ? "px-3" : "px-4",
              current
                ? "text-bg-base"
                : "text-text-secondary hover:text-text-primary",
              colorTransition,
              focusRing,
            )}
          >
            {current ? (
              <m.span
                aria-hidden
                layoutId={pillId}
                className="absolute inset-0 rounded-chip bg-text-primary"
                transition={spring.snappy}
              />
            ) : null}
            <span className="relative flex items-center gap-2 [&_svg]:size-4">
              <Icon aria-hidden />
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
