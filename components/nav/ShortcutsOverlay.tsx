"use client";

import { copy } from "@/content/copy";
import { Modal } from "@/components/overlay/Modal";
import { Kbd } from "@/components/ui/Kbd";
import { SHORTCUTS, type ShortcutGroup } from "@/lib/shortcuts";
import { useStore } from "@/lib/store";
import { KeyboardDrawing } from "./KeyboardDrawing";

/** Keys lit on the drawing: every shortcut's key ("?" is Shift + /, drawn as the / key). */
const LIT = new Set(
  SHORTCUTS.flatMap((s) => s.lit ?? [s.key === "?" ? "/" : s.key]),
);

const GROUPS: readonly ShortcutGroup[] = ["everywhere", "home"];

/** The ? overlay (Navigation board): a wide Modal with the keyboard drawing and the list. */
export function ShortcutsOverlay() {
  const open = useStore((s) => s.ui.shortcutsOpen);
  const setOpen = useStore((s) => s.ui.setShortcutsOpen);

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={copy.shortcuts.title}
      description={copy.shortcuts.description}
      closeLabel={copy.shortcuts.close}
      dismissOnBackdrop
      className="w-180"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="hidden md:block">
          <KeyboardDrawing lit={LIT} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {GROUPS.map((group) => (
            <section key={group} aria-label={copy.shortcuts.groups[group]}>
              <h3 className="text-caption-1 text-text-tertiary">
                {copy.shortcuts.groups[group]}
              </h3>
              <ul className="flex flex-col">
                {SHORTCUTS.filter((s) => s.group === group).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 border-b border-border-default py-2 text-subhead text-text-primary last:border-b-0"
                  >
                    <Kbd className="min-w-8 shrink-0 whitespace-nowrap">{s.key}</Kbd>
                    {s.label}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </Modal>
  );
}
